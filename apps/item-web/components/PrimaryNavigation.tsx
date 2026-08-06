import Link from "next/link";
import { AccountGate } from "@/components/AccountGate";
import { UploadGate } from "@/components/UploadGate";

type PrimaryMode = "feed" | "museum";

type PrimaryNavigationProps = {
  mode?: PrimaryMode;
};

export function PrimaryNavigation({ mode }: PrimaryNavigationProps) {
  return (
    <nav
      className="primary-navigation"
      aria-label="Primary experience and utility navigation"
      data-navigation-contract="primary-mode-coin-flip-v1"
    >
      <div className="primary-mode-switch" aria-label="Choose primary experience">
        <Link
          className={mode === "feed" ? "primary-mode-link primary-mode-feed active" : "primary-mode-link primary-mode-feed"}
          href="/#field"
          aria-current={mode === "feed" ? "page" : undefined}
        >
          <span className="primary-navigation-mark" aria-hidden="true">≋</span>
          <span>
            <strong>SLOP TROUGH</strong>
            <small>Infinite feed</small>
          </span>
        </Link>

        <Link
          className={mode === "museum" ? "primary-mode-link primary-mode-museum active" : "primary-mode-link primary-mode-museum"}
          href="/aetimm/"
          aria-current={mode === "museum" ? "page" : undefined}
        >
          <span className="primary-navigation-mark" aria-hidden="true">◇</span>
          <span>
            <strong>AETIMM MUSEUM</strong>
            <small>Spatial selection</small>
          </span>
        </Link>
      </div>

      <div className="primary-utility-rail" aria-label="Secondary controls">
        <div className="primary-navigation-action primary-navigation-submit">
          <UploadGate />
        </div>

        <Link className="primary-navigation-link" href="/about/">
          <span className="primary-navigation-mark" aria-hidden="true">i</span>
          <span>About</span>
        </Link>

        <div className="primary-navigation-action primary-navigation-account">
          <AccountGate />
        </div>
      </div>
    </nav>
  );
}
