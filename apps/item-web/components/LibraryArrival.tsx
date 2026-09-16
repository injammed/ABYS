"use client";
import { useEffect } from "react";

/** Keep shared feed bookmarks and publication receipts working after the library move. */
export function LibraryArrival() {
  useEffect(() => {
    const arrive = () => {
      const old = new URL(window.location.href);
      if (!["#field", "#vote"].includes(old.hash) && !old.searchParams.has("published")) return;
      const target = new URL(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/slop-trough/`, old.origin);
      target.search = old.search;
      target.hash = old.hash || "#field";
      window.location.replace(target.toString());
    };
    arrive();
    window.addEventListener("hashchange", arrive);
    return () => window.removeEventListener("hashchange", arrive);
  }, []);
  return null;
}
