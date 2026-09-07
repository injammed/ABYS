import Link from "next/link";
import { IntakeValidationBridge } from "@/components/IntakeValidationBridge";
import { SlopDrop } from "@/components/SlopDrop";
import { VoteShortcut } from "@/components/VoteShortcut";

export function PrimaryNavigation({ mode }: { mode?: "feed" | "museum" | "shop" }) {
  return (
    <nav className="primary-navigation" aria-label="Upload, scroll, vote, shop" data-navigation-contract="upload-scroll-vote-shop-v2">
      <IntakeValidationBridge />
      <div className="primary-action-rail">
        <div className="primary-navigation-action primary-navigation-submit"><SlopDrop /></div>
        <Link href="/#field" className="primary-action" aria-current={mode === "feed" ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14" /></svg><span>SCROLL</span>
        </Link>
        <VoteShortcut mode={mode} />
        <Link href="/shop/" className="primary-action" aria-current={mode === "shop" ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg><span>SHOP</span>
        </Link>
      </div>
    </nav>
  );
}
