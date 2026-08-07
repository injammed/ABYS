import { LexiconText } from "./LexiconBroadcast";
import styles from "./PhaseIdentity.module.css";

type PhaseIdentityProps = {
  kind: "aetimm" | "slatra";
  compact?: boolean;
};

const identity = {
  aetimm: {
    longName: "AETIMM",
    shortName: "AI",
    expansion: "AI · Aeternum Immutablis",
  },
  slatra: {
    longName: "SLOP TROUGH™",
    shortName: "ST",
    expansion: "ST · Slop Trough",
  },
} as const;

export function PhaseIdentity({ kind, compact = false }: PhaseIdentityProps) {
  const current = identity[kind];
  const className = [
    styles.identity,
    styles[kind],
    compact ? styles.compact : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} aria-label={`${current.longName}, abbreviated ${current.shortName}`} data-lexicon-surface="true">
      <div className={styles.iconFrame} aria-hidden="true" />
      <div className={styles.morph} aria-hidden="true">
        <LexiconText className={styles.longName} text={current.longName} phase={3} semantic={false} />
        <LexiconText className={styles.shortName} text={current.shortName} phase={7} semantic={false} />
      </div>
      <LexiconText as="p" className={styles.expansion} text={current.expansion} phase={11} />
    </div>
  );
}
