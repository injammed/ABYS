import type { ProductTask, WorldSignal } from "./abys-kernel";

export type TaskRoute = "ITEM" | "ABYS" | "SYNTEL" | "split" | "hold_for_review";
export type OwnerRepo = "ITEM" | "ABYS" | "SYNTEL";
export type ExecutionSurface = "Codex" | "GitHub Issue" | "PR" | "workflow" | "docs" | "hold";

export interface RouteDecision {
  route: TaskRoute;
  owner_repo: OwnerRepo | null;
  execution_surface: ExecutionSurface;
  handoff_target: OwnerRepo | null;
  confidence: number;
  rationale: string;
  requiredArtifacts: string[];
  slopFlags: string[];
}

const ITEM_TERMS = ["canon", "myth", "museum", "artifact", "symbolic", "aetimm", "item", "immutablis", "glyph"];
const SYNTEL_TERMS = ["protocol", "envelope", "receipt", "verification", "signature", "audit", "identity", "contract", "replay", "trust"];
const ABYS_TERMS = ["repo", "test", "workflow", "issue", "pr", "code", "deploy", "product", "task", "memory", "dashboard", "codex", "packet", "validator", "validation"];
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
  const tokens = tokenize(text);

  const itemScore = scoreTerms(tokens, ITEM_TERMS);
  const syntelScore = scoreTerms(tokens, SYNTEL_TERMS);
  const abysScore = scoreTerms(tokens, ABYS_TERMS) + (task.status === "ready" ? 1 : 0);
  const slopFlags = detectSlop(tokens, task);
  const execution_surface = executionSurfaceFor(tokens);
  const handoff_target = handoffTargetFor(tokens, itemScore, syntelScore);

  if (slopFlags.length >= 3 || task.blockers.some((blocker) => hasTerm(tokenize(normalize(blocker)), "vague"))) {
    return decision("hold_for_review", 0.82, "Task contains too much ungrounded abstraction or vague blocking language for autonomous execution.", execution_surface, handoff_target, slopFlags, task);
  }

  const routes: Array<[TaskRoute, number]> = [
    ["ITEM", itemScore],
    ["SYNTEL", syntelScore],
    ["ABYS", abysScore],
  ];
  const activeRoutes = routes.filter(([, score]) => score >= 2).sort((a, b) => b[1] - a[1]);

  if (activeRoutes.length >= 2 && activeRoutes[0][1] - activeRoutes[1][1] <= 1) {
    return decision("split", 0.76, "Task crosses canon, protocol, or repo implementation boundaries and should be decomposed before execution.", execution_surface, handoff_target, slopFlags, task);
  }

  const [route, routeScore] = activeRoutes[0] ?? ["ABYS", abysScore] as [TaskRoute, number];
  return decision(route, clamp(0.55 + routeScore * 0.08 - slopFlags.length * 0.06, 0.51, 0.95), rationaleFor(route), execution_surface, handoff_target, slopFlags, task);
}

function decision(route: TaskRoute, confidence: number, rationale: string, execution_surface: ExecutionSurface, handoff_target: OwnerRepo | null, slopFlags: string[], task: ProductTask): RouteDecision {
  const owner_repo = route === "split" || route === "hold_for_review" ? null : route;
  return {
    route,
    owner_repo,
    execution_surface: route === "hold_for_review" ? "hold" : execution_surface,
    handoff_target: route === "ABYS" ? handoff_target : null,
    confidence,
    rationale,
    requiredArtifacts: requiredArtifactsFor(task, route === "hold_for_review" ? "hold" : execution_surface),
    slopFlags,
  };
}

function executionSurfaceFor(tokens: Set<string>): ExecutionSurface {
  if (hasTerm(tokens, "codex") || hasTerm(tokens, "packet")) return "Codex";
  if (hasTerm(tokens, "pr")) return "PR";
  if (hasTerm(tokens, "workflow")) return "workflow";
  if (hasTerm(tokens, "issue")) return "GitHub Issue";
  if (hasTerm(tokens, "docs") || hasTerm(tokens, "document")) return "docs";
  return "Codex";
}

function handoffTargetFor(tokens: Set<string>, itemScore: number, syntelScore: number): OwnerRepo | null {
  if (itemScore >= 2 && (hasTerm(tokens, "codex") || hasTerm(tokens, "packet") || hasTerm(tokens, "validator"))) return "ITEM";
  if (syntelScore >= 2 && (hasTerm(tokens, "codex") || hasTerm(tokens, "packet") || hasTerm(tokens, "validator"))) return "SYNTEL";
  return null;
}

function requiredArtifactsFor(task: ProductTask, execution_surface: ExecutionSurface): string[] {
  const artifacts = ["acceptance criteria", "test fixture"];
  if (execution_surface === "Codex") artifacts.push("Codex packet");
  if (task.role === "memory") artifacts.push("memory event");
  if (task.role === "architect") artifacts.push("schema or interface");
  if (task.role === "ux") artifacts.push("UI state model");
  return artifacts;
}

function rationaleFor(route: TaskRoute): string {
  if (route === "ITEM") return "Route to ITEM canon first: preserve the symbolic artifact, then extract buildable requirements.";
  if (route === "SYNTEL") return "Route to SYNTEL protocol first: define envelope, verification, and audit semantics before implementation.";
  if (route === "ABYS") return "Route directly to ABYS: task is repo-buildable and should become code, tests, docs, packets, or workflow.";
  return "Route requires decomposition before execution.";
}

function detectSlop(tokens: Set<string>, task: ProductTask): string[] {
  const flags = SLOP_TERMS.filter((term) => hasTerm(tokens, term)).map((term) => `slop-term:${term}`);
  if (task.executableOutput.length < 24) flags.push("weak-executable-output");
  if (!task.monetizationPath.trim()) flags.push("missing-monetization-path");
  if (task.objective.length < 32) flags.push("thin-objective");
  return flags;
}

function scoreTerms(tokens: Set<string>, terms: string[]): number {
  return terms.reduce((score, term) => score + (hasTerm(tokens, term) ? 1 : 0), 0);
}

function hasTerm(tokens: Set<string>, term: string): boolean {
  return tokens.has(term);
}

function tokenize(text: string): Set<string> {
  return new Set(text.split(" ").filter(Boolean));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
