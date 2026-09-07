"use client";

export type MachineGlossTranslations = {
  en: string;
  [language: string]: string | undefined;
};

type MachineGlossProps = {
  translations: MachineGlossTranslations;
  className?: string;
  density?: "quiet" | "dense";
};

// Instructions stay in a stable reading language and size to their content.
// The decorative machine vocabulary lives outside the working controls.
export function MachineGloss({ translations, className = "", density = "dense" }: MachineGlossProps) {
  return <span className={`readable-gloss readable-gloss-${density} ${className}`.trim()} data-layout-contract="readable-content-flow-v2" role="note" lang="en">{translations.en}</span>;
}
