import type { Snapshot, Tab, DocumentView } from './context.tsx';

export interface ViewLocation {
  project: string; item: string; view: Tab; node: string; artifact: string;
  revision: string; attempt: string; mode: 'follow' | 'pinned'; documentView: DocumentView;
}
export const emptyLocation: ViewLocation = { project: '', item: '', view: 'flow', node: '', artifact: '', revision: '', attempt: '', mode: 'follow', documentView: 'reading' };
const tabs: Tab[] = ['flow', 'requirements', 'artifacts', 'code', 'runs'];
export function readLocation(search: string): ViewLocation {
  const params = new URLSearchParams(search);
  const view = params.get('view') as Tab;
  const reading = params.get('documentView') as DocumentView;
  return { project: params.get('project') || '', item: params.get('item') || '', view: tabs.includes(view) ? view : 'flow', node: params.get('node') || '', artifact: params.get('artifact') || '', revision: params.get('revision') || '', attempt: params.get('attempt') || '', mode: params.get('mode') === 'pinned' ? 'pinned' : 'follow', documentView: ['reading', 'execution', 'compare'].includes(reading) ? reading : 'reading' };
}
export function locationSearch(location: ViewLocation): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(emptyLocation) as (keyof ViewLocation)[]) if (location[key]) params.set(key, location[key]);
  return `?${params}`;
}
export function validateLocation(location: ViewLocation, snapshot: Snapshot): { location: ViewLocation; invalid: boolean } {
  const next = { ...location, project: snapshot.project.id, item: snapshot.item.id };
  let invalid = false;
  const check = (key: 'node' | 'artifact' | 'revision' | 'attempt', valid: boolean) => { if (next[key] && !valid) { next[key] = ''; invalid = true; } };
  check('node', snapshot.nodes.some(n => n.id === next.node));
  check('artifact', snapshot.artifacts.some(a => a.id === next.artifact));
  const selectedRevision = snapshot.revisions.find(revision => revision.id === next.revision);
  if (!next.artifact && selectedRevision) next.artifact = selectedRevision.artifactId;
  check('revision', snapshot.revisions.some(r => r.id === next.revision && (!next.artifact || r.artifactId === next.artifact)));
  check('attempt', snapshot.attempts.some(a => a.id === next.attempt));
  if (invalid && !next.node && !next.attempt && !next.artifact) next.mode = 'follow';
  return { location: next, invalid };
}
