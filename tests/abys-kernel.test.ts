import { describe, expect, it } from "vitest";
import { incubate, rankTask, toCodexPacket, type ProductTask } from "../src/abys-kernel";

const baseTask: ProductTask = {
  id: "task-test",
  title: "Test task",
  role: "architect",
  status: "ready",
  objective: "Prove the ABYS ranking function rewards leverage and penalizes slop.",
  leverageScore: 80,
  effortScore: 20,
  monetizationPath: "Improves product execution quality.",
  executableOutput: "A deterministic test fixture.",
  blockers: [],
  dependsOn: [],
};

describe("ABYS kernel", () => {
  it("selects a ready unblocked immediate action", () => {
    const plan = incubate({
      objective: "Convert ABYS into deployable software infrastructure.",
      signals: [],
      now: "2026-05-22T17:00:00.000Z",
    });

    expect(plan.rankedTasks.length).toBeGreaterThan(0);
    expect(plan.immediateAction?.status).toBe("ready");
    expect(plan.immediateAction?.blockers).toEqual([]);
    expect(plan.memoryWrites.length).toBeGreaterThanOrEqual(2);
  });

  it("penalizes blockers and dependencies as execution slop", () => {
    const cleanScore = rankTask(baseTask);
    const blockedScore = rankTask({
      ...baseTask,
      blockers: ["Needs vague stakeholder alignment"],
      dependsOn: ["Undefined upstream artifact"],
    });

    expect(cleanScore).toBeGreaterThan(blockedScore);
  });

  it("emits Codex packets with acceptance criteria", () => {
    const packet = toCodexPacket(baseTask);

    expect(packet).toContain("Objective:");
    expect(packet).toContain("Acceptance criteria:");
    expect(packet).toContain("Do not add speculative features");
  });

  it("emits task route maps for every ranked task", () => {
    const plan = incubate({
      objective: "Route ABYS work into task packets and tests.",
      signals: [],
      now: "2026-05-22T17:00:00.000Z",
      existingTasks: [baseTask],
    });

    expect(Object.keys(plan.taskRoutes)).toHaveLength(plan.rankedTasks.length);
    expect(plan.taskRoutes[baseTask.id].route).toBe("ABYS");
  });
});
