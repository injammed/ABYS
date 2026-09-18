import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PrimaryNavigation } from '@/components/PrimaryNavigation';
import { LibraryReviews } from '@/components/LibraryReviews';
import { LibraryScouts } from '@/components/LibraryScouts';
import styles from '../Library.module.css';
export const metadata: Metadata={title:'Library Scouts · AETIMM',description:'Public source discovery for the AETIMM Library of Things. Inspect candidates, provenance signals, and the scope of each run.'};
export default function ScoutsPage(){return <main className={styles.page}><SiteHeader/><div className={styles.content}><header className={styles.scouts}><div><p className={styles.eyebrow}>AETIMM / LIBRARY SCOUTS</p><h1>Find what deserves a place.</h1><p>Scouts bring possibilities into view. Source inspection, independent judgment, and preservation come next.</p></div><Link href="/">Return to the library ↗</Link></header><LibraryReviews/><LibraryScouts/></div><PrimaryNavigation/></main>;}
