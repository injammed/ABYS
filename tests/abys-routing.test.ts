import { describe, expect, it } from "vitest";
import { incubate } from "../src/abys-kernel";
import { routeTask } from "../src/abys-routing";
import type { ProductTask, WorldSignal } from "../src/abys-kernel";

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

const repoSignal: WorldSignal = {
  id: "sig-repo",
  source: "repo",
  summary: "Repository can receive code, tests, docs, issues, PRs, and workflows.",
  confidence: 0.93,
  observedAt: "2026-05-24T00:00:00.000Z",
  tags: ["repo", "implementation"],
};

describe("ABYS routing contract", () => {
  it("routes repo-buildable implementation tasks to ABYS", () => {
    const decision = routeTask(task({
      title: "Add repository workflow tests",
      objective: "Add test and CI workflow coverage for a deployable product task.",
      executableOutput: "Vitest test file plus GitHub workflow verification.",
    }));

    expect(decision.route).toBe("ABYS");
    expect(decision.owner_repo).toBe("ABYS");
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
      objective: "Create a protocol schema for signed envelopes and audit receipts.",
      executableOutput: "Task contract schema with verification receipt fields.",
      role: "architect",
    }));

    expect(decision.route).toBe("SYNTEL");
    expect(decision.owner_repo).toBe("SYNTEL");
  });

  it("routes Codex task packets as ABYS execution with ITEM handoff", () => {
    const decision = routeTask(task({
      title: "Create Codex task packet for ITEM canon validation",
      objective: "Create a Codex task packet that validates an ITEM canon artifact candidate.",
      executableOutput: "ABYS task packet and validator test fixture for ITEM handoff.",
      role: "codex",
    }));

    expect(decision.route).toBe("ABYS");
    expect(decision.owner_repo).toBe("ABYS");
    expect(decision.execution_surface).toBe("Codex");
    expect(decision.handoff_target).toBe("ITEM");
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
    expect(decision.owner_repo).toBeNull();
    expect(decision.execution_surface).toBe("hold");
    expect(decision.slopFlags.length).toBeGreaterThanOrEqual(3);
  });

  it("splits cross-boundary canon and protocol work before execution", () => {
    const decision = routeTask(task({
      title: "Define ITEM artifact canon and SYNTEL signed envelope protocol",
      objective: "Create ITEM canon artifact rules and SYNTEL protocol receipt semantics in one work item.",
      executableOutput: "Separate canon document and signed envelope protocol schema.",
      monetizationPath: "Improves routing quality by forcing decomposition.",
    }));

    expect(decision.route).toBe("split");
    expect(decision.owner_repo).toBeNull();
  });

  it("does not count short route keywords inside unrelated words", () => {
    const decision = routeTask(task({
      title: "Improve museum canon approach",
      objective: "Improve an ITEM canon artifact description without creating a pull request task.",
      executableOutput: "Canon wording revision and artifact acceptance criteria.",
      monetizationPath: "Improves paid artifact review quality.",
    }));

    expect(decision.route).toBe("ITEM");
  });

  it("does not flag slop terms inside benign words", () => {
    const decision = routeTask(task({
      title: "Adjust dashboard audit copy",
      objective: "Adjust product dashboard copy for audit clarity and implementation readiness.",
      executableOutput: "Updated UI copy and acceptance criteria for dashboard audit states.",
      monetizationPath: "Improves buyer trust in workflow quality controls.",
    }));

    expect(decision.route).not.toBe("hold_for_review");
    expect(decision.slopFlags).not.toContain("slop-term:just");
  });

  it("attaches routing decisions to incubation plans", () => {
    const plan = incubate({
      objective: "Turn ABYS routing into deployable repository infrastructure.",
      signals: [repoSignal],
      now: "2026-05-24T00:00:00.000Z",
      existingTasks: [task({
        id: "task-syntel-receipt",
        title: "Create SYNTEL verification receipt schema",
        role: "architect",
        objective: "Define protocol receipt schema for signed handoff audit verification.",
        executableOutput: "JSON schema plus test fixture for signed task receipt payloads.",
      })],
    });

    expect(plan.immediateAction).not.toBeNull();
    expect(Object.keys(plan.taskRoutes)).toHaveLength(plan.rankedTasks.length);
    expect(plan.taskRoutes["task-syntel-receipt"].route).toBe("SYNTEL");
    expect(plan.memoryWrites.at(-1)?.payload).toHaveProperty("route");
  });
});
