"use client";

import {
  createContext,
  type ElementType,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./LexiconBroadcast.module.css";

const TICK_MS = 125;
const SCRIPT_EPOCH_TICKS = 4; // 500 ms: script family / communication mode changes.

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

function choose(pool: string[], seed: number): string {
  return pool[seed % pool.length] ?? "⌁";
}

function mutateCharacter(character: string, index: number, seed: number, tick: number): string {
  if (/\s/u.test(character)) return character;

  const localTick = tick + (seed % 17);

  // Every character owns a different reveal cadence. The phrase therefore
  // never flips as a synchronized word or sentence.
  if ((localTick + index) % 5 < 2) return character;

  const epoch = Math.floor(localTick / SCRIPT_EPOCH_TICKS);
  const communicationMode = (epoch + seed) % (SCRIPT_POOLS.length + 2);

  if (/\p{N}/u.test(character)) return choose(DIGIT_POOL, seed + localTick);
  if (/\p{P}|\p{S}/u.test(character)) {
    return choose(communicationMode % 2 === 0 ? MATH_POOL : MACHINE_POOL, seed + localTick);
  }
  if (communicationMode === SCRIPT_POOLS.length) return choose(MATH_POOL, seed + localTick);
  if (communicationMode === SCRIPT_POOLS.length + 1) return choose(MACHINE_POOL, seed + localTick);

  return choose(SCRIPT_POOLS[communicationMode] ?? MACHINE_POOL, seed + localTick);
}

export function LexiconBroadcastProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const applyPreference = () => setReducedMotion(media.matches);
    applyPreference();
    media.addEventListener("change", applyPreference);

    if (media.matches) {
      return () => media.removeEventListener("change", applyPreference);
    }

    const interval = window.setInterval(() => {
      setTick((current) => (current + 1) % 1_000_000);
    }, TICK_MS);

    return () => {
      window.clearInterval(interval);
      media.removeEventListener("change", applyPreference);
    };
  }, [reducedMotion]);

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
  const { tick, reducedMotion } = useLexiconBroadcast();
  const characters = useMemo(() => Array.from(text), [text]);
  const seeds = useMemo(
    () => characters.map((_character, index) => stableHash(`${text}|${index}`)),
    [characters, text],
  );
  const effectiveTick = reducedMotion ? 0 : tick + phase;
  const mutated = useMemo(
    () => reducedMotion
      ? text
      : characters.map((character, index) => mutateCharacter(character, index, seeds[index] ?? index, effectiveTick)).join(""),
    [characters, effectiveTick, reducedMotion, seeds, text],
  );

  return (
    <Component
      className={`${styles.lexicon} ${className}`.trim()}
      data-lexicon-flicker="character-broadcast-v1"
      data-cycle-ms="500"
    >
      {semantic && <span className={styles.srOnly}>{text}</span>}
      <span className={styles.visual} aria-hidden="true">
        <span className={styles.original}>{text}</span>
        <span className={styles.mutated}>{mutated}</span>
      </span>
    </Component>
  );
}
