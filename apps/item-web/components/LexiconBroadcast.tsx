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
];

const MATH_POOL = "∀∂∃∅∆∇∈∉∋∏∑−∓√∞∟∠∧∨∩∪∫∴∵∼≈≠≡≤≥⊂⊃⊆⊇⊕⊗⊙⊥⋈⋔⋮⋰⌁⌇⌖⌬⌭⏣⟁⟐⟠⟡⟴⧉⧖⧗⊹◌";
const MACHINE_POOL = "⌁⌭⟐⊙⋔⟟⋈⊚⫶⌬⏣⟡⋮⧖⟁⟠⌿⊹⧉◌⟴⌂⌇⋰⌖⧗⫷⫸⟢⟣⧫⧬⧭⧮⧯";
const DIGIT_POOL = "0123456789０１２３４５６７８９ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ";

const BroadcastContext = createContext({ tick: 0, reducedMotion: false });

function stableHash(source: string): number {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function choose(pool: string, seed: number): string {
  const values = Array.from(pool);
  return values[seed % values.length] ?? "⌁";
}

function mutateCharacter(character: string, index: number, text: string, tick: number): string {
  if (/\s/u.test(character)) return character;

  const seed = stableHash(`${text}|${index}`);
  const localTick = tick + (seed % 17);

  // Every character has a different reveal cadence, so the sentence never
  // changes as one synchronized block. Roughly half the glyphs remain human
  // at any instant, preserving orientation while the surface stays alien.
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
  const effectiveTick = reducedMotion ? 0 : tick + phase;

  return (
    <Component
      className={`${styles.lexicon} ${className}`.trim()}
      data-lexicon-flicker="character-broadcast-v1"
      data-cycle-ms="500"
    >
      {semantic && <span className={styles.srOnly}>{text}</span>}
      <span className={styles.visual} aria-hidden={semantic ? "true" : undefined}>
        {characters.map((character, index) => (
          <span className={styles.character} key={`${index}-${character}`}>
            {reducedMotion ? character : mutateCharacter(character, index, text, effectiveTick)}
          </span>
        ))}
      </span>
    </Component>
  );
}
