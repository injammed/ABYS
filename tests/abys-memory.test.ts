import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createJsonlMemoryLedger } from "../src/abys-memory";
import type { MemoryEvent } from "../src/abys-kernel";

const event = (id: string, overrides: Partial<MemoryEvent> = {}): MemoryEvent => ({
  id,
  kind: "decision",
  summary: `Memory event ${id}`,
  payload: { tags: ["abys", "test"], value: id },
  createdAt: `2026-05-20T16:0${id}.000Z`,
  importance: 0.5,
  ...overrides,
});

describe("ABYS JSONL memory ledger", () => {
  it("returns an empty list when the ledger does not exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "abys-memory-"));
    const ledger = createJsonlMemoryLedger(join(dir, ".abys", "memory.jsonl"));

    await expect(ledger.read()).resolves.toEqual([]);
    await rm(dir, { recursive: true, force: true });
  });

  it("writes and reads append-only MemoryEvents", async () => {
    const dir = await mkdtemp(join(tmpdir(), "abys-memory-"));
    const ledger = createJsonlMemoryLedger(join(dir, ".abys", "memory.jsonl"));

    await ledger.write(event("1"));
    await ledger.write(event("2", { kind: "artifact", importance: 0.9 }));

    const events = await ledger.read();

    expect(events).toHaveLength(2);
    expect(events.map((item) => item.id)).toEqual(["1", "2"]);
    await rm(dir, { recursive: true, force: true });
  });

  it("queries by kind, importance, tag, text, and limit", async () => {
    const dir = await mkdtemp(join(tmpdir(), "abys-memory-"));
    const ledger = createJsonlMemoryLedger(join(dir, ".abys", "memory.jsonl"));

    await ledger.write(event("1", { summary: "low value note", importance: 0.2 }));
    await ledger.write(event("2", { kind: "pattern", summary: "Codex handoff pattern", importance: 0.95 }));
    await ledger.write(event("3", { kind: "pattern", payload: { tags: ["market"] }, importance: 0.75 }));

    expect(await ledger.query({ kind: "pattern" })).toHaveLength(2);
    expect(await ledger.query({ minImportance: 0.8 })).toHaveLength(1);
    expect(await ledger.query({ tag: "market" })).toHaveLength(1);
    expect(await ledger.query({ text: "handoff" })).toHaveLength(1);
    expect(await ledger.query({ limit: 1 })).toHaveLength(1);

    await rm(dir, { recursive: true, force: true });
  });
});
