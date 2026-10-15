export interface WorkspaceEvent { seq: number; entityId: string; kind: string; workItemId?: string; projectId?: string }
export function affectsSelection(event: WorkspaceEvent, selection: { projectId: string; itemId: string }) {
  if (/^projects\./.test(event.kind)) return true;
  if (/^workItems\./.test(event.kind)) return !event.projectId || event.projectId === selection.projectId;
  if (!event.workItemId && !event.projectId) return true;
  if (event.workItemId) return event.workItemId === selection.itemId;
  return event.projectId === selection.projectId;
}
export function parseWorkspaceEvent(text: string): WorkspaceEvent | undefined {
  try { const value = JSON.parse(text); return Number.isSafeInteger(value.seq) && value.seq > 0 && typeof value.entityId === 'string' && typeof value.kind === 'string' ? value : undefined; } catch { return undefined; }
}
