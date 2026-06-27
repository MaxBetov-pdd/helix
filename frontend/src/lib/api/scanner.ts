import {
	ApiError,
	fetchApi,
} from './core';

// ============================================================================
// Scanner
// ============================================================================

export interface ScanConfig {
	name?: string;
	symbols: string[];
	timeframes: string[];
	indicators: string[];
	indicator_groups?: string[];
	max_rules_per_side?: number;
	threshold_ranges?: Record<string, number[]>;
	period_ranges?: Record<string, number[]>;
	initial_capital?: number;
	fee_bps?: number;
	slippage_bps?: number;
	prune_max_dd?: number;
	min_trades?: number;
	min_sharpe?: number;
	min_profit_factor?: number;
	max_combinations?: number;
	dedup_correlation?: number;
	batch_size?: number;
	conditions?: string[];
}

export interface Scan {
	id: string;
	name: string;
	status: string;
	config_json: ScanConfig;
	progress_json: ScanProgress;
	total_combinations: number;
	completed_count: number;
	created_at: string;
	updated_at: string;
	completed_at: string | null;
	error: string | null;
}

export interface ScanProgress {
	total_combinations: number;
	completed_count: number;
	pruned_count: number;
	error_count: number;
	best_sharpe: number;
	best_strategy_name: string;
	current_symbol: string;
	current_timeframe: string;
	elapsed_seconds: number;
	avg_backtest_ms: number;
	pct_complete: number;
}

export async function listScans(limit = 200): Promise<Scan[]> {
	const p = new URLSearchParams();
	if (limit > 0) p.set('limit', String(limit));
	const query = p.toString();
	return fetchApi(`/scanner/scans${query ? `?${query}` : ''}`);
}

export async function getScan(scanId: string): Promise<Scan> {
	return fetchApi(`/scanner/scans/${scanId}`);
}

// ============================================================================
// Tournaments
// ============================================================================

export interface Tournament {
	id: string;
	name: string;
	scan_id: string | null;
	status: string;
	config_json: Record<string, unknown>;
	created_at: string;
	completed_at: string | null;
}

export async function listTournaments(limit = 200): Promise<Tournament[]> {
	const p = new URLSearchParams();
	if (limit > 0) p.set('limit', String(limit));
	const query = p.toString();
	try {
		return await fetchApi(`/tournaments${query ? `?${query}` : ''}`);
	} catch (error) {
		// Tournament routes are optional on some installs.
		if (error instanceof ApiError && error.status === 404) {
			return [];
		}
		throw error;
	}
}

export async function getTournament(id: string): Promise<Tournament> {
	return fetchApi(`/tournaments/${id}`);
}

// ============================================================================
// Indicator Groups
// ============================================================================

export interface IndicatorGroupEntry {
	name: string;
	archetype: string;
	category: string;
	outputs: string[];
	description: string;
	source: string;
}

export type IndicatorGroups = Record<string, IndicatorGroupEntry[]>;

export async function getIndicatorGroups(): Promise<IndicatorGroups> {
	return fetchApi('/scanner/indicator-groups');
}
