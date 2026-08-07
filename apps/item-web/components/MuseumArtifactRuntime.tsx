import type { ArtifactPart } from "@/lib/feed";
import type { MuseumAccession } from "@/lib/museum";
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
    return <img className={styles.image} src={part.signedUrl} alt="" loading="lazy" />;
  }

  if (part.mode === "video" && part.signedUrl) {
    return <video className={styles.video} src={part.signedUrl} controls preload="metadata" playsInline />;
  }

  if (part.mode === "audio" && part.signedUrl) {
    return (
      <div className={styles.audioHall}>
        <div className={styles.rings} aria-hidden="true"><i /><i /><i /></div>
        <p>ACCESSION AUDIO</p>
        <strong>{partName(part)}</strong>
        <audio src={part.signedUrl} controls preload="metadata" />
      </div>
    );
  }

  if (part.partKind === "text" && part.text) {
    return (
      <div className={styles.textHall}>
        <p>ACCESSION TEXT</p>
        <pre>{part.text.length > 6000 ? `${part.text.slice(0, 6000)}\n…` : part.text}</pre>
      </div>
    );
  }

  if (part.partKind === "reference" && part.referenceUrl) {
    return (
      <div className={styles.sealedHall}>
        <p>EXTERNAL REFERENCE</p>
        <strong>{partName(part)}</strong>
        <span>The reference is recorded with the accession and is opened only by deliberate visitor action.</span>
        <a href={part.referenceUrl} target="_blank" rel="noopener noreferrer">Open recorded reference</a>
      </div>
    );
  }

  return (
    <div className={styles.sealedHall} data-sealed-mode={part.mode}>
      <p>{part.mode === "model3d" ? "3D" : part.mode.toUpperCase()} · SEALED MATERIAL</p>
      <strong>{partName(part)}</strong>
      <span>
        {part.mode === "code" || part.mode === "website" || part.mode === "simulation"
          ? "Preserved without execution. The Museum records the material; it does not grant it authority."
          : "Preserved as constituent material of this accession."}
      </span>
      {part.signedUrl && (
        <a href={part.signedUrl} download={part.filename || true}>Retrieve preserved material{part.byteSize != null ? ` · ${formatBytes(part.byteSize)}` : ""}</a>
      )}
    </div>
  );
}

export function MuseumArtifactRuntime({ accession }: { accession: MuseumAccession }) {
  const lead = leadPart(accession.parts);

  return (
    <div className={styles.runtime} data-museum-runtime-contract="museum-artifact-runtime-v1">
      {lead ? (
        <Experience part={lead} />
      ) : accession.mediaUrl ? (
        <img className={styles.image} src={accession.mediaUrl} alt="" loading="lazy" />
      ) : (
        <div className={styles.sealedHall}>
          <p>ACCESSION FORM</p>
          <strong>{accession.modes.map((mode) => mode === "model3d" ? "3D" : mode).join(" · ")}</strong>
          <span>The accession exists even when this browser has no native presentation for its form.</span>
        </div>
      )}

      {accession.parts.length > 1 && (
        <details className={styles.materialRegister}>
          <summary>ACCESSION MATERIALS · {accession.parts.length}</summary>
          <ol>
            {accession.parts.map((part) => (
              <li key={part.id}>
                <span>{String(part.position + 1).padStart(2, "0")} · {partName(part)}</span>
                <small>{part.mode === "model3d" ? "3D" : part.mode}</small>
                {part.partKind === "reference" && part.referenceUrl && (
                  <a href={part.referenceUrl} target="_blank" rel="noopener noreferrer">Open reference</a>
                )}
                {part.partKind === "file" && part.signedUrl && (
                  <a href={part.signedUrl} download={part.filename || true}>Retrieve material</a>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
