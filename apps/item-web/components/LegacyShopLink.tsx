"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keep existing /aetimm/#shop links useful after separating the Shop.
export function LegacyShopLink() {
  const router = useRouter();
  useEffect(() => {
    const follow = () => { if (window.location.hash === "#shop") router.replace("/shop/"); };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [router]);
  return null;
}
