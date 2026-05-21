import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createJsonlMemoryLedger } from "./abys-memory";
import { incubate, toCodexPacket, type WorldSignal } from "./abys-kernel";

export interface CycleInput {
  objective: string;
  signals?: WorldSignal[];
  outputDir?: string;
  now?: string;
}

export interface CycleResult {
  planPath: string;
  codexPacketPath: string | null;
  memoryEventsWritten: number;
}

export async function runAbysCycle(input: CycleInput): Promise<CycleResult> {
  const outputDir = input.outputDir ?? ".abys";
  const now = input.now ?? new Date().toISOString();
  const plan = incubate({
    objective: input.objective,
    signals: input.signals ?? [],
    now,
  });

  await mkdir(outputDir, { recursive: true });

  const safeStamp = now.replace(/[:.]/g, "-");
  const planPath = join(outputDir, `plan-${safeStamp}.json`);
  await writeFile(planPath, JSON.stringify(plan, null, 2), "utf8");

  const ledger = createJsonlMemoryLedger(join(outputDir, "memory.jsonl"));
  for (const event of plan.memoryWrites) {
    await ledger.write(event);
  }

  let codexPacketPath: string | null = null;
  if (plan.immediateAction) {
    codexPacketPath = join(outputDir, `codex-${safeStamp}.md`);
    await writeFile(codexPacketPath, toCodexPacket(plan.immediateAction), "utf8");
  }

  return {
    planPath,
    codexPacketPath,
    memoryEventsWritten: plan.memoryWrites.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const objective = process.argv.slice(2).join(" ").trim() || "Evolve ABYS into deployable founder-ops infrastructure.";
  const result = await runAbysCycle({
    objective,
    signals: [
      {
        id: "sig-local-cycle",
        source: "system",
        summary: "ABYS local cycle executed from the command line.",
        confidence: 0.9,
        observedAt: new Date().toISOString(),
        tags: ["cycle", "memory", "codex"],
      },
    ],
  });

  console.log(JSON.stringify(result, null, 2));
}
