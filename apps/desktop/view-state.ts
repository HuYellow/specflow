/** The desktop persists object locations only; documents and credentials never enter this shape. */
export interface DesktopViewLocation {
  project: string;
  item: string;
  view: 'flow' | 'requirements' | 'artifacts' | 'code' | 'runs';
  node: string;
  artifact: string;
  revision: string;
  attempt: string;
  mode: 'follow' | 'pinned';
  documentView: 'reading' | 'execution' | 'compare';
}
export interface DesktopViewState {
  schemaVersion: 1;
  last: DesktopViewLocation | null;
  items: DesktopViewLocation[];
}
export const maximumStoredViews = 100;
const fields = ['project', 'item', 'view', 'node', 'artifact', 'revision', 'attempt', 'mode', 'documentView'] as const;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export const validViewItemId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);

export function parseDesktopView(value: unknown): DesktopViewLocation | null {
  if (!object(value) || !validViewItemId(value.project) || !validViewItemId(value.item)) return null;
  for (const name of ['node', 'artifact', 'revision', 'attempt']) if (typeof value[name] !== 'string' || (value[name] !== '' && !validViewItemId(value[name]))) return null;
  if (typeof value.view !== 'string' || !['flow', 'requirements', 'artifacts', 'code', 'runs'].includes(value.view)) return null;
  if (typeof value.mode !== 'string' || !['follow', 'pinned'].includes(value.mode)) return null;
  if (typeof value.documentView !== 'string' || !['reading', 'execution', 'compare'].includes(value.documentView)) return null;
  return Object.fromEntries(fields.map(name => [name, value[name]])) as unknown as DesktopViewLocation;
}

export function emptyDesktopViewState(): DesktopViewState { return { schemaVersion: 1, last: null, items: [] }; }
export function parseDesktopViewState(value: unknown): DesktopViewState {
  if (!object(value) || value.schemaVersion !== 1 || !Array.isArray(value.items)) return emptyDesktopViewState();
  const items: DesktopViewLocation[] = [];
  for (const entry of value.items.slice(-maximumStoredViews)) {
    const view = parseDesktopView(entry);
    if (!view) continue;
    const duplicate = items.findIndex(item => item.item === view.item);
    if (duplicate !== -1) items.splice(duplicate, 1);
    items.push(view);
  }
  const last = parseDesktopView(value.last);
  if (last) {
    const duplicate = items.findIndex(item => item.item === last.item);
    if (duplicate !== -1) items.splice(duplicate, 1);
    items.push(last);
  }
  return { schemaVersion: 1, last, items: items.slice(-maximumStoredViews) };
}

export function updateDesktopViewState(previous: unknown, value: unknown): DesktopViewState {
  const view = parseDesktopView(value);
  if (!view) throw new Error('视图定位字段不符合契约');
  const state = parseDesktopViewState(previous);
  return { schemaVersion: 1, last: view, items: [...state.items.filter(item => item.item !== view.item), view].slice(-maximumStoredViews) };
}
export function desktopViewSearch(value: unknown): string {
  const view = parseDesktopView(value);
  if (!view) return '';
  const params = new URLSearchParams();
  for (const field of fields) if (view[field]) params.set(field, view[field]);
  return `?${params.toString()}`;
}
