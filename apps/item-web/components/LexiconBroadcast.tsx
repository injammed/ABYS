"use client";

import {
  createContext,
  type ElementType,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import styles from "./LexiconBroadcast.module.css";

// Semantic-language staging remains deliberately cheap. The visible character
// field is driven by the separate frame-bounded engine below.
const TICK_MS = 125;
const SCRIPT_EPOCH_TICKS = 4; // 500 ms semantic envelope for MachineGloss.

// The carrier is virtual, not a demand that the browser physically paint every
// state. 299,792,458 is a deliberate c-signature; multiplying by 2^24 keeps the
// one-second carrier window below Number.MAX_SAFE_INTEGER while representing
// roughly five quadrillion deterministic language states per second.
const C_SIGNATURE = 299_792_458;
const VIRTUAL_CARRIER_SCALE = 16_777_216;
const VIRTUAL_CARRIER_STATES_PER_SECOND = C_SIGNATURE * VIRTUAL_CARRIER_SCALE;

// 24 Hz is a deliberate stroboscopic sampling ceiling: the browser observes a
// vanishing fraction of the virtual carrier, producing a wagon-wheel alias
// instead of trying to burn CPU/GPU rendering unobservable intermediate states.
const MAX_VISIBLE_SAMPLE_FPS = 24;
const MIN_VISIBLE_SAMPLE_MS = 1000 / MAX_VISIBLE_SAMPLE_FPS;
const ALIAS_DRIFT_HZ = 0.075;
const PHASE_BANDS = 16;
const CARRIER_WRAP_MS = 1000;
const DARK_DERANGEMENT_MULTIPLIER = 10;

const SCRIPT_POOLS = [
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÆØÐÞŁŒƏƵƷȜ",
  "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω",
  "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯабвгдежзийклмнопрстуфхцчшщыэюя",
  "אבגדהוזחטיכלמנסעפצקרשת",
  "ابتثجحخدذرزسشصضطظعغفقكلمنهوي",
  "अआइईउऊऋएकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह",
  "অআইঈউঊএকখগঘচছজঝটঠডঢতথদধনপফবভমযরলশসহ",
  "กขฃคฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหอฮ",
  "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ",
  "ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖ",
  "あいうえおかきくけこさしすせそたちつてとなにぬねのまみむめもらりるれろ",
  "アイウエオカキクケコサシスセソタチツテトナニヌネノマミムメモラリルレロ",
  "天地人機夢光闇空時記憶永遠真理星海無限構造信号生成保存観測",
  "ᄀᄂᄃᄅᄆᄇᄉᄋᄌᄎᄏᄐᄑᄒ가나다라마바사아자차카타파하",
  "ሀሁሂሃሄህሆለሉሊላሌልሎሐሑሒሓሔሕሖመሙሚማሜምሞ",
].map((pool) => Array.from(pool));

const MATH_POOL = Array.from("∀∂∃∅∆∇∈∉∋∏∑−∓√∞∟∠∧∨∩∪∫∴∵∼≈≠≡≤≥⊂⊃⊆⊇⊕⊗⊙⊥⋈⋔⋮⋰⌁⌇⌖⌬⌭⏣⟁⟐⟠⟡⟴⧉⧖⧗⊹◌");
const MACHINE_POOL = Array.from("⌁⌭⟐⊙⋔⟟⋈⊚⫶⌬⏣⟡⋮⧖⟁⟠⌿⊹⧉◌⟴⌂⌇⋰⌖⧗⫷⫸⟢⟣⧫⧬⧭⧮⧯");
const DIGIT_POOL = Array.from("0123456789０１２３４５６７８９ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ");

const BroadcastContext = createContext({ tick: 0, reducedMotion: false });

function stableHash(source: string): number {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mix32(value: number): number {
  let mixed = value | 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

function positiveFraction(value: number): number {
  return ((value % 1) + 1) % 1;
}

function normalizeIndex(value: number, length: number): number {
  if (length <= 0) return 0;
  return ((value % length) + length) % length;
}

function chooseAt(pool: string[], index: number): string {
  return pool[normalizeIndex(index, pool.length)] ?? "⌁";
}

function virtualCarrierSample(nowMs: number): number {
  // Wrapping each second keeps the multiplication inside the exact-integer
  // range of JavaScript Number. The second epoch is folded back into the hash,
  // so the sampled sequence does not visibly repeat at the wrap boundary.
  const epoch = Math.floor(nowMs / CARRIER_WRAP_MS);
  const withinSecond = (nowMs % CARRIER_WRAP_MS) / CARRIER_WRAP_MS;
  const virtualState = Math.floor(withinSecond * VIRTUAL_CARRIER_STATES_PER_SECOND);
  return mix32(virtualState + mix32(epoch));
}

function aliasPhaseAt(nowMs: number, phase: number): number {
  return positiveFraction((nowMs / 1000) * ALIAS_DRIFT_HZ + (phase % PHASE_BANDS) / PHASE_BANDS);
}

function mutateCharacter(
  character: string,
  index: number,
  seed: number,
  carrierSample: number,
  aliasPhase: number,
  echoOffset = 0,
): string {
  if (/\s/u.test(character)) return character;

  const band = (index + (seed % PHASE_BANDS)) % PHASE_BANDS;
  const direction = (seed & 1) === 0 ? 1 : -1;
  const localAlias = positiveFraction(
    aliasPhase * direction + band / PHASE_BANDS + echoOffset * 0.011,
  );
  const carrierSalt = mix32(
    carrierSample
      ^ seed
      ^ Math.imul(index + 1, 0x9e3779b1)
      ^ Math.imul(echoOffset + 1, 0x85ebca6b),
  );
  const communicationModeCount = SCRIPT_POOLS.length + 2;
  const communicationMode = (
    Math.floor(localAlias * communicationModeCount)
    + (carrierSalt % communicationModeCount) * DARK_DERANGEMENT_MULTIPLIER
  ) % communicationModeCount;
  const microOffset = (carrierSalt % (DARK_DERANGEMENT_MULTIPLIER * 2 + 1))
    - DARK_DERANGEMENT_MULTIPLIER;

  if (/\p{N}/u.test(character)) {
    const slowIndex = Math.floor(localAlias * DIGIT_POOL.length);
    return chooseAt(DIGIT_POOL, slowIndex + microOffset);
  }

  if (/\p{P}|\p{S}/u.test(character)) {
    const pool = communicationMode % 2 === 0 ? MATH_POOL : MACHINE_POOL;
    const slowIndex = Math.floor(localAlias * pool.length);
    return chooseAt(pool, slowIndex + microOffset);
  }

  const pool = communicationMode === SCRIPT_POOLS.length
    ? MATH_POOL
    : communicationMode === SCRIPT_POOLS.length + 1
      ? MACHINE_POOL
      : SCRIPT_POOLS[communicationMode] ?? MACHINE_POOL;
  const slowIndex = Math.floor(localAlias * pool.length);
  return chooseAt(pool, slowIndex + microOffset);
}

function mutateText(
  source: string,
  seeds: number[],
  phase: number,
  carrierSample: number,
  aliasPhase: number,
  echoOffset = 0,
): string {
  return Array.from(source)
    .map((character, index) => mutateCharacter(
      character,
      index,
      seeds[index] ?? stableHash(`${source}|${index}`),
      carrierSample,
      aliasPhase,
      echoOffset,
    ))
    .join("");
}

type LexiconEngineEntry = {
  host: HTMLSpanElement;
  source: string;
  seeds: number[];
  phase: number;
  mutatedNode: HTMLSpanElement;
  echoNode: HTMLSpanElement;
  visible: boolean;
};

const engineEntries = new Set<LexiconEngineEntry>();
const engineEntryByHost = new WeakMap<Element, LexiconEngineEntry>();
let engineObserver: IntersectionObserver | null = null;
let engineFrame: number | null = null;
let engineLastPaintMs = 0;
let engineSampleNumber = 0;
let engineReducedMotion = false;

function ensureEngineObserver(): IntersectionObserver | null {
  if (engineObserver || typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return engineObserver;
  }

  engineObserver = new IntersectionObserver((observations) => {
    for (const observation of observations) {
      const entry = engineEntryByHost.get(observation.target);
      if (entry) entry.visible = observation.isIntersecting;
    }
  }, { rootMargin: "180px 0px" });

  return engineObserver;
}

function paintEntry(
  entry: LexiconEngineEntry,
  nowMs: number,
  carrierSample: number,
  paintEcho: boolean,
): void {
  if (!entry.visible || entry.host.dataset.pointerTranslated === "true") return;

  const aliasPhase = aliasPhaseAt(nowMs, entry.phase);
  const mutated = mutateText(entry.source, entry.seeds, entry.phase, carrierSample, aliasPhase);
  if (entry.mutatedNode.textContent !== mutated) entry.mutatedNode.textContent = mutated;

  // The echo intentionally samples a neighboring virtual state at half the
  // visible cadence. It reads as a high-speed afterimage while cutting DOM
  // writes roughly in half for the secondary layer.
  if (paintEcho) {
    const echo = mutateText(
      entry.source,
      entry.seeds,
      entry.phase,
      mix32(carrierSample ^ 0xa511e9b3),
      positiveFraction(aliasPhase + 0.013),
      1,
    );
    if (entry.echoNode.textContent !== echo) entry.echoNode.textContent = echo;
  }
}

function runEngineFrame(nowMs: number): void {
  engineFrame = window.requestAnimationFrame(runEngineFrame);
  if (engineReducedMotion || document.visibilityState === "hidden") return;
  if (nowMs - engineLastPaintMs < MIN_VISIBLE_SAMPLE_MS) return;

  engineLastPaintMs = nowMs;
  engineSampleNumber += 1;
  const carrierSample = virtualCarrierSample(nowMs);
  const paintEcho = engineSampleNumber % 2 === 0;

  for (const entry of engineEntries) {
    paintEntry(entry, nowMs, carrierSample, paintEcho);
  }
}

function ensureLexiconEngine(): void {
  if (typeof window === "undefined" || engineFrame !== null || engineEntries.size === 0) return;
  engineLastPaintMs = performance.now();
  engineFrame = window.requestAnimationFrame(runEngineFrame);
}

function stopLexiconEngineIfIdle(): void {
  if (engineEntries.size > 0 || engineFrame === null || typeof window === "undefined") return;
  window.cancelAnimationFrame(engineFrame);
  engineFrame = null;
  engineLastPaintMs = 0;
}

function setLexiconEngineReducedMotion(value: boolean): void {
  engineReducedMotion = value;
  if (!value) ensureLexiconEngine();
}

function registerLexiconEntry(entry: LexiconEngineEntry): () => void {
  engineEntries.add(entry);
  engineEntryByHost.set(entry.host, entry);
  const observer = ensureEngineObserver();
  observer?.observe(entry.host);
  ensureLexiconEngine();

  return () => {
    observer?.unobserve(entry.host);
    engineEntries.delete(entry);
    engineEntryByHost.delete(entry.host);
    stopLexiconEngineIfIdle();
  };
}

export function LexiconBroadcastProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let interval: number | null = null;

    const synchronize = () => {
      const nextReducedMotion = media.matches;
      setReducedMotion(nextReducedMotion);
      setLexiconEngineReducedMotion(nextReducedMotion);

      if (nextReducedMotion && interval !== null) {
        window.clearInterval(interval);
        interval = null;
      } else if (!nextReducedMotion && interval === null) {
        interval = window.setInterval(() => {
          setTick((current) => (current + 1) % 1_000_000);
        }, TICK_MS);
      }
    };

    synchronize();
    media.addEventListener("change", synchronize);

    return () => {
      if (interval !== null) window.clearInterval(interval);
      media.removeEventListener("change", synchronize);
      setLexiconEngineReducedMotion(false);
    };
  }, []);

  const value = useMemo(() => ({ tick, reducedMotion }), [tick, reducedMotion]);
  return <BroadcastContext.Provider value={value}>{children}</BroadcastContext.Provider>;
}

