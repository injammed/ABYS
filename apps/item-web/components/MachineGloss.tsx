"use client";

import { useEffect, useMemo, useState } from "react";
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

const CYCLE_MS = 500;
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
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
      timeout = undefined;
      interval = undefined;
    };

    const start = () => {
      stop();
      if (media.matches || stages.length <= 1) {
        setStage(0);
        return;
      }

      const seed = stableHash(translations.en);
      setStage(seed % stages.length);
      const phaseDelay = stableHash(`${translations.en}|phase`) % CYCLE_MS;

      timeout = setTimeout(() => {
        setStage((current) => (current + 1) % stages.length);
        interval = setInterval(() => {
          setStage((current) => (current + 1) % stages.length);
        }, CYCLE_MS);
      }, phaseDelay);
    };

    start();
    media.addEventListener("change", start);
    return () => {
      media.removeEventListener("change", start);
      stop();
    };
  }, [stages, translations.en]);

  const visible = stages[stage] ?? stages[0];
  const language = visible.language;
  const languageLabel = LANGUAGE_LABELS[language] ?? language.toUpperCase();

  return (
    <span
      className={`${styles.gloss} ${styles[density]} ${className}`.trim()}
      data-machine-gloss="ambient-translation-broadcast-v2"
      data-language={language}
      data-cycle-ms={CYCLE_MS}
      role="note"
      aria-label={translations.en}
      aria-live="off"
      dir={RTL_LANGUAGES.has(language) ? "rtl" : "ltr"}
    >
      <span className={styles.text} aria-hidden="true">{visible.text}</span>
      <span className={styles.language} aria-hidden="true">{language === "machine" ? "⌁⌬" : languageLabel}</span>
    </span>
  );
}
