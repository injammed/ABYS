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
    <div className={className} aria-label={`${current.longName}, abbreviated ${current.shortName}`}>
      <div className={styles.iconFrame} aria-hidden="true" />
      <div className={styles.morph} aria-hidden="true">
        <span className={styles.longName}>{current.longName}</span>
        <span className={styles.shortName}>{current.shortName}</span>
      </div>
      <p className={styles.expansion}>{current.expansion}</p>
    </div>
  );
}
