import { describe, expect, it } from "vitest";
import { incubate, rankTask, toCodexPacket, type ProductTask } from "../src/abys-kernel";

describe("ABYS kernel", () => {
  it("selects a highest-leverage immediate action", () => {
    const plan = incubate({
      objective: "Turn ABYS into deployable founder-ops infrastructure.",
      now: "2026-05-20T16:00:00.000Z",
      signals: [
        {
          id: "sig-1",
          source: "repo",
          summary: "Repository is writable and can receive product infrastructure.",
          confidence: 0.95,
          observedAt: "2026-05-20T16:00:00.000Z",
          tags: ["github", "execution"],
        },
      ],
    });

    expect(plan.rankedTasks.length).toBeGreaterThan(0);
    expect(plan.immediateAction?.status).toBe("ready");
    expect(plan.memoryWrites.length).toBeGreaterThanOrEqual(2);
  });

  it("penalizes blockers and effort", () => {
    const easy: ProductTask = {
      id: "easy",
      title: "Easy leverage",
      role: "operator",
      status: "ready",
      objective: "Do the useful small thing.",
      leverageScore: 80,
      effortScore: 10,
      monetizationPath: "Sell repeatable implementation workflow.",
      executableOutput: "A working artifact.",
      blockers: [],
      dependsOn: [],
    };

    const blocked: ProductTask = {
      ...easy,
      id: "blocked",
      title: "Blocked leverage",
      effortScore: 40,
      blockers: ["Needs external dependency"],
      dependsOn: ["Unknown prerequisite"],
    };

    expect(rankTask(easy)).toBeGreaterThan(rankTask(blocked));
  });

  it("emits a Codex-ready implementation packet", () => {
    const plan = incubate({
      objective: "Create the first Codex handoff.",
      now: "2026-05-20T16:00:00.000Z",
      signals: [],
    });

    const packet = toCodexPacket(plan.immediateAction!);

    expect(packet).toContain("Objective:");
    expect(packet).toContain("Acceptance criteria:");
    expect(packet).toContain("Known blockers:");
  });
});
