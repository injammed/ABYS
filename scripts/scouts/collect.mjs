import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseScoutReport, scoutQueries } from './schema.ts';

// Two fixed GitHub API calls. Source material cannot choose endpoints or execute code.
export async function collect({ previous = null, request = fetch, id, sourceCommit, now = new Date().toISOString() }) {
  const seen = new Set(previous ? parseScoutReport(previous).seenIds : []);
  const before = new Set(seen);
  const candidates = new Map();
  const queries = [];
  for (const query of scoutQueries) {
    try {
      const url = new URL('https://api.github.com/search/repositories');
      url.search = new URLSearchParams({ q: query, sort: 'updated', order: 'desc', per_page: '10' }).toString();
      const response = await request(url, { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) }, redirect: 'error', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw Error('Search unavailable');
      const raw = await response.text();
      if (raw.length > 2000000) throw Error('Oversized response');
      const data = JSON.parse(raw);
      if (data.incomplete_results !== false || !Array.isArray(data.items) || data.items.length > 10) throw Error('Incomplete search');
      const batch = [];
      for (const item of data.items) {
        if (!Number.isSafeInteger(item.id) || item.id <= 0 || typeof item.full_name !== 'string' || !/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(item.full_name) || !Number.isSafeInteger(item.stargazers_count) || item.stargazers_count < 0 || !Array.isArray(item.topics) || item.private !== false || item.fork !== false || item.archived !== false) throw Error('Invalid public metadata');
        const signals = item.topics.filter(t => ['ai-generated','generative-art'].includes(t));
        if (!signals.length) continue;
        const spdx = item.license?.spdx_id;
        batch.push({ id: item.id, repository: item.full_name, stars: item.stargazers_count, license: typeof spdx === 'string' && /^[A-Za-z0-9.+-]{1,80}$/.test(spdx) && spdx !== 'NOASSERTION' ? spdx : null, signals: [...new Set(signals)], newlySeen: !before.has(item.id) });
      }
      if (new Set([...seen, ...batch.map(c => c.id)]).size > 10000) throw Error('History capacity reached');
      for (const c of batch) { candidates.set(c.id,c); seen.add(c.id); }
      queries.push({ query, state: 'completed', returned: data.items.length });
    } catch { queries.push({ query, state: 'failed', returned: 0 }); }
  }
  const successes = queries.filter(q => q.state === 'completed').length;
  return parseScoutReport({ version: 1, id, checkedAt: now, sourceCommit, state: successes === 2 ? 'completed' : successes === 1 ? 'partial' : 'failed', queries, candidates: [...candidates.values()].sort((a,b) => Number(b.newlySeen)-Number(a.newlySeen) || b.stars-a.stars || a.id-b.id), seenIds: [...seen].sort((a,b)=>a-b) });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [previousDir, output] = process.argv.slice(2);
  // Missing history is only valid when the workflow proved that the branch does not exist.
  const previous = previousDir === '-' ? null : JSON.parse(await readFile(`${previousDir}/latest.json`,'utf8'));
  const report = await collect({ previous, id: process.env.SCOUT_RUN_ID ?? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`, sourceCommit: process.env.SCOUT_SOURCE_COMMIT ?? process.env.GITHUB_SHA });
  await mkdir(output,{recursive:true});
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({state:report.state,queries:report.queries.map(q=>q.state),candidates:report.candidates.length,new:report.candidates.filter(c=>c.newlySeen).length}));
}
