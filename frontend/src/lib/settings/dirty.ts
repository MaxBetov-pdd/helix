import { writable, get } from 'svelte/store';
import { SETTINGS_MANIFEST } from './manifest';

export const dirtyFields = writable<Set<string>>(new Set());
export const originalValues = writable<Record<string, unknown>>({});
// pendingValues holds the latest in-flight edits keyed by entry id.
// Sections derive their display `currentValues` from originals + pending.
export const pendingValues = writable<Record<string, unknown>>({});

function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') return JSON.stringify(a) === JSON.stringify(b);
  return false;
}

export function markField(id: string, value: unknown): void {
  const original = get(originalValues)[id];
  dirtyFields.update((set) => {
    const next = new Set(set);
    if (equal(value, original)) next.delete(id);
    else next.add(id);
    return next;
  });
  pendingValues.update((p) => ({ ...p, [id]: value }));
}

export function revertField(id: string): void {
  dirtyFields.update((set) => {
    const next = new Set(set);
    next.delete(id);
    return next;
  });
  pendingValues.update((p) => {
    if (!(id in p)) return p;
    const next = { ...p };
    delete next[id];
    return next;
  });
}

export function clearDirty(): void {
  dirtyFields.set(new Set());
  pendingValues.set({});
}

function setByDotPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cursor[key];
    if (!next || typeof next !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

// Number-type fields mark `null` while the operator clears/retypes them (the
// input transiently reads ''). Persisting that null poisons backend configs
// (e.g. a null gauntlet.min_trades crashes every promotion-gate evaluation),
// so the save bar refuses to submit while any dirty numeric field is empty.
export function listEmptyNumericDirtyFields(
  currentValues: Record<string, unknown>,
): Array<{ id: string; label: string }> {
  const dirty = get(dirtyFields);
  const manifestById = new Map(SETTINGS_MANIFEST.map((e) => [e.id, e]));
  const empty: Array<{ id: string; label: string }> = [];
  for (const id of dirty) {
    const entry = manifestById.get(id);
    if (!entry || entry.type !== 'number') continue;
    const value = currentValues[id];
    if (value === null || value === undefined || typeof value !== 'number' || Number.isNaN(value)) {
      empty.push({ id, label: entry.label });
    }
  }
  return empty;
}

export function groupDirtyByBackendSection(
  currentValues: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const grouped: Record<string, Record<string, unknown>> = {};
  const dirty = get(dirtyFields);
  const manifestById = new Map(SETTINGS_MANIFEST.map((e) => [e.id, e]));
  for (const id of dirty) {
    const entry = manifestById.get(id);
    if (!entry) continue;
    const section = entry.backendSection;
    if (!grouped[section]) grouped[section] = {};
    setByDotPath(grouped[section], entry.backendPath, currentValues[id]);
  }
  return grouped;
}
