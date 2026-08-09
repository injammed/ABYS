import Link from "next/link";
import { AccountGate } from "@/components/AccountGate";
import { IntakeValidationBridge } from "@/components/IntakeValidationBridge";
import { LexiconText } from "@/components/LexiconBroadcast";
import { SlopDrop } from "@/components/SlopDrop";

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
      data-arrival-contract="active-mode-is-not-a-button-v1"
    >
      <IntakeValidationBridge />

      <div className="primary-mode-switch" aria-label="Choose primary experience">
        {mode === "feed" ? (
          <div
            className="primary-mode-link primary-mode-feed active"
            aria-current="page"
            aria-label="Slop Trough, infinite feed"
          >
            <span className="primary-navigation-mark" aria-hidden="true">≋</span>
            <span aria-hidden="true">
              <LexiconText as="strong" text="SLOP TROUGH" phase={5} semantic={false} />
              <LexiconText as="small" text="Infinite feed" phase={13} semantic={false} />
            </span>
          </div>
        ) : (
          <Link
            className="primary-mode-link primary-mode-feed"
            href="/#field"
            aria-label="Slop Trough, infinite feed"
          >
            <span className="primary-navigation-mark" aria-hidden="true">≋</span>
            <span aria-hidden="true">
              <LexiconText as="strong" text="SLOP TROUGH" phase={5} semantic={false} />
              <LexiconText as="small" text="Infinite feed" phase={13} semantic={false} />
            </span>
          </Link>
        )}

        {mode === "museum" ? (
          <div
            className="primary-mode-link primary-mode-museum active"
            aria-current="page"
            aria-label="AETIMM Museum, spatial selection"
          >
            <span className="primary-navigation-mark" aria-hidden="true">◇</span>
            <span aria-hidden="true">
              <LexiconText as="strong" text="AETIMM MUSEUM" phase={17} semantic={false} />
              <LexiconText as="small" text="Spatial selection" phase={23} semantic={false} />
            </span>
          </div>
        ) : (
          <Link
            className="primary-mode-link primary-mode-museum"
            href="/aetimm/"
            aria-label="AETIMM Museum, spatial selection"
          >
            <span className="primary-navigation-mark" aria-hidden="true">◇</span>
            <span aria-hidden="true">
              <LexiconText as="strong" text="AETIMM MUSEUM" phase={17} semantic={false} />
              <LexiconText as="small" text="Spatial selection" phase={23} semantic={false} />
            </span>
          </Link>
        )}
      </div>

      <div className="primary-utility-rail" aria-label="Secondary controls">
        <div className="primary-navigation-action primary-navigation-submit">
          <SlopDrop />
        </div>

        <Link className="primary-navigation-link" href="/about/" aria-label="About">
          <span className="primary-navigation-mark" aria-hidden="true">i</span>
          <LexiconText text="About" phase={29} semantic={false} />
        </Link>

        <div className="primary-navigation-action primary-navigation-account">
          <AccountGate />
        </div>
      </div>
    </nav>
  );
}
