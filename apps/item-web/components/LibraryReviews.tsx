import reviews from '@/public/library-reviews.json';
import styles from '@/app/Library.module.css';

export function LibraryReviews() {
  return <section aria-labelledby="review-shelf-title" style={{marginBottom:'4rem'}}>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>BEYOND THE TOPIC TAG</p><h2 id="review-shelf-title">The review shelf.</h2></div><a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/library-reviews.json`}>Download review records ↗</a></div>
    <p className={styles.description}>Source inspection by Codex. These are documented candidates, not endorsements. AI assistance, generated outputs, functional quality, and permission to preserve are separate questions. No source code was run and no work was accessioned.</p>
    <div className={styles.rooms}>{reviews.reviews.map(review => <article key={review.repository} className={styles.room}>
      <div className={styles.roomTop}><span>SOURCE EXAMINED</span><span>{review.reviewedAt}</span></div>
      <h3>{review.title}</h3><p><strong>{review.kind}</strong><br/>{review.summary}</p>
      <p>{review.whyInspect}</p>
      <details><summary>Evidence, limits &amp; next check</summary><p><strong>AI involvement</strong><br/>{review.originEvidence}</p><p><strong>Permission to preserve</strong><br/>{review.licenseEvidence}</p><p><strong>Next check</strong><br/>{review.nextCheck}</p><p>{review.decision}</p><p>Source credit: {review.repository}. Review applies to the linked revision.</p></details>
      <a className={styles.roomAction} style={{paddingTop:'1.5rem'}} href={`https://github.com/${review.repository}/blob/${review.sourceCommit}/README.md`} target="_blank" rel="noreferrer">Read the examined source ↗</a>
    </article>)}</div>
  </section>;
}
