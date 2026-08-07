"use client";

import { useMemo } from "react";
import { LexiconText, useLexiconBroadcast } from "./LexiconBroadcast";
import styles from "./MachineGloss.module.css";

export type MachineGlossTranslations = {
  en: string;
  [language: string]: string | undefined;
};

type MachineGlossProps = {
  translations: MachineGlossTranslations;
  className?: string;
  density?: "quiet" | "dense";
};

const TICKS_PER_LANGUAGE = 4; // Shared clock ticks every 125 ms = 500 ms per semantic language stage.
const LANGUAGE_LABELS: Record<string, string> = {
  en: "EN",
  es: "ES",
  zh: "中文",
  ja: "日本語",
  ar: "العربية",
  hi: "हिन्दी",
  fr: "FR",
  de: "DE",
  pt: "PT",
  ru: "РУ",
  ko: "한국어",
  sw: "SW",
  id: "ID",
  tr: "TR",
};
const RTL_LANGUAGES = new Set(["ar", "fa", "he", "ur"]);

const GLYPHS = [
  "⌁", "⌭", "⟐", "⊙", "⋔", "⟟", "⋈", "⊚", "⫶", "⌬", "⏣", "⟡", "⋮",
  "⧖", "⟁", "⟠", "⌿", "⊹", "⧉", "◌", "⟴", "⌂", "⌇", "⋰", "⌖", "⧗",
];

function machineEncode(source: string): string {
  let output = "";
  for (const raw of source.toUpperCase()) {
    const code = raw.charCodeAt(0);
    if (code >= 65 && code <= 90) output += GLYPHS[code - 65];
    else if (raw >= "0" && raw <= "9") output += raw;
    else if (raw === " ") output += "  ";
    else if ("·—–:/+→←".includes(raw)) output += raw;
    else if (raw === ".") output += "•";
    else if (raw === ",") output += "⋮";
    else output += "⌁";
  }
  return output.replace(/\s{3,}/g, "  ").trim();
}

function stableHash(source: string): number {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function MachineGloss({ translations, className = "", density = "dense" }: MachineGlossProps) {
  const { tick, reducedMotion } = useLexiconBroadcast();
  const glyphs = useMemo(() => machineEncode(translations.en), [translations.en]);
  const languages = useMemo(
    () => ["en", ...Object.keys(translations).filter((language) => language !== "en" && Boolean(translations[language]))],
    [translations],
  );
  const stages = useMemo(
    () => [
      { language: "machine", text: glyphs },
      ...languages.map((language) => ({ language, text: translations[language] ?? translations.en })),
    ],
    [glyphs, languages, translations],
  );

  const phase = stableHash(translations.en) % Math.max(1, stages.length * TICKS_PER_LANGUAGE);
  const stage = reducedMotion ? 0 : Math.floor((tick + phase) / TICKS_PER_LANGUAGE) % stages.length;
  const visible = stages[stage] ?? stages[0];
  const language = visible.language;
  const languageLabel = LANGUAGE_LABELS[language] ?? language.toUpperCase();

  return (
    <span
      className={`${styles.gloss} ${styles[density]} ${className}`.trim()}
      data-machine-gloss="character-semantic-broadcast-v3"
      data-layout-contract="fixed-translation-box-v1"
      data-language={language}
      data-cycle-ms="500"
      role="note"
      aria-label={translations.en}
      aria-live="off"
      dir={RTL_LANGUAGES.has(language) ? "rtl" : "ltr"}
    >
      <LexiconText text={visible.text} semantic={false} phase={phase} className={styles.text} />
      <LexiconText
        text={language === "machine" ? "⌁⌬" : languageLabel}
        semantic={false}
        phase={phase + 7}
        className={styles.language}
      />
    </span>
  );
}
