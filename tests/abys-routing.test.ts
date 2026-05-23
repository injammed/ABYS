import { describe, expect, it } from "vitest";
import { routeTask } from "../src/abys-routing";
import type { ProductTask } from "../src/abys-kernel";

function task(overrides: Partial<ProductTask>): ProductTask {
  return {
    id: "task-route-test",
    title: "Route test task",
    role: "operator",
    status: "ready",
    objective: "Convert a concrete product requirement into repo changes.",
    leverageScore: 80,
    effortScore: 20,
    monetizationPath: "Improves repeatable ABYS delivery.",
    executableOutput: "A code, test, schema, issue, or workflow artifact.",
    blockers: [],
    dependsOn: [],
    ...overrides,
  };
}

describe("ABYS routing contract", () => {
  it("routes repo-buildable implementation tasks to ABYS", () => {
    const decision = routeTask(task({
      title: "Add repository workflow tests",
      objective: "Add test and CI workflow coverage for a deployable product task.",
      executableOutput: "Vitest test file plus GitHub workflow verification.",
    }));

    expect(decision.route).toBe("ABYS");
    expect(decision.requiredArtifacts).toContain("test fixture");
  });

  it("routes canon and symbolic artifact tasks to ITEM", () => {
    const decision = routeTask(task({
      title: "Define ITEM canon artifact gate",
      objective: "Preserve symbolic artifact requirements before extracting buildable software work.",
      executableOutput: "Canon acceptance criteria for Full-Mode Artifact ingestion.",
    }));

    expect(decision.route).toBe("ITEM");
  });

  it("routes protocol and receipt tasks to SYNTEL", () => {
    const decision = routeTask(task({
      title: "Define signed verification receipt protocol",
      objective: "Create a protocol schema for Codex handoff packets and audit receipts.",
      executableOutput: "Task contract schema with verification receipt fields.",
      role: "codex",
    }));

    expect(decision.route).toBe("SYNTEL");
    expect(decision.requiredArtifacts).toContain("Codex packet");
  });

  it("holds vague abstraction for review instead of execution", () => {
    const decision = routeTask(task({
      title: "Ultimate cosmic infinite vibes",
      objective: "Somehow make the ultimate transcendent cosmic magic system.",
      executableOutput: "thing",
      blockers: ["vague stakeholder alignment"],
    }));

    expect(decision.route).toBe("hold_for_review");
    expect(decision.slopFlags.length).toBeGreaterThanOrEqual(3);
  });
});
