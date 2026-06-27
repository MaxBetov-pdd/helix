/**
 * Structured page context for the in-app assistant.
 *
 * Replaces the old "context = URL pathname" string. The layout publishes the
 * route + an inferred page kind on every navigation (which also CLEARS any
 * stale entity/summary from the previous page), and individual pages enrich it
 * via `setPageContext` with the entity in view and a small snapshot of what's
 * on screen. The assistant sends this with every message so it actually knows
 * what the operator is looking at and trying to do.
 */
import { writable } from 'svelte/store';

export interface PageEntity {
	type: string; // 'strategy' | 'hypothesis' | 'paper_session' | ...
	id: string;
	label?: string;
}

export interface PageContext {
	route: string;
	page_kind: string;
	entity?: PageEntity;
	summary?: string; // short human description of what's on screen
	data?: Record<string, unknown>; // small structured snapshot (kept compact)
}

export const pageContext = writable<PageContext>({ route: '/', page_kind: 'dashboard' });

/** Infer a coarse page kind from the pathname so the assistant can tailor help. */
export function inferPageKind(pathname: string): string {
	const p = (pathname || '/').toLowerCase();
	if (/^\/lab\/strategy\/[^/]+/.test(p)) return 'strategy_detail';
	if (p === '/lab' || p.startsWith('/lab/')) return 'lab';
	if (p === '/' || p.startsWith('/dashboard')) return 'dashboard';
	if (p.startsWith('/paper') || p.startsWith('/trading')) return 'paper_trading';
	if (p.startsWith('/data')) return 'data_engine';
	if (p.startsWith('/pipeline')) return 'pipeline';
	if (p.startsWith('/risk')) return 'risk';
	if (p.startsWith('/agents')) return 'agents';
	if (p.startsWith('/crucible')) return 'crucible';
	if (p.startsWith('/hypoth')) return 'hypotheses';
	if (p.startsWith('/settings')) return 'settings';
	if (p.startsWith('/tasks')) return 'tasks';
	const seg = p.split('/').filter(Boolean)[0];
	return seg || 'dashboard';
}

/** Called by the layout on every navigation. Resets entity/summary/data.
 *
 * For routes that carry their entity in the URL (today: strategy detail), the
 * entity is parsed automatically so those pages are assistant-aware with zero
 * per-page wiring. The backend fills in the human label from the id.
 */
export function setRoute(pathname: string): void {
	const next: PageContext = { route: pathname, page_kind: inferPageKind(pathname) };
	const m = (pathname || '').match(/^\/lab\/strategy\/([^/?#]+)/);
	if (m && m[1]) {
		next.entity = { type: 'strategy', id: decodeURIComponent(m[1]) };
	}
	pageContext.set(next);
}

/** Merge page-specific signal (entity, summary, data) into the current context. */
export function setPageContext(patch: Partial<PageContext>): void {
	pageContext.update((c) => ({ ...c, ...patch }));
}

/** Clear page-specific signal (e.g. when a detail view unmounts). */
export function clearPageEntity(): void {
	pageContext.update((c) => ({ route: c.route, page_kind: c.page_kind }));
}
