import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Diamond Tesseract · Final Draft · AETIMM",
  description: "A Three-Dimensional Synthetic-Diamond Monetary Architecture — Final Technical Concept Paper, Draft 3 of 3, September 2026.",
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const AETIMM_DONATION = "https://donate.stripe.com/9B600k6Djbx45V37Pj2Ry01";

const sections = [
  ["Executive thesis", [
    "The Diamond Tesseract is proposed as an experimental precursor to three possible future classes of American physical value instrument: sovereign currency, reserve instrument, and high-denomination bearer asset.",
    "Its flagship architecture is deliberately narrow: a large synthetic-diamond cube assembled from multiple diamond elements around a premanufactured internal metallic sphere or sculpture, then finished with durable American iconography, denomination, serial identity, and instrument-verifiable physical characteristics.",
    "The broader paradigm is three-dimensional currency. Synthetic diamond is its flagship material family; the cube is its canonical form; the Tesseract is the high-denomination frontier. Other cubes, blocks, pyramids, rough-cut pieces, and future materials are cousins of the flagship rather than competing definitions.",
    "Purpose: establish a serious U.S. research path from concept to one non-monetary physical demonstrator, then determine whether the architecture warrants intellectual-property protection, further prototyping, standards development, and ultimately consideration by the lawful monetary authorities.",
    "Human proposition: can the United States create a lawful physical instrument capable of placing $250,000 or more of cold, tangible value in the palm of a hand—an object that can be inspected, transported, transferred, insured, secured in a bank vault, and carried across institutional and national boundaries subject to applicable law?",
    "Governmental boundary: this paper does not claim existing legal-tender status, government approval, guaranteed counterfeit immunity, or a solved large-scale diamond-joining process. Any actual issuance would require lawful authority, security controls, monetary-policy analysis, and agency action."
  ]],
  ["1 · Object definition and canonical creation path", [
    "The Tesseract is not merely a diamond with artwork. It is a heterogeneous three-dimensional monetary artifact in which enclosure, internal sculpture, sovereign visual language, and physical identity are designed as one object. The internal sphere is visible through the surrounding diamond and makes the interior volume itself part of the monetary design field. Currency progresses from print, to relief, to volume.",
    "Perfect optical geometry is an ideal, not a validity requirement. A finished object may preserve measurable evidence of growth, cutting, polishing, joining, strain, inclusions, and interfaces. Those characteristics can become part of individual identity rather than defects that must be cosmetically erased.",
    "Canonical creation path: grow or procure documented synthetic-diamond elements; characterize each element before assembly; manufacture and characterize the internal metallic sphere or sculpture independently; assemble the enclosure around the core using a joining architecture demonstrated by coupon and subscale testing; finish and engrave the assembled body; perform final nondestructive metrology and seal the manufacturing and inspection history.",
    "The unresolved step is intentionally visible: current research demonstrates sophisticated diamond growth, micromachining, and engineered bonding interfaces, but it does not establish the proposed large six-sided enclosure as a mature manufacturing process."
  ]],
  ["2 · Authentication, iconography, custody and physical security", [
    "Authentication should be multimodal and should never rest on one secret mark. The verifier must answer two independent questions: is the material consistent with the specified laboratory-grown diamond system, and is this the same individual article recorded at issuance?",
    "The evidentiary stack combines a human layer, metrology layer, optical/spectroscopic layer, core layer, and controlled reference layer containing manufacturing genealogy, baseline measurements, status, custody events, retirement/redemption state, and signed audit history.",
    "The flagship should be unmistakably American at first inspection without copying an existing note or coin. The design language may integrate Liberty, the American eagle, Great Seal vocabulary, stars, constitutional text, architecture, scientific and industrial achievement, denomination, date, serial identity, and edge/corner treatments.",
    "Physical custody is a feature—and a liability. The object occupies space and therefore requires secure manufacture, armored logistics, vaults, insurance, inventory control, loss protocols, and forensic examination. Theft, coercion, smuggling, loss, fracture, unauthorized recutting, substitution, and fraudulent registry entries must be assumed and tested against."
  ]],
  ["3 · Monetary thesis and United States institutional role", [
    "The final concept deliberately stops before choosing one legal classification. The Tesseract is an experimental precursor to sovereign currency, a reserve or settlement instrument, or a bearer-style asset if lawful authorities establish the corresponding status and rules.",
    "The $250,000-plus denomination is a design target, not present legal tender. Its purpose is to force the architecture to answer whether very high nominal value can remain physically holdable without becoming a paper certificate for something stored elsewhere.",
    "The project is an architectural inversion of cryptocurrency. Bitcoin is digital and ledger-native; the Tesseract proposal is deliberately material and custody-native. The thing of value is intended to be a public physical article whose existence must be manufactured, measured, moved, stored, and possessed.",
    "Synthetic diamond itself is not scarce. Therefore the monetary scarcity of any future Tesseract cannot honestly rest on carbon scarcity. It must rest on authorized issuance, serial identity, manufacturing controls, legal denomination, status records, and public confidence.",
    "If the object ever progresses beyond a private demonstrator, only government can lawfully answer the central monetary questions: issuance, denomination, legal-tender status, quantity, redemption, counterfeiting standards, verification, and cross-border regulation."
  ]],
  ["4 · Federal action program and decision standard", [
    "Recommended action: STUDY → PROTECT → PROTOTYPE → TEST → STANDARDIZE → AUTHORIZE → MANUFACTURE.",
    "The Government should not begin by assigning a denomination. It should begin by determining whether the object can exist as a credible engineered artifact. Intellectual-property counsel should independently evaluate novelty, inventorship, prior art, public-disclosure consequences, and protection strategy; this paper makes no patentability claim.",
    "The Diamond Tesseract should survive or fail on evidence. If a large multi-element synthetic-diamond enclosure cannot be manufactured reliably, authenticated economically, secured operationally, or justified against simpler instruments, the flagship should stop or be redesigned. The broader 3D-currency paradigm can continue independently.",
    "$250,000+ OF POTENTIAL PHYSICAL VALUE — IN THE PALM OF A HAND.",
    "PUBLIC. MATERIAL. INSPECTABLE. TRANSPORTABLE. VAULTABLE. AMERICAN-ORIGIN."
  ]]
] as const;

