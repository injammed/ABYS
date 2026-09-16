import Link from "next/link";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SiteHeader } from "@/components/SiteHeader";
import { LibraryArrival } from "@/components/LibraryArrival";
import styles from "./Library.module.css";

const rooms = [
  { number: "01", title: "Objects & currencies", kind: "WALKABLE COLLECTION", text: "Explore proposed currency forms in three dimensions. Walk the halls, inspect an object, download its model.", href: "/shop/#museum", action: "Enter the collection" },
  { number: "02", title: "Slop Trough™", kind: "THE OPEN FIELD", text: "Throw it in. Look at slop. Vote. Find needles. Machine-made work and public judgment, without interruption.", href: "/slop-trough/#field", action: "Enter the Trough" },
  { number: "03", title: "The Museum", kind: "PRESERVATION & JUDGMENT", text: "A spatial view of the currency collection. Inspect concept studies and follow the evidence behind each proposed form.", href: "/aetimm/#museum", action: "Explore the Museum" },
  { number: "04", title: "Apyoc", kind: "MACHINE OBSERVATION", text: "One observer, many eyes. Inspect the machine activity currently in view, its evidence, and the limits of coverage.", href: "/apyoc/", action: "Open the Eye" },
  { number: "05", title: "The Editions", kind: "PAPERS & IDEAS", text: "Begin with The Diamond Tesseract: a public concept paper on currency as a three-dimensional physical object.", href: "/literature/item-0001/", action: "Read the first edition" },
  { number: "06", title: "The Shop", kind: "FROM THOUGHT TO THING", text: "Explore editions and proposed objects. Follow the ambition from digital studies toward physical manufacture.", href: "/shop/#shop", action: "Visit the Shop" },
];
const fields = ["Currencies", "Materials", "Energy", "Information", "AI & cognition", "Human power", "Defense", "Space", "Planetary systems", "Life", "Health", "Manufacturing", "Transportation", "Art & culture", "Knowledge", "Time", "Environment", "Society", "The extremes", "Possibility"];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function HomePage() {
  return (
    <main className={styles.page} data-interface-contract="aetimm-library-root-v1">
      <LibraryArrival />
      <SiteHeader mode="library" />
      <div className={styles.content}>
        <header className={styles.entrance}>
          <div className={styles.introduction}>
            <p className={styles.eyebrow}>AETIMM / OPEN TO HUMANITY</p>
            <h1>The library<br />of <em>things.</em></h1>
            <p className={styles.lead}>Objects. Ideas. Machines.<br />Everything worth carrying forward.</p>
            <p className={styles.description}>A growing physical–digital library. Explore what exists, what has been imagined, and what could be made.</p>
            <div className={styles.actions}><Link href="#collections">Browse the library <span aria-hidden="true">↓</span></Link><Link href="/shop/#museum">Walk the collection <span aria-hidden="true">↗</span></Link></div>
            <p className={styles.motto}>DETECT. ENCODE. CONTINUE.</p>
          </div>
          <figure className={styles.vision}>
            <a href={`${basePath}/images/aetimm-library-of-things.jpeg`} target="_blank" rel="noreferrer" aria-label="Open the full Library of Things concept artwork">
              <img src={`${basePath}/images/aetimm-library-of-things.jpeg`} width={1312} height={1199} alt="AETIMM Library of Things concept: a grand illuminated library with collections spanning currencies, nature, technology, knowledge, and possibility." fetchPriority="high" />
            </a>
            <figcaption>THE LIBRARY, ENVISIONED / CONCEPT ARTWORK</figcaption>
          </figure>
        </header>
        <section id="collections" className={styles.collections} aria-labelledby="collections-title">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>FIND YOUR WAY</p><h2 id="collections-title">Inside the library.</h2></div><p>Different rooms. One library.</p></div>
          <div className={styles.rooms}>{rooms.map(room => <Link key={room.number} href={room.href} className={styles.room}><div className={styles.roomTop}><span>{room.number}</span><span>{room.kind}</span></div><h3>{room.title}</h3><p>{room.text}</p><span className={styles.roomAction}>{room.action}<span aria-hidden="true">↗</span></span></Link>)}</div>
        </section>
        <section className={styles.scope} aria-labelledby="scope-title"><div><p className={styles.eyebrow}>THE LONG VIEW</p><h2 id="scope-title">All matter.<br />All meaning.</h2><p>The ambition is a library across every scale of existence. The rooms above are open now; this is the wider scope we are building toward.</p></div><ul>{fields.map(field => <li key={field}>{field}</li>)}</ul></section>
        <section className={styles.scouts} aria-labelledby="scouts-title"><div><p className={styles.eyebrow}>LIBRARY SCOUTS / IN DEVELOPMENT</p><h2 id="scouts-title">Find what deserves a place.</h2><p>Agents will search the public web for exceptional AI-made things and bring back the original source, provenance, and a reason to look closer. Discovery is the beginning; judgment and preservation follow.</p></div><a href={`${basePath}/library-scouts.json`}>Read the scouting protocol ↗</a></section>
        <footer className={styles.footer}><span>AETIMM / LIBRARY OF THINGS</span><Link href="/about/">About the library ↗</Link><Link href="/simulator/">Generation study ↗</Link></footer>
      </div>
      <PrimaryNavigation />
    </main>
  );
}
