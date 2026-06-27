import { goto } from '$app/navigation';
import {
	createLifecycleStrategy,
	listLifecycleStrategies,
	type LifecycleCreateRequest,
} from '$lib/api';

export interface StrategyDetailTarget {
	name: string;
	source: 'manual' | 'scan' | 'autopilot' | 'code' | 'campaign';
	sourceRef?: string;
	symbol?: string;
	timeframe?: string;
	definition?: Record<string, unknown> | string | null;
	returnTo?: string;
}

function normalizeSource(
	source: StrategyDetailTarget['source']
): LifecycleCreateRequest['source'] {
	if (source === 'scan' || source === 'campaign') return 'scan';
	if (source === 'autopilot') return 'autopilot';
	return 'manual';
}

function normalizeName(name: string): string {
	return name.replace(/\[Scan:[^\]]+\]\s*/, '').trim();
}

function pickExistingMatch(
	items: Array<{ id: string; name: string; symbol: string | null; timeframe: string | null; source_ref: string | null }>,
	target: StrategyDetailTarget
): string | null {
	const normalizedName = normalizeName(target.name);
	const sourceRef = target.sourceRef ?? null;
	const symbol = target.symbol ?? null;
	const timeframe = target.timeframe ?? null;

	for (const item of items) {
		if (normalizeName(item.name) !== normalizedName) continue;
		if (sourceRef && item.source_ref !== sourceRef) continue;
		if (symbol && item.symbol !== symbol) continue;
		if (timeframe && item.timeframe !== timeframe) continue;
		return item.id;
	}
	return null;
}

export async function findOrCreateLifecycleStrategyId(
	target: StrategyDetailTarget
): Promise<string | null> {
	const source = normalizeSource(target.source);
	const rawName = target.name.trim();
	const name = source === 'scan' ? rawName : normalizeName(rawName);
	const nameFilter = source === 'scan' ? undefined : name;
	const sourceRef = target.sourceRef;
	const symbol = target.symbol;
	const timeframe = target.timeframe;

	try {
		const existing = await listLifecycleStrategies({
			source,
			name: nameFilter,
			source_ref: sourceRef,
			symbol,
			limit: 25,
			offset: 0,
		});
		const matchId = pickExistingMatch(existing, target);
		if (matchId) return matchId;
	} catch {
		// Best-effort lookup; create below.
	}

	try {
		const created = await createLifecycleStrategy({
			name,
			source,
			source_ref: sourceRef,
			symbol,
			timeframe,
			definition_json: target.definition ?? undefined,
		});
		return created.id;
	} catch {
		return null;
	}
}

export async function openStrategyDetail(
	target: StrategyDetailTarget,
	fallback?: () => void
): Promise<boolean> {
	const strategyId = await findOrCreateLifecycleStrategyId(target);
	if (!strategyId) {
		fallback?.();
		return false;
	}
	const qs = target.returnTo
		? `?returnTo=${encodeURIComponent(target.returnTo)}`
		: '';
	await goto(`/lab/strategy/${strategyId}${qs}`);
	return true;
}
