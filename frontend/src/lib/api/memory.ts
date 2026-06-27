import { fetchApi } from './core';

export type MemorySource = 'workspace' | 'chroma' | 'narratives';
export type MemoryView = 'explore' | 'skills' | 'pipeline' | 'canon' | 'timeline';

export interface MemoryItem {
	source: MemorySource;
	source_kind: string;
	source_id: string;
	title: string;
	excerpt: string;
	content_preview: string;
	created_at?: string | null;
	updated_at?: string | null;
	score?: number;
	agent_id?: string | null;
	strategy_id?: string | null;
	collection?: string | null;
	tags: string[];
	tier?: string | null;
	pinned?: boolean;
	hidden?: boolean;
	note?: string | null;
	annotation_updated_at?: string | null;
	provenance?: Record<string, unknown>;
	actions?: string[];
}

export interface MemorySourceHealth {
	source: MemorySource;
	configured: boolean;
	healthy: boolean;
	status: string;
	summary: string;
	count?: number;
	latest_updated_at?: string | null;
	collections?: Array<{
		name: string;
		label?: string;
		count?: number;
		exists?: boolean;
	}>;
	config_source?: string;
}

export interface MemoryTimelineEntry {
	kind: 'event' | 'source' | string;
	timestamp?: string | null;
	action: string;
	actor?: string | null;
	source?: MemorySource;
	source_id?: string;
	summary?: string;
	item?: MemoryItem | null;
}

export interface MemoryMetrics {
	visible_count: number;
	hidden_count: number;
	canon_count: number;
	annotated_count: number;
	source_counts: Record<string, number>;
}

export interface MemoryOverviewResponse {
	metrics: MemoryMetrics;
	source_health: MemorySourceHealth[];
	canon_items: MemoryItem[];
	timeline: MemoryTimelineEntry[];
	curation_candidates: MemoryItem[];
	recent_items: MemoryItem[];
}

export interface MemoryTimeRange {
	preset?: string | null;
	from_ts?: string | null;
	to_ts?: string | null;
}

export interface MemorySearchRequest {
	query?: string;
	sources?: MemorySource[];
	collections?: string[];
	tags?: string[];
	agent_id?: string;
	strategy_id?: string;
	time_range?: MemoryTimeRange | null;
	include_hidden?: boolean;
	limit?: number;
	page?: number;
	cursor?: string | null;
}

export interface MemorySearchResponse extends MemoryOverviewResponse {
	query: string;
	page: number;
	limit: number;
	total: number;
	next_cursor?: string | null;
	results: MemoryItem[];
	available_collections: Array<{
		name: string;
		label?: string;
		count?: number;
	}>;
}

export interface MemoryItemDetailResponse {
	item: MemoryItem;
	annotation?: {
		source?: string;
		source_id?: string;
		source_kind?: string | null;
		title_override?: string | null;
		tags?: string[];
		note?: string | null;
		tier?: string | null;
		pinned?: boolean;
		hidden?: boolean;
		updated_at?: string | null;
	} | null;
	events: Array<{
		id: number;
		source: MemorySource;
		source_id: string;
		action: string;
		actor?: string | null;
		created_at?: string | null;
		payload?: Record<string, unknown>;
	}>;
	related_items: MemoryItem[];
}

export interface MemoryAnnotationUpdate {
	source_kind?: string | null;
	title_override?: string | null;
	tags?: string[] | null;
	note?: string | null;
	tier?: string | null;
	pinned?: boolean | null;
	hidden?: boolean | null;
	actor?: string;
	item_snapshot?: unknown | null;
}

export interface MemoryActionRequest {
	action: 'hide' | 'unhide';
	actor?: string;
	item_snapshot?: unknown | null;
}

export interface MemoryActionResponse {
	ok: boolean;
	action: string;
	result?: Record<string, unknown>;
	item?: MemoryItem;
	events?: MemoryItemDetailResponse['events'];
}

export interface MemoryMaintenanceCandidate {
	source: MemorySource;
	source_id: string;
	title: string;
	agent_id?: string | null;
	updated_at?: string | null;
	tags: string[];
	reason: string;
	action: string;
}

export interface MemoryMaintenanceRequest {
	dry_run?: boolean;
	compact_daily_logs?: boolean;
	hide_old_daily_logs?: boolean;
	archive_narratives?: boolean;
	older_than_days?: number;
	limit?: number;
}

export interface MemoryMaintenancePreview {
	dry_run: boolean;
	older_than_days: number;
	cutoff: string;
	summary: {
		daily_log_files_to_compact: number;
		daily_file_items_to_hide: number;
		daily_signal_sections_seen: number;
		protected_daily_items: number;
		estimated_visible_reduction: number;
		archive_narratives: boolean;
	};
	agent_counts: Record<string, number>;
	candidates: {
		daily_file_items: MemoryMaintenanceCandidate[];
		daily_signal_sections: MemoryMaintenanceCandidate[];
	};
	truncated: {
		daily_file_items: number;
		daily_signal_sections: number;
	};
	applied?: {
		summaries_written: number;
		summaries_changed: number;
		daily_file_items_hidden: number;
		skipped: number;
	};
	written_summaries?: Array<{
		source_id: string;
		summary_relative_path: string;
		changed: boolean;
	}>;
	hidden_items?: Array<{
		source_id: string;
		summary_relative_path: string;
	}>;
	skipped?: Array<{
		source_id: string;
		reason: string;
	}>;
	next_actions: string[];
}

