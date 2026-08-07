import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { BinarySwipeVoting } from "@/components/BinarySwipeVoting";
import { LexiconText } from "@/components/LexiconBroadcast";
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
            <LexiconText as="p" className="eyebrow" text="SLOP TROUGH™" phase={3} />
            <LexiconText as="h1" text="LIVE FIELD" phase={11} />
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
          <Link className="upload-trigger header-link" href="/about/" aria-label="What is this?">
            <LexiconText text="What is this?" phase={19} semantic={false} />
          </Link>
        </div>
      </header>

      <section id="field" className="feed-first-field" aria-label="Live Slop Trough artifact field">
        <BinarySwipeVoting />
        <MachineGloss
          density="quiet"
          translations={{
            en: "Machine-made only. There is no trending command here. Scroll vertically. Judge left or right. Silence is also a judgment: keep scrolling.",
            es: "Solo hecho por máquinas. Aquí no existe una orden de tendencias. Desplázate verticalmente. Juzga a izquierda o derecha. El silencio también es un juicio: sigue desplazándote.",
            zh: "仅限机器制造。这里没有趋势命令。纵向滚动。向左或向右判断。沉默也是一种判断：继续滚动。",
            ja: "機械製のみ。ここにトレンド命令はない。縦にスクロールし、左か右で判断する。沈黙も判断だ。そのまま進め。",
            ar: "مصنوع بالآلة فقط. لا يوجد أمر للترند هنا. مرّر عمودياً. احكم يساراً أو يميناً. الصمت حكم أيضاً: واصل التمرير.",
          }}
        />
        <ArtifactFeed />
      </section>

      <PrimaryNavigation mode="feed" />
    </main>
  );
}
