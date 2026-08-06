import Link from "next/link";
import { buildManifest } from "@/lib/generated-build-manifest";
import styles from "@/app/built-by-slop/built-by-slop.module.css";

const repositoryUrl = "https://github.com/injammed/ABYS";

const gravityStages = [
  { name: "Synthetic output", state: "live" },
  { name: "Submission", state: "live" },
  { name: "Private quarantine", state: "live" },
  { name: "Provenance inspection", state: "live" },
  { name: "Curator judgment", state: "building" },
  { name: "Public judgment", state: "partial" },
  { name: "Preserve / refine / contain", state: "building" },
] as const;

const ledger = [
  {
    fold: "Social substrate",
    evidence: "Accounts, private storage, quarantine insertion, approved feed, and persistent judgments entered one bounded vertical slice.",
    issue: 27,
    pull: 28,
    commit: "0323cf448b195011c70875e0e5dd6b7ab0eacba6",
    verification: "CI plus controlled production activation",
  },
  {
    fold: "Interaction repair",
    evidence: "A session-dependent authentication effect repeatedly recreated its own subscription and made the live interface inert. One dependency repair restored the client.",
    issue: 34,
    pull: 35,
    commit: "f3f58e6083e52782a8429c26c55f4f6cd0ca59ef",
    verification: "CI plus physical-device interaction proof",
  },
  {
    fold: "Reachable submission",
    evidence: "The long intake form received a bounded internal scroll region and sticky final action instead of asking mobile users to find an unreachable button.",
    pull: 36,
    commit: "4d848cf5fbecac951a6e7db94b6b40a2d0f9dcac",
    verification: "Typecheck, build, and production device proof",
  },
  {
    fold: "Public intake",
    evidence: "Beta language was removed, the private-review boundary became explicit, and the production action became Submit to private quarantine.",
    pull: 41,
    commit: "8f1ed9f52f48700b840b0ffa5acc61ff3f5e1677",
    verification: "CI plus live interface proof",
  },
  {
    fold: "Intake hardening",
    evidence: "Database-enforced daily submission, quarantine backlog, storage-object limits, and an emergency kill switch were added as a production migration.",
    issue: 42,
    pull: 43,
    commit: "6248867fe847780844bb9dece2aa9d74a7bde046",
    verification: "CI; production enforcement depends on the recorded Supabase migration activation",
  },
  {
    fold: "Social authentication",
    evidence: "Google and GitHub OAuth entry points were added without placing provider secrets in the public repository or browser bundle.",
    pull: 45,
    commit: "4b86bc600a057112e69a4dc1e0032f0a0d7b71c7",
    verification: "Typecheck and static production build; provider activation remains operator-controlled",
  },
] as const;

function shortSha(sha: string): string {
  return sha === "development" ? sha : sha.slice(0, 12);
}