const buttonStyle = {
  minHeight: 84,
  borderRadius: 8,
  padding: "18px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  textDecoration: "none",
  letterSpacing: ".08em",
  fontSize: 14,
  fontWeight: 700,
} as const;

export default function Item0001() {
  return (
    <main style={{background:"#070a0f",color:"#f2f2ef",minHeight:"100vh",fontFamily:"Arial, Helvetica, sans-serif",lineHeight:1.65}}>
      <div style={{maxWidth:980,margin:"0 auto",padding:"42px clamp(20px,5vw,52px) 120px"}}>
        <p style={{margin:"0 0 34px"}}><Link href="/shop/" style={{color:"#bca8d8",fontSize:18}}>← AETIMM / THE EDITIONS</Link></p>
        <p style={{margin:"0 0 24px",textAlign:"center",letterSpacing:".2em",fontSize:12,color:"#d7d7d1"}}>ITEM 0001 · FINAL TECHNICAL CONCEPT PAPER<br />DRAFT 3 OF 3 · SEPTEMBER 2026</p>
        <h1 style={{fontSize:"clamp(48px,10vw,96px)",lineHeight:.88,letterSpacing:"-.045em",textAlign:"center",margin:"0"}}>THE DIAMOND<br />TESSERACT</h1>

        <figure style={{margin:"6px auto 8px",display:"grid",placeItems:"center",maxWidth:960}}>
          <img src={`${basePath}/images/diamond-tesseract-pair.webp?v=4`} alt="Two equal Diamond Tesseract concept studies, presented symmetrically" style={{display:"block",width:"100%",height:"auto",objectFit:"contain",border:0,background:"transparent"}} />
        </figure>

        <p style={{fontSize:"clamp(18px,3vw,25px)",textAlign:"center",letterSpacing:".14em",lineHeight:1.45,textTransform:"uppercase",margin:"6px auto 18px",maxWidth:820}}>A Three-Dimensional Synthetic-Diamond<br />Monetary Architecture</p>
        <div style={{width:64,height:1,background:"#a9a9a4",margin:"20px auto"}} />
        <p style={{textAlign:"center",letterSpacing:".12em",fontSize:12,color:"#d6d6d0",margin:"0 auto 28px"}}>ADAM BRYANT SUMMERS<br />INDEPENDENT CONCEPT · NOT LEGAL TENDER · NO GOVERNMENT ENDORSEMENT</p>
        <div style={{width:64,height:1,background:"#a9a9a4",margin:"0 auto 28px"}} />

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,margin:"0 0 16px"}}>
          <a href="#executive-thesis" style={{...buttonStyle,background:"#f4f3ef",color:"#111318",border:"1px solid #f4f3ef"}}><span>READ FINAL DRAFT<br /><small style={{fontWeight:400,letterSpacing:".16em"}}>5 PAGES · FREE</small></span><span aria-hidden="true">↘</span></a>
          <a href={AETIMM_DONATION} target="_blank" rel="noreferrer" style={{...buttonStyle,background:"transparent",color:"#f4f3ef",border:"1px solid #d9d9d4"}}><span>♡ &nbsp; DONATE ANY AMOUNT<br /><small style={{fontWeight:400,letterSpacing:".16em",color:"#9ea1a7"}}>SUPPORT AETIMM</small></span><span aria-hidden="true">∞</span></a>
        </div>
        <p style={{textAlign:"center",letterSpacing:".17em",fontSize:11,color:"#777d88",margin:"24px 0 52px"}}>KNOWLEDGE IS PUBLIC. DONATIONS SUPPORT DEVELOPMENT.</p>

        <div style={{height:1,background:"#222833",margin:"0 0 44px"}} />
        {sections.map(([title, paragraphs], index) => <section id={index === 0 ? "executive-thesis" : undefined} key={title} style={{margin:"0 0 62px"}}><h2 style={{fontSize:"clamp(22px,3vw,30px)",letterSpacing:".16em",textTransform:"uppercase",fontWeight:500,margin:"0 0 20px"}}>{title}</h2>{paragraphs.map((p)=><p key={p} style={{fontSize:"clamp(17px,2.2vw,21px)",color:"#c9cdd5",margin:"0 0 18px"}}>{p}</p>)}</section>)}
        <section style={{marginTop:70}}><h2 style={{fontSize:24,letterSpacing:".12em",textTransform:"uppercase"}}>References</h2><p>[1] United States Mint, “About,” accessed September 2026.</p><p>[2] S. Eaton-Magaña, M. F. Hardman, S. Odake, “Laboratory-Grown Diamonds: An Update on Identification and Products Evaluated at GIA,” Gems & Gemology, Summer 2024.</p><p>[3] B. Ali, I. V. Litvinyuk, M. Rybachuk, “Femtosecond laser micromachining of diamond: Current research status, applications and challenges,” Carbon 179 (2021), 209–226.</p><p>[4] X. Guo et al., “Direct-bonded diamond membranes for heterogeneous quantum and electronic technologies,” Nature Communications 15 (2024).</p></section>
        <hr style={{margin:"48px 0",border:0,borderTop:"1px solid #222833"}} /><p style={{color:"#aeb2bb"}}><strong>FINAL DRAFT CONTROL.</strong> Draft 3 of 3 closes the concept-definition process. It preserves the flagship object, wider 3D-currency family, physical counterpoint to ledger-native money, American-origin thesis, and the requirement that unresolved physics become explicit experiments rather than unsupported claims.</p>
      </div>
    </main>
  );
}
