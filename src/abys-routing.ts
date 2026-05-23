import type { ProductTask, WorldSignal } from "./abys-kernel";

export type TaskRoute = "ITEM" | "ABYS" | "SYNTEL" | "split" | "hold_for_review";

export interface RouteDecision {
  route: TaskRoute;
  confidence: number;
  rationale: string;
  requiredArtifacts: string[];
  slopFlags: string[];
}

const ITEM_TERMS = ["canon", "myth", "museum", "artifact", "symbolic", "aetimm", "item", "immutablis"];
const SYNTEL_TERMS = ["protocol", "handoff", "codex", "packet", "schema", "receipt", "verification", "signature", "audit"];
const ABYS_TERMS = ["repo", "test", "workflow", "issue", "pr", "code", "deploy", "product", "task", "memory", "dashboard"];
const SLOP_TERMS = ["vibes", "infinite", "transcendent", "cosmic", "ultimate", "magic", "just", "somehow"];

export function routeTask(task: ProductTask, signals: WorldSignal[] = []): RouteDecision {
  const text = normalize([
    task.title,
    task.objective,
    task.executableOutput,
    task.monetizationPath,
    ...task.blockers,
    ...task.dependsOn,
    ...signals.map((signal) => `${signal.summary} ${signal.tags.join(" ")}`),
  ].join(" "));

  const itemScore = scoreTerms(text, ITEM_TERMS);
  const syntelScore = scoreTerms(text, SYNTEL_TERMS);
  const abysScore = scoreTerms(text, ABYS_TERMS) + (task.status === "ready" ? 1 : 0);
  const slopFlags = detectSlop(text, task);

  const artifactTargets = requiredArtifactsFor(task);

  if (slopFlags.length >= 3 || task.blockers.some((blocker) => normalize(blocker).includes("vague"))) {
    return {
      route: "hold_for_review",
      confidence: 0.82,
      rationale: "Task contains too much ungrounded abstraction or vague blocking language for autonomous execution.",
      requiredArtifacts: artifactTargets,
      slopFlags,
    };
  }

  const routes: Array<[TaskRoute, number]> = [
    ["ITEM", itemScore],
    ["SYNTEL", syntelScore],
    ["ABYS", abysScore],
  ];
  const activeRoutes = routes.filter(([, score]) => score >= 2).sort((a, b) => b[1] - a[1]);

  if (activeRoutes.length >= 2 && activeRoutes[0][1] - activeRoutes[1][1] <= 1) {
    return {
      route: "split",
      confidence: 0.76,
      rationale: "Task crosses canon, protocol, or repo implementation boundaries and should be decomposed before execution.",
      requiredArtifacts: artifactTargets,
      slopFlags,
    };
  }

  const [route, routeScore] = activeRoutes[0] ?? ["ABYS", abysScore] as [TaskRoute, number];
  return {
    route,
    confidence: clamp(0.55 + routeScore * 0.08 - slopFlags.length * 0.06, 0.51, 0.95),
    rationale: rationaleFor(route),
    requiredArtifacts: artifactTargets,
    slopFlags,
  };
}

function requiredArtifactsFor(task: ProductTask): string[] {
  const artifacts = ["acceptance criteria", "test fixture"];
  if (task.role === "codex") artifacts.push("Codex packet");
  if (task.role === "memory") artifacts.push("memory event");
  if (task.role === "architect") artifacts.push("schema or interface");
  if (task.role === "ux") artifacts.push("UI state model");
  return artifacts;
}

function rationaleFor(route: TaskRoute): string {
  if (route === "ITEM") return "Route to ITEM canon first: preserve the symbolic artifact, then extract buildable requirements.";
  if (route === "SYNTEL") return "Route to SYNTEL protocol first: define packet, verification, and audit semantics before implementation.";
  if (route === "ABYS") return "Route directly to ABYS: task is repo-buildable and should become code, tests, docs, or workflow.";
  return "Route requires decomposition before execution.";
}

function detectSlop(text: string, task: ProductTask): string[] {
  const flags = SLOP_TERMS.filter((term) => text.includes(term)).map((term) => `slop-term:${term}`);
  if (task.executableOutput.length < 24) flags.push("weak-executable-output");
  if (!task.monetizationPath.trim()) flags.push("missing-monetization-path");
  if (task.objective.length < 32) flags.push("thin-objective");
  return flags;
}

function scoreTerms(text: string, terms: string[]): number {
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
