/*
ABYS Kernel v0.1

Purpose:
A minimal, dependency-free orchestration kernel for turning ABYS from concept into
software infrastructure. This file is intentionally small: it defines the first
product loop that can later be wired to OpenAI, Codex, vector storage, dashboards,
market data, browser automation, and human review.

Core loop:
intent -> world model -> council proposals -> scored task graph -> execution plan -> memory event
*/

export type CouncilRole =
  | "architect"
  | "operator"
  | "market"
  | "ux"
  | "memory"
  | "critic"
  | "codex";

export type TaskStatus = "proposed" | "ready" | "blocked" | "executed" | "rejected";

export interface WorldSignal {
  id: string;
  source: "user" | "repo" | "market" | "system" | "model";
  summary: string;
  confidence: number; // 0..1
  observedAt: string;
  tags: string[];
}

export interface MemoryEvent {
  id: string;
  kind: "decision" | "artifact" | "signal" | "failure" | "pattern";
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
  importance: number; // 0..1
}

export interface ProductTask {
  id: string;
  title: string;
  role: CouncilRole;
  status: TaskStatus;
  objective: string;
  leverageScore: number; // 0..100
  effortScore: number; // 1..100, lower is easier
  monetizationPath: string;
  executableOutput: string;
  blockers: string[];
  dependsOn: string[];
}

export interface ExecutionPlan {
  id: string;
  objective: string;
  rankedTasks: ProductTask[];
  immediateAction: ProductTask | null;
  memoryWrites: MemoryEvent[];
}

export interface KernelInput {
  objective: string;
  signals: WorldSignal[];
  existingTasks?: ProductTask[];
  now?: string;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);

const uid = (prefix: string, text: string, now: string) => `${prefix}-${slug(text)}-${Date.parse(now).toString(36)}`;

export function rankTask(task: ProductTask): number {
  const leverage = clamp(task.leverageScore, 0, 100);
  const effort = clamp(task.effortScore, 1, 100);
  const blockerPenalty = task.blockers.length * 8;
  const dependencyPenalty = task.dependsOn.length * 4;
  return Math.round(leverage * 1.7 - effort * 0.9 - blockerPenalty - dependencyPenalty);
}

export function proposeCouncilTasks(input: KernelInput): ProductTask[] {
  const now = input.now ?? new Date().toISOString();
  const base: Omit<ProductTask, "id">[] = [
    {
      title: "Create ABYS task graph schema",
      role: "architect",
      status: "ready",
      objective: "Define the canonical object model for recursive product incubation.",
      leverageScore: 92,
      effortScore: 12,
      monetizationPath: "Enables repeatable consulting, SaaS dashboards, and agent workflow subscriptions.",
      executableOutput: "TypeScript interfaces plus JSON schema for tasks, signals, memory events, and plans.",
      blockers: [],
      dependsOn: [],
    },
    {
      title: "Add memory event ledger",
      role: "memory",
      status: "ready",
      objective: "Persist decisions, artifacts, failures, and reusable patterns across runs.",
      leverageScore: 95,
      effortScore: 20,
      monetizationPath: "Transforms one-off AI sessions into retained organizational intelligence.",
      executableOutput: "Append-only storage adapter with local JSONL first, Postgres later.",
      blockers: [],
      dependsOn: ["Create ABYS task graph schema"],
    },
    {
      title: "Build Codex handoff packet generator",
      role: "codex",
      status: "ready",
      objective: "Convert ranked tasks into implementation-ready prompts, file paths, acceptance criteria, and tests.",
      leverageScore: 98,
      effortScore: 28,
      monetizationPath: "Compresses founder intent into executable engineering tickets; sell as AI product ops layer.",
      executableOutput: "Function that emits a CodexPacket with context, target files, test plan, and done criteria.",
      blockers: [],
      dependsOn: ["Create ABYS task graph schema"],
    },
    {
      title: "Ship operator dashboard shell",
      role: "ux",
      status: "proposed",
      objective: "Expose signals, tasks, memory, execution queue, and revenue hypotheses in one cockpit.",
      leverageScore: 84,
      effortScore: 40,
      monetizationPath: "Demoable SaaS surface for founders, creators, and small teams.",
      executableOutput: "Next.js dashboard with task graph, council roles, and memory stream.",
      blockers: ["Requires frontend scaffold"],
      dependsOn: ["Create ABYS task graph schema", "Add memory event ledger"],
    },
    {
      title: "Create market radar adapter contract",
      role: "market",
      status: "proposed",
      objective: "Normalize public market/product signals into comparable ABYS WorldSignals.",
      leverageScore: 80,
      effortScore: 34,
      monetizationPath: "Turns ABYS into a product opportunity scanner and strategic alerting tool.",
      executableOutput: "Adapter interface for sources like GitHub trends, app reviews, pricing pages, job posts, and forums.",
      blockers: ["Needs source selection"],
      dependsOn: ["Create ABYS task graph schema"],
    },
  ];

  return base.map((task) => ({ ...task, id: uid("task", task.title, now) }));
}

export function incubate(input: KernelInput): ExecutionPlan {
  const now = input.now ?? new Date().toISOString();
  const proposed = proposeCouncilTasks({ ...input, now });
  const allTasks = [...(input.existingTasks ?? []), ...proposed];

  const rankedTasks = [...allTasks].sort((a, b) => rankTask(b) - rankTask(a));
  const immediateAction = rankedTasks.find((task) => task.status === "ready" && task.blockers.length === 0) ?? null;

  const memoryWrites: MemoryEvent[] = [
    {
      id: uid("mem", input.objective, now),
      kind: "decision",
      summary: `Incubation objective selected: ${input.objective}`,
      payload: { objective: input.objective, signalCount: input.signals.length },
      createdAt: now,
      importance: 0.86,
    },
  ];

  if (immediateAction) {
    memoryWrites.push({
      id: uid("mem", immediateAction.title, now),
      kind: "pattern",
      summary: `Highest leverage immediate action: ${immediateAction.title}`,
      payload: { task: immediateAction, rank: rankTask(immediateAction) },
      createdAt: now,
      importance: 0.92,
    });
  }

  return {
    id: uid("plan", input.objective, now),
    objective: input.objective,
    rankedTasks,
    immediateAction,
    memoryWrites,
  };
}

export function toCodexPacket(task: ProductTask): string {
  return [
    `Objective: ${task.objective}`,
    `Role: ${task.role}`,
    `Target output: ${task.executableOutput}`,
    `Monetization path: ${task.monetizationPath}`,
    `Acceptance criteria:`,
    `- Implement the smallest working version of the target output.`,
    `- Include types or schema definitions.`,
    `- Include one testable example or fixture.`,
    `- Do not add speculative features beyond the stated objective.`,
    task.blockers.length ? `Known blockers: ${task.blockers.join("; ")}` : `Known blockers: none`,
  ].join("\n");
}

// Example local run:
if (typeof require !== "undefined" && require.main === module) {
  const plan = incubate({
    objective: "Instantiate ABYS as a deployable founder-ops intelligence kernel.",
    signals: [
      {
        id: "sig-abys-repo",
        source: "repo",
        summary: "ABYS repository exists and can receive committed product infrastructure.",
        confidence: 0.94,
        observedAt: new Date().toISOString(),
        tags: ["github", "infrastructure", "kernel"],
      },
    ],
  });

  console.log(JSON.stringify(plan, null, 2));
  if (plan.immediateAction) {
    console.log("\n--- CODEX PACKET ---\n");
    console.log(toCodexPacket(plan.immediateAction));
  }
}
