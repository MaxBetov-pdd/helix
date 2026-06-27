import { fetchApi, LONG_TIMEOUT_MS } from './core';

const LAB_MODEL_REBUILD_TIMEOUT_MS = 300_000;
const LAB_SEGMENT_BUILD_TIMEOUT_MS = 180_000;

export type LabStrategySource =
	| 'registry'
	| 'active'
	| 'paper'
	| 'backtesting'
	| 'graveyard'
	| 'all_managed';

export interface LabRegimeModelVersion {
	id: string;
	version_key: string;
	program_id?: string | null;
	experiment_id?: string | null;
	status?: string;
	config_json?: Record<string, unknown>;
	notes?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface LabRegimeProgram {
	id: string;
	program_key: string;
	symbol: string;
	regime_timeframe: string;
	execution_timeframe: string;
	status: string;
	active_experiment_id?: string | null;
	active_model_version_id?: string | null;
	current_cycle_id?: string | null;
	config_json?: Record<string, unknown>;
	notes?: string | null;
	created_at: string;
	updated_at: string;
}

export interface LabDiscoveryCycle {
	id: string;
	program_id: string;
	model_version_id?: string | null;
	status: string;
	reason?: string | null;
	strategy_sources?: string[];
	candidate_batch?: string[];
	summary_json?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	completed_at?: string | null;
}

export interface LabRegimeProgramResponse {
	status: string;
	program: LabRegimeProgram | null;
	active_model?: LabRegimeModelVersion | null;
	last_cycle?: LabDiscoveryCycle | null;
	cycle_stats?: Record<string, unknown>;
}

export interface LabRegimeProgramListResponse {
	status: string;
	programs: LabRegimeProgram[];
	total: number;
}

export interface LabRegimeTimelineSegment {
	id: string;
	model_version_id: string;
	symbol: string;
	timeframe: string;
	regime: string;
	core_regime?: string | null;
	display_regime?: string;
	stored_regime?: string;
	raw_regime?: string | null;
	legacy_regime?: string | null;
	segment_start: string;
	segment_end: string;
	confidence_avg: number;
	bars_count: number;
	uncertain?: boolean;
	overlay_regime?: string | null;
	uncertain_share?: number;
	meta_json?: Record<string, unknown>;
}

export interface LabRegimeTimelineLabel {
	id: string;
	model_version_id: string;
	symbol: string;
	timeframe: string;
	ts: string;
	regime: string;
	core_regime?: string | null;
	display_regime?: string;
	stored_regime?: string;
	raw_regime?: string | null;
	legacy_regime?: string | null;
	confidence: number;
	uncertain?: boolean;
	overlay_regime?: string | null;
	meta_json?: Record<string, unknown>;
}

export interface LabRegimeTimelinePricePoint {
	ts: string;
	close: number;
	normalized_close: number;
	return_pct: number;
}

export interface LabRegimeTimelineSummary {
	segment_count: number;
	label_count: number;
	bars_classified: number;
	uncertain_share: number;
	raw_uncertain_share: number;
	segment_median_bars: number;
	classifier_type?: string | null;
	current_regime?: string | null;
	current_core_regime?: string | null;
	current_uncertain?: boolean;
}

export interface LabRegimeStrategyMeta {
	strategy_id?: string;
	candidate_key?: string;
	trade_mode?: 'long_only' | 'short_only' | 'both';
	position_model?: 'single_side' | 'hedged';
	source_pool?: string;
	source_stage?: string | null;
	strategy_name?: string | null;
}

export interface LabRegimeHeatmapCell {
	regime: string;
	core_regime?: string | null;
	stored_regime?: string;
	legacy_regime?: string | null;
	strategy_id: string;
	score: number;
	pre_cost_score: number | null;
	post_cost_score: number | null;
	oos_post_cost_score?: number | null;
	profit_factor: number | null;
	sharpe: number | null;
	oos_profit_factor?: number | null;
	state?: 'admitted' | 'scored' | 'rejected' | 'error' | 'insufficient_data' | string;
	primary_reason?: string | null;
	admission?: Record<string, unknown>;
	diagnostics?: Record<string, unknown>;
	strategy_meta?: LabRegimeStrategyMeta;
}

export interface LabRegimeHeatmapSummary {
	total_cells: number;
	admitted_cells: number;
	scored_cells: number;
	rejected_cells: number;
	error_cells: number;
	insufficient_cells: number;
	legacy_cells?: number;
	uncertain_share?: number;
	raw_uncertain_share?: number;
	bars_classified?: number;
	segment_count?: number;
	classifier_type?: string | null;
}

export interface LabRegimeContainerMember {
	strategy_id: string;
	rank: number;
	score: number;
	metrics_json?: Record<string, unknown> & { strategy_meta?: LabRegimeStrategyMeta };
	admitted?: boolean;
}

export interface LabRegimeContainerSnapshot {
	container_id: string;
	model_version_id: string;
	regime: string;
	score_version: string;
	status: string;
	updated_at: string;
	meta_json?: Record<string, unknown>;
	members: LabRegimeContainerMember[];
	champion:
		| {
				strategy_id: string;
				score: number;
				rationale_json?: Record<string, unknown> & LabRegimeStrategyMeta;
		  }
		| null;
	reserves?: Array<Record<string, unknown>>;
	selection_evidence?: Record<string, unknown>;
}

export interface SelectorDecision {
	status: string;
	model_version_id?: string | null;
	symbol: string;
	timeframe: string;
	regime_timeframe?: string;
	execution_timeframe?: string;
	decision: string;
	regime: string;
	confidence: number;
	champion_strategy_id?: string | null;
	blocked_reason?: string | null;
	selection_event_id?: string | null;
	meta_json?: Record<string, unknown>;
}

export interface DispatchPaperIntentResult {
	status: string;
	action: string;
	intent_id?: string | null;
	selection_event_id?: string | null;
	trade_id?: string | null;
	execution_status: string;
	reason?: string | null;
	fill_price?: number | null;
	slippage_bps?: number | null;
	feedback_id?: string | null;
	payload?: Record<string, unknown>;
}

export interface CreateLabExperimentResult {
	status: string;
	experiment_id: string;
	job_id: string;
	job_state: string;
	queued_at: string;
	regime_timeframe: string;
	execution_timeframe: string;
}

export interface ModelRebuildResult {
	status: string;
	experiment_id: string;
	model_version_id: string;
	labels_persisted: number;
	snapshot_path: string;
	snapshot_hash: string;
}

export interface ModelRebuildEnqueueResult {
	status: string;
	experiment_id: string;
	job_id: string;
	job_state: 'queued' | 'running' | 'succeeded' | 'failed' | 'deadletter';
	queued_at: string;
}

export interface SegmentBuildResult {
	status: string;
	model_version_id: string;
	segments_persisted: number;
}

export interface SegmentBuildEnqueueResult {
	status: string;
	model_version_id: string;
	job_id: string;
	job_state: 'queued' | 'running' | 'succeeded' | 'failed' | 'deadletter';
	queued_at: string;
}

export interface BacktestMatrixEnqueueResult {
	status: string;
	model_version_id: string;
	job_id: string;
	job_state: 'queued' | 'running' | 'succeeded' | 'failed' | 'deadletter';
	queued_at: string;
}

export interface LabRegimeJob {
	id: string;
	program_id?: string | null;
	experiment_id?: string | null;
	job_type: string;
	state: 'queued' | 'running' | 'succeeded' | 'failed' | 'deadletter';
	payload_json?: Record<string, unknown>;
	progress_json?: Record<string, unknown>;
	attempts?: number;
	max_attempts?: number;
	error_json?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	started_at?: string | null;
	completed_at?: string | null;
}

export interface LabRegimeJobDetail {
	status: string;
	job: LabRegimeJob;
	events: Array<Record<string, unknown>>;
}

export interface LabWorkerStatusResponse {
	status: string;
	active: boolean;
	worker: Record<string, unknown>;
	running_jobs: Array<Record<string, unknown>>;
}

export interface LabWorkerFeedResponse {
	status: string;
	path: string;
	exists: boolean;
	lines: string[];
	line_count: number;
	truncated: boolean;
	updated_at: number | null;
}

export interface StartLabWorkerResult {
	status: string;
	worker_status?: string;
	pid?: number;
	log_path?: string;
	worker?: Record<string, unknown>;
}

export interface ContinuousOrchestratorStatusResult {
	status: string;
	config: Record<string, unknown>;
	orchestrator: Record<string, unknown>;
	active_jobs: Array<Record<string, unknown>>;
	program?: LabRegimeProgram | null;
	last_cycle?: LabDiscoveryCycle | null;
	cycle_stats?: Record<string, unknown>;
}

export interface ContinuousCycleEnqueueResult {
	status: string;
	job_id: string;
	job_state: 'queued' | 'running' | 'succeeded' | 'failed' | 'deadletter';
	queued_at: string;
	cycle_id: string;
}

export interface StrategyPoolReportResult {
	status: string;
	requested_sources: string[];
	included: Array<Record<string, unknown>>;
	skipped: Array<Record<string, unknown>>;
	counts: Record<string, unknown>;
}

export async function getLabRegimeModels(limit = 50): Promise<LabRegimeModelVersion[]> {
	const response = await fetchApi<{ status: string; models: LabRegimeModelVersion[] }>(
		`/lab/regime/models?limit=${encodeURIComponent(String(limit))}`
	);
	return Array.isArray(response.models) ? response.models : [];
}

export async function getLabRegimePrograms(limit = 50): Promise<LabRegimeProgramListResponse> {
	return fetchApi(`/lab/regime/programs?limit=${encodeURIComponent(String(limit))}`);
}

export async function getLabActiveRegimeProgram(): Promise<LabRegimeProgramResponse> {
	return fetchApi('/lab/regime/programs/active');
}

export async function postLabUpsertRegimeProgram(payload: {
	program_id?: string;
	symbol?: string;
	regime_timeframe?: string;
	execution_timeframe?: string;
	notes?: string;
}): Promise<LabRegimeProgramResponse> {
	return fetchApi('/lab/regime/programs', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function postLabInitializeRegimeProgram(payload: {
	program_id?: string;
	symbol?: string;
	regime_timeframe?: string;
	execution_timeframe?: string;
	train_start?: string;
	train_end?: string;
	test_start?: string;
	test_end?: string;
	notes?: string;
}): Promise<{
	status: string;
	program_id: string;
	experiment_id: string;
	rebuild_job_id: string;
	rebuild_job_state: 'queued' | 'running' | 'succeeded' | 'failed' | 'deadletter';
	queued_at: string;
}> {
	return fetchApi('/lab/regime/programs/initialize', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function postLabCreateExperiment(payload: {
	symbol?: string;
	timeframe?: string;
	regime_timeframe?: string;
	execution_timeframe?: string;
	train_start?: string;
	train_end?: string;
	test_start?: string;
	test_end?: string;
	notes?: string;
}): Promise<CreateLabExperimentResult> {
	return fetchApi('/lab/regime/experiments', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function postLabModelRebuild(payload: {
	experiment_id: string;
	version_key?: string;
	notes?: string;
}): Promise<ModelRebuildResult> {
	return fetchApi('/lab/regime/model/rebuild', {
		method: 'POST',
		body: JSON.stringify(payload),
		timeoutMs: Math.max(LONG_TIMEOUT_MS, LAB_MODEL_REBUILD_TIMEOUT_MS),
	});
}

export async function postLabModelRebuildEnqueue(payload: {
	experiment_id: string;
	version_key?: string;
	notes?: string;
}): Promise<ModelRebuildEnqueueResult> {
	return fetchApi('/lab/regime/model/rebuild/enqueue', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function postLabSegmentsBuild(payload: {
	model_version_id: string;
	min_segment_bars?: number;
}): Promise<SegmentBuildResult> {
	return fetchApi('/lab/regime/segments/build', {
		method: 'POST',
		body: JSON.stringify(payload),
		timeoutMs: Math.max(LONG_TIMEOUT_MS, LAB_SEGMENT_BUILD_TIMEOUT_MS),
	});
}

export async function postLabSegmentsBuildEnqueue(payload: {
	model_version_id: string;
	min_segment_bars?: number;
}): Promise<SegmentBuildEnqueueResult> {
	return fetchApi('/lab/regime/segments/build/enqueue', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function postLabBacktestsMatrix(payload: {
	program_id?: string;
	cycle_id?: string;
	model_version_id: string;
	strategy_ids?: string[];
	strategy_sources?: LabStrategySource[];
	max_strategies?: number;
	score_version?: string;
	notes?: string;
}): Promise<BacktestMatrixEnqueueResult> {
	return fetchApi('/lab/regime/backtests/matrix', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function getLabRegimeTimeline(modelVersionId: string): Promise<{
	model_version_id: string;
	taxonomy?: string[];
	timeframes?: Record<string, unknown>;
	validation?: Record<string, unknown>;
	diagnostics?: Record<string, unknown>;
	summary?: LabRegimeTimelineSummary;
	segments: LabRegimeTimelineSegment[];
	labels: LabRegimeTimelineLabel[];
	price_points: LabRegimeTimelinePricePoint[];
}> {
	return fetchApi(`/lab/regime/reports/timeline?model_version_id=${encodeURIComponent(modelVersionId)}`);
}

export async function getLabRegimeHeatmap(modelVersionId?: string): Promise<{
	model_version_id: string | null;
	taxonomy?: string[];
	regimes: string[];
	strategies: string[];
	cells: LabRegimeHeatmapCell[];
	summary?: LabRegimeHeatmapSummary;
	diagnostics?: Record<string, unknown>;
	timeframes?: Record<string, unknown>;
	generated_at?: string | null;
}> {
	const suffix = modelVersionId ? `?model_version_id=${encodeURIComponent(modelVersionId)}` : '';
	return fetchApi(`/lab/regime/reports/heatmap${suffix}`);
}

export async function getLabRegimeContainers(modelVersionId?: string): Promise<{
	model_version_id: string | null;
	containers: LabRegimeContainerSnapshot[];
}> {
	const suffix = modelVersionId ? `?model_version_id=${encodeURIComponent(modelVersionId)}` : '';
	return fetchApi(`/lab/regime/containers${suffix}`);
}

export async function getLabRegimeContainer(regime: string, modelVersionId?: string): Promise<LabRegimeContainerSnapshot> {
	const suffix = modelVersionId ? `?model_version_id=${encodeURIComponent(modelVersionId)}` : '';
	return fetchApi(`/lab/regime/containers/${encodeURIComponent(regime)}${suffix}`);
}

export async function postLabSelectorDecide(payload: {
	program_id?: string;
	model_version_id?: string;
	symbol?: string;
	timeframe?: string;
	min_confidence?: number;
}): Promise<SelectorDecision> {
	return fetchApi('/lab/regime/selector/decide', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function postLabDispatchPaper(payload: {
	model_version_id?: string;
	symbol?: string;
	timeframe?: string;
	action: string;
	signal_price?: number;
	size?: number;
	leverage?: number;
	risk_pct?: number;
	selection_event_id?: string;
	strategy_id?: string;
	meta_json?: Record<string, unknown>;
}): Promise<DispatchPaperIntentResult> {
	return fetchApi('/lab/regime/intents/dispatch-paper', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function getLabRegimeJobs(options?: {
	states?: Array<'queued' | 'running' | 'succeeded' | 'failed' | 'deadletter'>;
	limit?: number;
}): Promise<LabRegimeJob[]> {
	const params = new URLSearchParams();
	for (const state of options?.states ?? []) {
		params.append('state', state);
	}
	if (options?.limit != null) {
		params.set('limit', String(options.limit));
	}
	const suffix = params.toString();
	const response = await fetchApi<{ status?: string; jobs: LabRegimeJob[]; total?: number }>(
		`/lab/regime/jobs${suffix ? `?${suffix}` : ''}`
	);
	return Array.isArray(response.jobs) ? response.jobs : [];
}

export async function getLabRegimeJob(jobId: string): Promise<LabRegimeJobDetail> {
	return fetchApi(`/lab/regime/jobs/${encodeURIComponent(jobId)}`);
}

export async function getLabWorkerStatus(): Promise<LabWorkerStatusResponse> {
	return fetchApi('/lab/regime/worker/status');
}

export async function getLabWorkerFeed(limit = 200): Promise<LabWorkerFeedResponse> {
	return fetchApi(`/lab/regime/worker/feed?limit=${encodeURIComponent(String(limit))}`);
}

export async function postLabStartWorker(): Promise<StartLabWorkerResult> {
	return fetchApi('/lab/regime/worker/start', {
		method: 'POST',
	});
}

export async function getLabOrchestratorStatus(): Promise<ContinuousOrchestratorStatusResult> {
	return fetchApi('/lab/regime/orchestrator/status');
}

export async function postLabOrchestratorConfigure(payload: {
	program_id?: string;
	enabled?: boolean;
	cadence_hours?: number;
	symbol?: string;
	regime_timeframe?: string;
	execution_timeframe?: string;
	train_lookback_days?: number;
	oos_lookback_days?: number;
	min_segment_bars?: number;
	max_strategies?: number;
	strategy_sources?: LabStrategySource[];
	score_version?: string;
	reserve_count?: number;
	min_champion_dwell_hours?: number;
	min_champion_score_delta?: number;
	graveyard_required_wins?: number;
	auto_start_worker?: boolean;
	refresh_classifier_each_cycle?: boolean;
	matrix_workers?: number;
	run_immediately?: boolean;
}): Promise<ContinuousOrchestratorStatusResult> {
	return fetchApi('/lab/regime/orchestrator/configure', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function postLabOrchestratorRunNow(): Promise<ContinuousCycleEnqueueResult> {
	return fetchApi('/lab/regime/orchestrator/run-now', {
		method: 'POST',
	});
}

export async function getLabStrategyPoolReport(sources?: LabStrategySource[]): Promise<StrategyPoolReportResult> {
	const params = new URLSearchParams();
	for (const source of sources ?? []) {
		params.append('source', source);
	}
	const suffix = params.toString();
	return fetchApi(`/lab/regime/pool${suffix ? `?${suffix}` : ''}`);
}

export interface LabWorkerHealth {
	status: string;
	active: boolean;
	state: string | null;
	current_job_id: string | null;
	heartbeat_at: number | null;
	heartbeat_age_seconds: number | null;
	is_stale: boolean;
	running_jobs_count: number;
}

export async function getLabWorkerHealth(): Promise<LabWorkerHealth> {
	return fetchApi('/lab/regime/worker/health');
}

export interface PendingChampionApproval {
	id: number;
	approval_type: string;
	status: string;
	target_id: string;
	reason: string;
	payload: {
		model_version_id: string;
		champion_changes: Array<{
			regime: string;
			old_champion_strategy_id: string | null;
			new_champion_strategy_id: string;
			new_champion_score: number;
		}>;
	};
	created_at: string;
}
