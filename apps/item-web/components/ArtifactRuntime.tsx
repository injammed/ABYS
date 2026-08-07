import type { ArtifactPart, FeedArtifact } from "@/lib/feed";
import { LexiconText } from "./LexiconBroadcast";
import styles from "./ArtifactRuntime.module.css";

function formatBytes(value?: number): string {
  if (value == null || !Number.isFinite(value)) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "external reference";
  }
}

function leadPart(parts: ArtifactPart[]): ArtifactPart | undefined {
  const priority: ArtifactPart["mode"][] = ["image", "video", "audio", "text", "document", "model3d", "data", "code", "website", "simulation", "other"];
  for (const mode of priority) {
    const match = parts.find((part) => part.mode === mode && (
      part.partKind === "text"
      || part.partKind === "reference"
      || Boolean(part.signedUrl)
    ));
    if (match) return match;
  }
  return parts[0];
}

function partName(part: ArtifactPart): string {
  return part.label || part.filename || (part.partKind === "reference" ? "Reference" : part.mode === "model3d" ? "3D material" : `${part.mode} material`);
}

function InertMaterial({ part }: { part: ArtifactPart }) {
  const size = formatBytes(part.byteSize);
  const explanation = part.mode === "code" || part.mode === "website" || part.mode === "simulation"
    ? "Stored as inert Artifact material. It does not execute inside the trough."
    : "This material is preserved as part of the Artifact.";
  const downloadLabel = `Download material${size ? ` · ${size}` : ""}`;

  return (
    <div className={styles.inert} data-inert-material={part.mode} data-lexicon-surface="true">
      <LexiconText className={styles.mode} text={part.mode === "model3d" ? "3D" : part.mode} phase={3} />
      <LexiconText as="strong" text={partName(part)} phase={7} />
      <LexiconText as="p" text={explanation} phase={11} />
      {part.signedUrl && (
        <a className={styles.materialLink} href={part.signedUrl} download={part.filename || true} aria-label={downloadLabel}>
          <LexiconText text={downloadLabel} phase={13} semantic={false} />
        </a>
      )}
    </div>
  );
}

function LeadRuntime({ part }: { part: ArtifactPart }) {
  if (part.mode === "image" && part.signedUrl) {
    return <img className={styles.image} src={part.signedUrl} alt="" loading="lazy" />;
  }

  if (part.mode === "video" && part.signedUrl) {
    return (
      <video className={styles.video} src={part.signedUrl} controls preload="metadata" playsInline>
        Your browser cannot play this Artifact video.
      </video>
    );
  }

  if (part.mode === "audio" && part.signedUrl) {
    return (
      <div className={styles.audioStage}>
        <div className={styles.audioGlyph} aria-hidden="true">∿∿∿</div>
        <LexiconText as="strong" text={partName(part)} phase={17} />
        <audio className={styles.audio} src={part.signedUrl} controls preload="metadata">
          Your browser cannot play this Artifact audio.
        </audio>
      </div>
    );
  }

  if (part.partKind === "text" && part.text) {
    const excerpt = part.text.length > 3200 ? `${part.text.slice(0, 3200)}\n…` : part.text;
    return (
      <div className={styles.textStage} data-artifact-payload="verbatim">
        <LexiconText className={styles.mode} text={part.mode} phase={19} />
        <pre>{excerpt}</pre>
      </div>
    );
  }

  if (part.partKind === "reference" && part.referenceUrl) {
    return (
      <div className={styles.referenceStage}>
        <LexiconText className={styles.mode} text="reference" phase={23} />
        <LexiconText as="strong" text={hostLabel(part.referenceUrl)} phase={29} />
        <LexiconText as="p" text="External Artifact reference. AETIMM does not fetch or execute it automatically." phase={31} />
        <a href={part.referenceUrl} target="_blank" rel="noopener noreferrer" aria-label="Open reference">
          <LexiconText text="Open reference" phase={37} semantic={false} />
        </a>
      </div>
    );
  }

  return <InertMaterial part={part} />;
}

function MaterialList({ parts }: { parts: ArtifactPart[] }) {
  if (parts.length <= 1) return null;

  return (
    <details className={styles.materials}>
      <summary><LexiconText text={`${parts.length} materials`} phase={41} /></summary>
      <ol>
        {parts.map((part, index) => {
          const metadata = `${part.mode === "model3d" ? "3D" : part.mode}${part.byteSize != null ? ` · ${formatBytes(part.byteSize)}` : ""}`;
          return (
            <li key={part.id}>
              <LexiconText text={`${part.position + 1}. ${partName(part)}`} phase={43 + index * 5} />
              <LexiconText as="small" text={metadata} phase={47 + index * 5} />
              {part.partKind === "reference" && part.referenceUrl && (
                <a href={part.referenceUrl} target="_blank" rel="noopener noreferrer" aria-label="Open">
                  <LexiconText text="Open" phase={53 + index * 5} semantic={false} />
                </a>
              )}
              {part.partKind === "file" && part.signedUrl && (
                <a href={part.signedUrl} download={part.filename || true} aria-label="Download">
                  <LexiconText text="Download" phase={59 + index * 5} semantic={false} />
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

export function ArtifactRuntime({ artifact }: { artifact: FeedArtifact }) {
  const parts = artifact.parts ?? [];
  const lead = leadPart(parts);

  return (
    <div className={styles.host} data-runtime-contract="artifact-runtime-v1">
      <div className={styles.stage}>
        {lead ? (
          <LeadRuntime part={lead} />
        ) : artifact.mediaUrl ? (
          <img className={styles.image} src={artifact.mediaUrl} alt="" loading="lazy" />
        ) : (
          <div className={styles.fallback} data-lexicon-surface="true">
            <LexiconText text={artifact.modalLead || "Artifact"} phase={61} />
            <LexiconText as="strong" text={artifact.title} phase={67} />
            <LexiconText as="p" text="No native preview is available yet. The Artifact remains present and voteable." phase={71} />
          </div>
        )}
      </div>
      <MaterialList parts={parts} />
    </div>
  );
}
