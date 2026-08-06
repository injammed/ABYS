export type FeedCursor = {
  publishedAt: string;
  id: string;
};

export function encodeFeedCursor(cursor: FeedCursor): string {
  return encodeURIComponent(JSON.stringify(cursor));
}

export function decodeFeedCursor(encoded: string): FeedCursor {
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded)) as Partial<FeedCursor>;
    if (typeof parsed.publishedAt !== "string" || typeof parsed.id !== "string") {
      throw new Error("Cursor fields are missing.");
    }
    if (!parsed.publishedAt || !parsed.id) {
      throw new Error("Cursor fields are empty.");
    }
    return { publishedAt: parsed.publishedAt, id: parsed.id };
  } catch {
    throw new Error("Invalid feed cursor.");
  }
}

export function feedCursorFilter(cursor: FeedCursor): string {
  return [
    `published_at.lt.${cursor.publishedAt}`,
    `and(published_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`,
  ].join(",");
}

export function cursorForRow(row: { published_at: string; id: string }): string {
  return encodeFeedCursor({ publishedAt: row.published_at, id: row.id });
}
