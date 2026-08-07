"use client";

import { useMemo, useState } from "react";
import styles from "./MachineGloss.module.css";

export type MachineGlossTranslations = {
  en: string;
  es?: string;
  zh?: string;
  ja?: string;
  ar?: string;
};

type MachineGlossProps = {
  translations: MachineGlossTranslations;
  className?: string;
  density?: "quiet" | "dense";
};

const LANGUAGE_ORDER: Array<keyof MachineGlossTranslations> = ["en", "es", "zh", "ja", "ar"];
const LANGUAGE_LABELS: Record<keyof MachineGlossTranslations, string> = {
  en: "EN",
  es: "ES",
  zh: "中文",
  ja: "日本語",
  ar: "العربية",
};

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

export function MachineGloss({ translations, className = "", density = "dense" }: MachineGlossProps) {
  const availableLanguages = LANGUAGE_ORDER.filter((language) => Boolean(translations[language]));
  const [stage, setStage] = useState(0);
  const glyphs = useMemo(() => machineEncode(translations.en), [translations.en]);
  const showingGlyphs = stage === 0;
  const language = showingGlyphs ? null : availableLanguages[(stage - 1) % availableLanguages.length];
  const visibleText = language ? translations[language] ?? translations.en : glyphs;

  return (
    <button
      type="button"
      className={`${styles.gloss} ${styles[density]} ${className}`.trim()}
      data-machine-gloss="machine-first-translation-cycle-v1"
      data-language={language ?? "machine"}
      onClick={() => setStage((current) => (current + 1) % (availableLanguages.length + 1))}
      aria-label={`${translations.en}. Activate to ${showingGlyphs ? "show English translation" : "cycle translation language"}.`}
      title="Translate / cycle language"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <span className={styles.text} aria-hidden="true">{visibleText}</span>
      <span className={styles.language} aria-hidden="true">{language ? LANGUAGE_LABELS[language] : "⌁⌬"}</span>
    </button>
  );
}
