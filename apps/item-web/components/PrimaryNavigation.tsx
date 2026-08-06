import Link from "next/link";
import { AccountGate } from "@/components/AccountGate";
import { UploadGate } from "@/components/UploadGate";

export function PrimaryNavigation() {
  return (
    <nav className="primary-navigation" aria-label="Primary navigation">
      <Link className="primary-navigation-link" href="/#field">
        <span className="primary-navigation-mark" aria-hidden="true">≋</span>
        <span>Feed</span>
      </Link>

      <div className="primary-navigation-action primary-navigation-submit">
        <UploadGate />
      </div>

      <Link className="primary-navigation-link primary-navigation-museum" href="/aetimm/">
        <span className="primary-navigation-mark" aria-hidden="true">◇</span>
        <span>Museum</span>
      </Link>

      <Link className="primary-navigation-link" href="/about/">
        <span className="primary-navigation-mark" aria-hidden="true">i</span>
        <span>About</span>
      </Link>

      <div className="primary-navigation-action primary-navigation-account">
        <AccountGate />
      </div>
    </nav>
  );
}
