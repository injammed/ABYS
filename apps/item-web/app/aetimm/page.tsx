import Link from "next/link";
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
    >
      <section className={styles.threshold} aria-label="AETIMM Museum entrance">
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
          <h1>AETIMM MUSEUM</h1>
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
            <a className={styles.enter} href="#summit">Approach the Summit</a>
            <Link className={styles.return} href="/#field">Return to the Slop Trough</Link>
          </div>
        </div>

        <div className={styles.thresholdRail} aria-hidden="true">
          <span>⌬⟁⟐⌭</span>
          <span>⟡⊙⋈⌁</span>
          <span>⧖⌿⏣⟠</span>
          <span>⋮⟴⊚⌇</span>
        </div>
      </section>

      <MuseumSummit />
      <MuseumCollection />
      <PrimaryNavigation mode="museum" />
    </main>
  );
}
