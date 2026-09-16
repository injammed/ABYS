export const scoutOrigin = 'https://raw.githubusercontent.com/injammed/ABYS/library-discoveries';
export const scoutQueries = ['topic:ai-generated stars:>=3 archived:false fork:false', 'topic:generative-art stars:>=3 archived:false fork:false'];
export type Candidate = { id: number; repository: string; stars: number; license: string | null; signals: string[]; newlySeen: boolean };
export type ScoutReport = { version: 1; id: string; checkedAt: string; sourceCommit: string; state: 'completed' | 'partial' | 'failed'; queries: { query: string; state: 'completed' | 'failed'; returned: number }[]; candidates: Candidate[]; seenIds: number[] };
const exact = (v: unknown, keys: string[]): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).sort().join(',') === [...keys].sort().join(',');
const integer = (n: unknown): n is number => Number.isSafeInteger(n) && Number(n) >= 0;
export function parseScoutReport(value: unknown): ScoutReport {
  if (!exact(value, ['version','id','checkedAt','sourceCommit','state','queries','candidates','seenIds'])) throw Error('Invalid report');
  const v = value as unknown as ScoutReport;
  if (typeof v.id !== 'string' || typeof v.sourceCommit !== 'string' || typeof v.checkedAt !== 'string' || v.version !== 1 || !/^\d+-[1-9]\d*$/.test(v.id) || !/^[a-f0-9]{40}$/.test(v.sourceCommit) || !Number.isFinite(Date.parse(v.checkedAt)) || !['completed','partial','failed'].includes(v.state)) throw Error('Invalid identity');
  if (!Array.isArray(v.queries) || v.queries.length !== 2 || v.queries.some((q,i) => !exact(q,['query','state','returned']) || q.query !== scoutQueries[i] || !['completed','failed'].includes(q.state) || !integer(q.returned) || q.returned > 10 || (q.state === 'failed' && q.returned !== 0))) throw Error('Invalid search scope');
  const successes = v.queries.filter(q => q.state === 'completed').length;
  if (v.state !== (successes === 2 ? 'completed' : successes === 1 ? 'partial' : 'failed')) throw Error('Invalid outcome');
  if (!Array.isArray(v.seenIds) || v.seenIds.length > 10000 || v.seenIds.some(id => !integer(id) || id === 0) || new Set(v.seenIds).size !== v.seenIds.length) throw Error('Invalid deduplication history');
  if (!Array.isArray(v.candidates) || v.candidates.length > 20 || v.candidates.length > v.queries.reduce((n,q)=>n+q.returned,0)) throw Error('Invalid candidates');
  const ids = new Set<number>();
  for (const c of v.candidates) {
    if (!exact(c,['id','repository','stars','license','signals','newlySeen']) || !integer(c.id) || c.id === 0 || ids.has(c.id) || !v.seenIds.includes(c.id) || !/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(c.repository) || !integer(c.stars) || typeof c.newlySeen !== 'boolean' || (c.license !== null && (typeof c.license !== 'string' || !/^[A-Za-z0-9.+-]{1,80}$/.test(c.license))) || !Array.isArray(c.signals) || !c.signals.length || new Set(c.signals).size !== c.signals.length || c.signals.some(s => !['ai-generated','generative-art'].includes(s))) throw Error('Invalid candidate');
    ids.add(c.id);
  }
  return v;
}
