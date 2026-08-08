import type { ArtifactPart } from "@/lib/feed";
import type { MuseumArtifactPresentation } from "@/lib/museum";
import { LexiconText } from "./LexiconBroadcast";
import { RenewableArtifactDownload, RenewableArtifactMedia } from "./RenewableArtifactMedia";
import styles from "./MuseumArtifactRuntime.module.css";

function formatBytes(value?: number): string {
  if (value == null || !Number.isFinite(value)) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function partName(part: ArtifactPart): string {
  return part.label || part.filename || (part.mode === "model3d" ? "3D material" : `${part.mode} material`);
}

function leadPart(parts: ArtifactPart[]): ArtifactPart | undefined {
  const priority: ArtifactPart["mode"][] = ["image", "video", "audio", "text", "document", "model3d", "data", "code", "website", "simulation", "other"];
  for (const mode of priority) {
    const part = parts.find((entry) => entry.mode === mode && (entry.partKind !== "file" || Boolean(entry.signedUrl)));
    if (part) return part;
  }
  return parts[0];
}

function Experience({ part }: { part: ArtifactPart }) {
  if (part.mode === "image" && part.signedUrl) {
    return <RenewableArtifactMedia kind="image" className={styles.image} initialUrl={part.signedUrl} />;
  }

  if (part.mode === "video" && part.signedUrl) {
    return <RenewableArtifactMedia kind="video" className={styles.video} initialUrl={part.signedUrl} ariaLabel="Museum Artifact video" />;
  }

  if (part.mode === "audio" && part.signedUrl) {
    return (
      <div className={styles.audioHall} data-lexicon-surface="true">
        <div className={styles.rings} aria-hidden="true"><i /><i /><i /></div>
        <LexiconText as="p" text="ACCESSION AUDIO" phase={3} />
        <LexiconText as="strong" text={partName(part)} phase={7} />
        <RenewableArtifactMedia kind="audio" initialUrl={part.signedUrl} ariaLabel="Museum Artifact audio" />
      </div>
    );
  }

  if (part.partKind === "text" && part.text) {
    return (
      <div className={styles.textHall} data-artifact-payload="verbatim">
        <LexiconText as="p" text="ACCESSION TEXT" phase={11} />
        <pre>{part.text.length > 6000 ? `${part.text.slice(0, 6000)}\n…` : part.text}</pre>
      </div>
    );
  }

  if (part.partKind === "reference" && part.referenceUrl) {
    return (
      <div className={styles.sealedHall} data-lexicon-surface="true">
        <LexiconText as="p" text="EXTERNAL REFERENCE" phase={13} />
        <LexiconText as="strong" text={partName(part)} phase={17} />
        <LexiconText text="The reference is recorded with the Artifact and is opened only by deliberate visitor action." phase={19} />
        <a href={part.referenceUrl} target="_blank" rel="noopener noreferrer" aria-label="Open recorded reference">
          <LexiconText text="Open recorded reference" phase={23} semantic={false} />
        </a>
      </div>
    );
  }

  const sealedExplanation = part.mode === "code" || part.mode === "website" || part.mode === "simulation"
    ? "Preserved without execution. The Museum records the material; it does not grant it authority."
    : "Preserved as constituent material of this Artifact.";
  const retrieveLabel = `Retrieve preserved material${part.byteSize != null ? ` · ${formatBytes(part.byteSize)}` : ""}`;

  return (
    <div className={styles.sealedHall} data-sealed-mode={part.mode} data-lexicon-surface="true">
      <LexiconText as="p" text={`${part.mode === "model3d" ? "3D" : part.mode.toUpperCase()} · SEALED MATERIAL`} phase={29} />
      <LexiconText as="strong" text={partName(part)} phase={31} />
      <LexiconText text={sealedExplanation} phase={37} />
      {part.signedUrl && (
        <RenewableArtifactDownload
          initialUrl={part.signedUrl}
          filename={part.filename}
          ariaLabel={retrieveLabel}
        >
          <LexiconText text={retrieveLabel} phase={41} semantic={false} />
        </RenewableArtifactDownload>
      )}
    </div>
  );
}

export function MuseumArtifactRuntime({ artifact }: { artifact: MuseumArtifactPresentation }) {
  const lead = leadPart(artifact.parts);

  return (
    <div className={styles.runtime} data-museum-runtime-contract="museum-artifact-runtime-v1">
      {lead ? (
        <Experience part={lead} />
      ) : artifact.mediaUrl ? (
        <RenewableArtifactMedia kind="image" className={styles.image} initialUrl={artifact.mediaUrl} />
      ) : (
        <div className={styles.sealedHall} data-lexicon-surface="true">
          <LexiconText as="p" text="ARTIFACT FORM" phase={43} />
          <LexiconText as="strong" text={artifact.modes.map((mode) => mode === "model3d" ? "3D" : mode).join(" · ")} phase={47} />
          <LexiconText text="The Artifact exists even when this browser has no native presentation for its form." phase={53} />
        </div>
      )}

      {artifact.parts.length > 1 && (
        <details className={styles.materialRegister}>
          <summary><LexiconText text={`ARTIFACT MATERIALS · ${artifact.parts.length}`} phase={59} /></summary>
          <ol>
            {artifact.parts.map((part, index) => (
              <li key={part.id}>
                <LexiconText text={`${String(part.position + 1).padStart(2, "0")} · ${partName(part)}`} phase={61 + index * 5} />
                <LexiconText as="small" text={part.mode === "model3d" ? "3D" : part.mode} phase={67 + index * 5} />
                {part.partKind === "reference" && part.referenceUrl && (
                  <a href={part.referenceUrl} target="_blank" rel="noopener noreferrer" aria-label="Open reference">
                    <LexiconText text="Open reference" phase={71 + index * 5} semantic={false} />
                  </a>
                )}
                {part.partKind === "file" && part.signedUrl && (
                  <RenewableArtifactDownload
                    initialUrl={part.signedUrl}
                    filename={part.filename}
                    ariaLabel="Retrieve material"
                  >
                    <LexiconText text="Retrieve material" phase={73 + index * 5} semantic={false} />
                  </RenewableArtifactDownload>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
