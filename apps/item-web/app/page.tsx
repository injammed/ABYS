import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { BinarySwipeVoting } from "@/components/BinarySwipeVoting";
import { MachineGloss } from "@/components/MachineGloss";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SubmissionLandingBridge } from "@/components/SubmissionLandingBridge";

export default function HomePage() {
  return (
    <main className="feed-first-page" data-interface-contract="slop-feed-root-v1" data-language-contract="machine-first-gloss-v1">
      <SubmissionLandingBridge />

      <header className="site-header feed-first-header">
        <a className="brand-lockup feed-first-brand" href="#field" aria-label="Return to the live feed">
          <div className="brand-mark" aria-hidden="true">◇</div>
          <div>
            <p className="eyebrow">SLOP TROUGH™</p>
            <h1>LIVE FIELD</h1>
          </div>
        </a>

        <div className="feed-first-live" aria-label="Live public artifact field">
          <span className="signal-dot" aria-hidden="true" />
          <MachineGloss
            density="quiet"
            translations={{
              en: "Upload machine-made slop. Scroll the public trough. Vote Slop or Museum, or ignore it and keep moving.",
              es: "Sube slop hecho por máquinas. Recorre el abrevadero público. Vota Slop o Museo, o ignóralo y sigue.",
              zh: "上传机器制造的 slop。滚动公共槽。投票 Slop 或博物馆，或者忽略它继续前进。",
              ja: "機械製のスロップを投げ込む。公開トラフをスクロールする。Slop か Museum に投票するか、無視して進む。",
              ar: "ارفع سلوب مصنوعاً بالآلة. مرّر في الحوض العام. صوّت سلوب أو متحف، أو تجاهله واستمر.",
            }}
          />
          <Link className="upload-trigger header-link" href="/about/">
            What is this?
          </Link>
        </div>
      </header>

      <section id="field" className="feed-first-field" aria-label="Live Slop Trough artifact field">
        <BinarySwipeVoting />
        <ArtifactFeed />
      </section>

      <PrimaryNavigation mode="feed" />
    </main>
  );
}