function buildTimeLabel(): string {
  if (buildManifest.deployedAt === "development") return "development build";

  const value = new Date(buildManifest.deployedAt);
  if (Number.isNaN(value.getTime())) return buildManifest.deployedAt;

  return value.toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function BuildProvenance() {
  const commitUrl = `${repositoryUrl}/commit/${buildManifest.productionCommit}`;

  return (
    <div className={styles.provenance}>
      <section className={styles.hero}>
        <p className={styles.kicker}>PUBLIC META-PROVENANCE</p>
        <h1>Built by slop.<br />Steel-folded in public.</h1>
        <p className={styles.lede}>
          This site is itself an AI-assisted artifact. A human directs the objective. Generated code, plans, failures,
          repairs, migrations, tests, deployments, and field evidence remain inspectable instead of being hidden behind
          a polished origin story.
        </p>
        <div className={styles.actions}>
          <a href={repositoryUrl}>Inspect the repository</a>
          <a href={`${repositoryUrl}/issues/39`}>Inspect the completion graph</a>
          <Link href="/">Enter the Slop Field</Link>
        </div>
      </section>

      <section className={styles.machine} aria-labelledby="build-state-heading">
        <div>
          <p className={styles.kicker}>CURRENT BUILD STATE</p>
          <h2 id="build-state-heading">The artifact identifies its own deployment.</h2>
        </div>
        <dl className={styles.manifest}>
          <div><dt>Product</dt><dd>{buildManifest.product}</dd></div>
          <div><dt>Repository</dt><dd><a href={repositoryUrl}>{buildManifest.repository}</a></dd></div>
          <div><dt>Runtime</dt><dd><code>{buildManifest.runtimePath}</code></dd></div>
          <div><dt>Build mode</dt><dd>{buildManifest.buildMode}</dd></div>
          <div>
            <dt>Production commit</dt>
            <dd>
              {buildManifest.productionCommit === "development" ? (
                <code>development</code>
              ) : (
                <a href={commitUrl}><code>{shortSha(buildManifest.productionCommit)}</code></a>
              )}
            </dd>
          </div>
          <div><dt>Deployment build</dt><dd>{buildTimeLabel()} UTC</dd></div>
          <div><dt>Current steel fold</dt><dd>{buildManifest.steelFold}</dd></div>
          <div><dt>Completion issue</dt><dd><a href={`${repositoryUrl}/issues/${buildManifest.openCompletionIssue}`}>#{buildManifest.openCompletionIssue}</a></dd></div>
          <div><dt>Machine manifest</dt><dd><a href="/build-manifest.json">/build-manifest.json</a></dd></div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="gravity-heading">
        <p className={styles.kicker}>THE GRAVITY WELL</p>
        <h2 id="gravity-heading">Raw generation is not canon.</h2>
        <p>
          The product routes synthetic abundance through increasingly expensive tests. A stage marked planned or partial
          is shown honestly; the interface does not pretend unfinished machinery already exists.
        </p>
        <ol className={styles.gravity}>
          {gravityStages.map((stage, index) => (
            <li key={stage.name}>
              <span className={styles.gravityIndex}>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage.name}</strong>
              <span className={`${styles.state} ${styles[stage.state]}`}>{stage.state}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="ledger-heading">
        <p className={styles.kicker}>STEEL-FOLD LEDGER</p>
        <h2 id="ledger-heading">Failures remain attached to their repairs.</h2>
        <p>
          The ledger records bounded changes with public evidence. It does not expose private accounts, submissions,
          credentials, hidden reasoning, or unsanitized conversation history.
        </p>
        <div className={styles.ledger}>
          {ledger.map((entry) => (
            <article key={entry.commit}>
              <div className={styles.ledgerHead}>
                <h3>{entry.fold}</h3>
                <a href={`${repositoryUrl}/commit/${entry.commit}`}><code>{shortSha(entry.commit)}</code></a>
              </div>
              <p>{entry.evidence}</p>
              <div className={styles.evidenceLinks}>
                {"issue" in entry && entry.issue ? <a href={`${repositoryUrl}/issues/${entry.issue}`}>Issue #{entry.issue}</a> : null}
                <a href={`${repositoryUrl}/pull/${entry.pull}`}>PR #{entry.pull}</a>
                <span>{entry.verification}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.split}>
        <article>
          <p className={styles.kicker}>WHAT THE MACHINE MAY EXPOSE</p>
          <h2>Public evidence</h2>
          <p>Issues, implementation packets, sanitized prompts, pull requests, commits, migrations, automated checks, deployment state, and field-verification summaries.</p>
        </article>
        <article>
          <p className={styles.kicker}>WHAT THE MACHINE MUST NEVER EXPOSE</p>
          <h2>Private boundaries</h2>
          <p>Secrets, tokens, service-role credentials, private user records, quarantined media, private conversations, hidden reasoning, raw telemetry tied to people, or personal data that is not necessary for public provenance.</p>
        </article>
      </section>

      <section className={styles.finalLaw}>
        <p>BUILT BY SLOP · DIRECTED BY A HUMAN · VERIFIED BY TESTS · REPAIRED BY EVIDENCE</p>
        <strong>The spectacle is not that AI produced code. The spectacle is that every failure remains visible until it becomes working machinery.</strong>
      </section>
    </div>
  );
}
