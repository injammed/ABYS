import Link from "next/link";
import { IntakeValidationBridge } from "@/components/IntakeValidationBridge";
import { SlopDrop } from "@/components/SlopDrop";
import { VoteShortcut } from "@/components/VoteShortcut";

export function PrimaryNavigation({ mode }: { mode?: "feed" | "museum" | "shop" | "argus" }) {
  return (
    <nav className="primary-navigation" aria-label="Upload, scroll, vote, shop, Árgos" data-navigation-contract="upload-scroll-vote-shop-argus-v3">
      <IntakeValidationBridge />
      <div className="primary-action-rail">
        <div className="primary-navigation-action primary-navigation-submit"><SlopDrop /></div>
        <Link href="/#field" className="primary-action" aria-current={mode === "feed" ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14" /></svg><span>SCROLL</span>
        </Link>
        <VoteShortcut mode={mode === "argus" ? undefined : mode} />
        <Link href="/shop/" className="primary-action" aria-current={mode === "shop" ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg><span>SHOP</span>
        </Link>
        <Link href="/argus/" className="primary-action" aria-current={mode === "argus" ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><span>ÁRGOS</span>
        </Link>
      </div>
    </nav>
  );
}
