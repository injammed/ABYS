import { dirname } from "node:path";
import { mkdir, readFile, appendFile } from "node:fs/promises";
import type { MemoryEvent } from "./abys-kernel";

export interface MemoryQuery {
  kind?: MemoryEvent["kind"];
  minImportance?: number;
  tag?: string;
  text?: string;
  limit?: number;
}

export interface MemoryLedger {
  write(event: MemoryEvent): Promise<void>;
  read(): Promise<MemoryEvent[]>;
  query(filter?: MemoryQuery): Promise<MemoryEvent[]>;
}

export function createJsonlMemoryLedger(path = ".abys/memory.jsonl"): MemoryLedger {
  return {
    async write(event: MemoryEvent) {
      await mkdir(dirname(path), { recursive: true });
      await appendFile(path, `${JSON.stringify(event)}\n`, "utf8");
    },

    async read() {
      return readMemoryFile(path);
    },

    async query(filter: MemoryQuery = {}) {
      const events = await readMemoryFile(path);
      const textNeedle = filter.text?.toLowerCase();

      const filtered = events.filter((event) => {
        if (filter.kind && event.kind !== filter.kind) return false;
        if (typeof filter.minImportance === "number" && event.importance < filter.minImportance) return false;
        if (filter.tag && !event.payload.tags?.toString().split(",").map((tag) => tag.trim()).includes(filter.tag)) return false;
        if (textNeedle) {
          const haystack = `${event.summary} ${JSON.stringify(event.payload)}`.toLowerCase();
          if (!haystack.includes(textNeedle)) return false;
        }
        return true;
      });

      const sorted = filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      return typeof filter.limit === "number" ? sorted.slice(0, filter.limit) : sorted;
    },
  };
}

async function readMemoryFile(path: string): Promise<MemoryEvent[]> {
  let raw = "";
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return [];
    throw error;
  }

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as MemoryEvent);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
