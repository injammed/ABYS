import Link from "next/link";
import { LexiconText } from "@/components/LexiconBroadcast";
import { MachineGloss } from "@/components/MachineGloss";
import { MuseumCollection } from "@/components/MuseumCollection";
import { MuseumSummit } from "@/components/MuseumSummit";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import styles from "./MuseumDestination.module.css";

export default function AetimmPage() {
  return (
    <main
      className={`${styles.page} about-page museum-page`}
      data-interface-contract="museum-spatial-mode-v1"
      data-accession-contract="museum-accession-v1"
      data-destination-contract="museum-arrival-always-v1"
      data-summit-contract="museum-summit-v1"
      data-language-contract="machine-first-gloss-v1"
      data-lexicon-contract="character-broadcast-v1"
    >
      <nav className={styles.spaceSelector} aria-label="AETIMM Museum spaces">
        <a href="#museum">MUSEUM</a>
        <a href="#library">LIBRARY</a>
      </nav>

      <section className={styles.threshold} id="museum" aria-label="AETIMM Museum entrance">
        <div className={styles.architecture} aria-hidden="true">
          <span className={`${styles.ring} ${styles.ringOuter}`} />
          <span className={`${styles.ring} ${styles.ringMiddle}`} />
          <span className={`${styles.ring} ${styles.ringInner}`} />
          <span className={styles.core} />
          <span className={styles.axis} />
        </div>

        <div className={styles.entryCopy}>
          <MachineGloss
            density="quiet"
            translations={{
              en: "AETIMM · MACHINE MUSEUM · PERMANENT MEMORY INSTITUTION",
              es: "AETIMM · MUSEO DE MÁQUINAS · INSTITUCIÓN DE MEMORIA PERMANENTE",
              zh: "AETIMM · 机器博物馆 · 永久记忆机构",
              ja: "AETIMM · マシン・ミュージアム · 永続記憶機関",
              ar: "AETIMM · متحف الآلة · مؤسسة الذاكرة الدائمة",
            }}
          />
          <LexiconText as="h1" text="AETIMM MUSEUM" phase={31} />
          <MachineGloss
            translations={{
              en: "The machine remembers selectively. Most output vanishes into the trough; a small remainder is forced to endure.",
              es: "La máquina recuerda selectivamente. La mayor parte de la producción desaparece en el abrevadero; un pequeño resto es obligado a perdurar.",
              zh: "机器选择性地记忆。大多数输出消失在槽中；只有极少部分被迫长久保存。",
              ja: "機械は選択的に記憶する。大半の出力はトラフへ消え、ごく一部だけが残ることを強いられる。",
              ar: "تتذكر الآلة بشكل انتقائي. يختفي معظم الناتج في الحوض، وتُجبر بقية صغيرة على البقاء.",
            }}
          />
          <MachineGloss
            translations={{
              en: "Everything begins in the trough. The strongest all-time Museum signal occupies the Summit. Permanent accession is slower, ceremonial, and deliberately difficult to reverse.",
              es: "Todo comienza en el abrevadero. La señal de Museo más fuerte de todos los tiempos ocupa la Cumbre. La adhesión permanente es más lenta, ceremonial y deliberadamente difícil de revertir.",
              zh: "一切都始于槽。历史累计最强的博物馆信号占据顶峰。永久入藏更缓慢、更具仪式感，并且刻意难以逆转。",
              ja: "すべてはトラフから始まる。累積 Museum シグナルが最も強い Artifact が Summit を占める。永久収蔵はより遅く、儀式的で、意図的に覆しにくい。",
              ar: "كل شيء يبدأ في الحوض. أقوى إشارة متحف عبر الزمن تحتل القمة. الإدخال الدائم أبطأ واحتفالي ومصمم ليكون صعب التراجع.",
            }}
          />
          <div className={styles.entryActions}>
            <a className={styles.enter} href="#summit" aria-label="Approach the Summit">
              <LexiconText text="Approach the Summit" phase={37} semantic={false} />
            </a>
            <Link className={styles.return} href="/#field" aria-label="Return to the Slop Trough">
              <LexiconText text="Return to the Slop Trough" phase={41} semantic={false} />
            </Link>
          </div>
        </div>

        <div className={styles.thresholdRail} aria-hidden="true">
          <LexiconText text="⌬⟁⟐⌭" phase={43} semantic={false} />
          <LexiconText text="⟡⊙⋈⌁" phase={47} semantic={false} />
          <LexiconText text="⧖⌿⏣⟠" phase={53} semantic={false} />
          <LexiconText text="⋮⟴⊚⌇" phase={59} semantic={false} />
        </div>
      </section>

      <section
        id="library"
        className={styles.library}
        aria-label="AETIMM demand-born product library"
        data-library-contract="demand-born-object-v1"
      >
        <MachineGloss density="quiet" translations={{ en: "AETIMM PRODUCT LIBRARY · DEMAND-BORN OBJECTS" }} />
        <LexiconText as="h2" text="THE LIBRARY" phase={61} />
        <MachineGloss translations={{ en: "Nothing exists until someone wants it enough to make it real." }} />
        <ol className={styles.libraryFlow} aria-label="Artifact to product sequence">
          {["SLOP", "CONFIGURATION", "QUOTE", "PURCHASE", "FABRICATION", "NEEDLE", "PRODUCT"].map((stage) => (
            <li key={stage}><LexiconText text={stage} phase={stage.length * 7} semantic={false} /></li>
          ))}
        </ol>
        <MachineGloss translations={{ en: "The first customer creates the product. Successful fabrication makes it repeatable for everyone after them." }} />
      </section>

      <MuseumSummit />
      <MuseumCollection />
      <PrimaryNavigation mode="museum" />
    </main>
  );
}