// ── Quant Skills Types ──────────────────────────────────────────────────────

export interface QuantSkill {
	name: string;
	description: string;
	skill_type: 'regime' | 'failure' | 'indicator' | 'combo' | 'params';
	confidence: number;
	sample_size: number;
	regime: string;
	last_validated: string;
	what_works: string[];
	what_doesnt_work: string[];
	evidence: Record<string, unknown>[];
	metadata: Record<string, string>;
}

export interface SkillCandidateHypothesis {
	id: string;
	pattern: string;
	observation: string;
	backtest_ids: string[];
	created_at: string;
	count: number;
}

export interface QuantSkillsStats {
	total_skills: number;
	total_hypotheses: number;
	total_archived: number;
	avg_confidence: number;
	total_evidence: number;
}

// ── Memory API ──────────────────────────────────────────────────────────────

export async function getMemoryOverview(limit = 24): Promise<MemoryOverviewResponse> {
	return fetchApi(`/memory/overview?limit=${limit}`);
}

export async function searchMemory(body: MemorySearchRequest): Promise<MemorySearchResponse> {
	return fetchApi('/memory/search', {
		method: 'POST',
		body: JSON.stringify(body),
	});
}

export async function getMemoryItem(source: MemorySource, sourceId: string): Promise<MemoryItemDetailResponse> {
	return fetchApi(`/memory/item/${encodeURIComponent(source)}/${encodeURIComponent(sourceId)}`);
}

export async function updateMemoryAnnotation(
	source: MemorySource,
	sourceId: string,
	body: MemoryAnnotationUpdate,
): Promise<MemoryItemDetailResponse> {
	return fetchApi(`/memory/item/${encodeURIComponent(source)}/${encodeURIComponent(sourceId)}/annotation`, {
		method: 'PUT',
		body: JSON.stringify(body),
	});
}

export async function applyMemoryAction(
	source: MemorySource,
	sourceId: string,
	body: MemoryActionRequest,
): Promise<MemoryActionResponse> {
	return fetchApi(`/memory/item/${encodeURIComponent(source)}/${encodeURIComponent(sourceId)}/action`, {
		method: 'POST',
		body: JSON.stringify(body),
	});
}

export async function getMemoryMaintenancePreview(params?: {
	older_than_days?: number;
	limit?: number;
}): Promise<MemoryMaintenancePreview> {
	const qs = new URLSearchParams();
	if (params?.older_than_days) qs.set('older_than_days', String(params.older_than_days));
	if (params?.limit) qs.set('limit', String(params.limit));
	const query = qs.toString();
	return fetchApi(`/memory/maintenance/preview${query ? '?' + query : ''}`);
}

export async function runMemoryMaintenance(body: MemoryMaintenanceRequest): Promise<MemoryMaintenancePreview> {
	return fetchApi('/memory/maintenance/run', {
		method: 'POST',
		body: JSON.stringify(body),
	});
}

// ── Quant Skills API ────────────────────────────────────────────────────────

export async function getQuantSkills(params?: {
	regime?: string;
	skill_type?: string;
	limit?: number;
	min_confidence?: number;
}): Promise<{ skills: QuantSkill[]; meta: Record<string, unknown> }> {
	const qs = new URLSearchParams();
	if (params?.regime) qs.set('regime', params.regime);
	if (params?.skill_type) qs.set('skill_type', params.skill_type);
	if (params?.limit) qs.set('limit', String(params.limit));
	if (params?.min_confidence !== undefined) qs.set('min_confidence', String(params.min_confidence));
	const query = qs.toString();
	return fetchApi(`/quant-skills${query ? '?' + query : ''}`);
}

export async function getQuantSkillDetail(name: string): Promise<QuantSkill> {
	return fetchApi(`/quant-skills/${encodeURIComponent(name)}`);
}

export async function getSkillCandidateHypotheses(): Promise<{ hypotheses: SkillCandidateHypothesis[] }> {
	return fetchApi('/quant-skills/hypotheses');
}

export async function promoteSkillCandidateHypothesis(id: string): Promise<{ promoted: boolean; skill_name: string }> {
	return fetchApi(`/quant-skills/hypotheses/${encodeURIComponent(id)}/promote`, { method: 'POST' });
}

export async function dismissSkillCandidateHypothesis(id: string): Promise<{ dismissed: boolean }> {
	return fetchApi(`/quant-skills/hypotheses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function runConsolidation(): Promise<{ status: string; report: Record<string, number> }> {
	return fetchApi('/quant-skills/consolidation', { method: 'POST' });
}

export async function getQuantSkillsStats(): Promise<QuantSkillsStats> {
	return fetchApi('/quant-skills/stats');
}

export async function archiveSkill(name: string): Promise<{ archived: boolean }> {
	return fetchApi(`/quant-skills/${encodeURIComponent(name)}`, { method: 'DELETE' });
}