export function useLexiconBroadcast() {
  return useContext(BroadcastContext);
}

type LexiconTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  phase?: number;
  semantic?: boolean;
};

export function LexiconText({
  text,
  as: Component = "span",
  className = "",
  phase = 0,
  semantic = true,
}: LexiconTextProps) {
  const [pointerTranslated, setPointerTranslated] = useState(false);
  const visualRef = useRef<HTMLSpanElement | null>(null);
  const mutatedRef = useRef<HTMLSpanElement | null>(null);
  const echoRef = useRef<HTMLSpanElement | null>(null);
  const characters = useMemo(() => Array.from(text), [text]);
  const seeds = useMemo(
    () => characters.map((_character, index) => stableHash(`${text}|${index}`)),
    [characters, text],
  );
  const initialAliasPhase = positiveFraction((phase % PHASE_BANDS) / PHASE_BANDS);
  const initialMutated = useMemo(
    () => mutateText(text, seeds, phase, 0, initialAliasPhase),
    [initialAliasPhase, phase, seeds, text],
  );
  const initialEcho = useMemo(
    () => mutateText(text, seeds, phase, mix32(0xa511e9b3), positiveFraction(initialAliasPhase + 0.013), 1),
    [initialAliasPhase, phase, seeds, text],
  );

  useEffect(() => {
    const host = visualRef.current;
    const mutatedNode = mutatedRef.current;
    const echoNode = echoRef.current;
    if (!host || !mutatedNode || !echoNode) return;

    return registerLexiconEntry({
      host,
      source: text,
      seeds,
      phase,
      mutatedNode,
      echoNode,
      visible: true,
    });
  }, [phase, seeds, text]);

  return (
    <Component
      className={`${styles.lexicon} ${pointerTranslated ? styles.pointerTranslated : ""} ${className}`.trim()}
      data-lexicon-flicker="phase-aliased-character-broadcast-v2"
      data-oscillation-contract="all-visible-interface-words-v3-light-speed-alias"
      data-hover-translation-contract="pointer-hover-exact-source-final-v1"
      data-carrier-contract="virtual-c-scale-frame-bounded-v1"
      data-virtual-carrier-states-per-second={String(VIRTUAL_CARRIER_STATES_PER_SECOND)}
      data-visible-sample-fps={String(MAX_VISIBLE_SAMPLE_FPS)}
      data-alias-hz={String(ALIAS_DRIFT_HZ)}
      onPointerEnter={(event: ReactPointerEvent<Element>) => setPointerTranslated(event.pointerType !== "touch" && event.buttons === 0)}
      onPointerLeave={() => setPointerTranslated(false)}
      onPointerDown={(event: ReactPointerEvent<Element>) => {
        if (event.pointerType === "touch") setPointerTranslated(false);
      }}
    >
      {semantic && <span className={styles.srOnly}>{text}</span>}
      <span
        ref={visualRef}
        className={styles.visual}
        data-pointer-translated={pointerTranslated ? "true" : undefined}
        aria-hidden="true"
      >
        <span className={styles.original}>{text}</span>
        <span ref={echoRef} className={styles.echo}>{initialEcho}</span>
        <span ref={mutatedRef} className={styles.mutated}>{initialMutated}</span>
        <span className={`${styles.fracture} ${styles.fractureNorth}`}>{initialEcho}</span>
        <span className={`${styles.fracture} ${styles.fractureSouth}`}>{initialMutated}</span>
        <span className={`${styles.fracture} ${styles.fractureDepth}`}>{initialEcho}</span>
      </span>
    </Component>
  );
}
