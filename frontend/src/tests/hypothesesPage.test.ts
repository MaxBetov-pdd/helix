import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';

const apiMocks = vi.hoisted(() => ({
	getHypotheses: vi.fn(),
	getHypothesisDetail: vi.fn(),
	getRankedDataGaps: vi.fn(),
	archiveHypothesis: vi.fn(),
	trashHypothesis: vi.fn(),
	restoreHypothesis: vi.fn(),
	bulkArchiveHypotheses: vi.fn(),
	bulkTrashHypotheses: vi.fn(),
	bulkRestoreHypotheses: vi.fn(),
	forceRevisitHypothesis: vi.fn(),
	retriggerHypothesisResearch: vi.fn(),
	reopenHypothesis: vi.fn(),
	updateHypothesis: vi.fn(),
	discoverCrucibles: vi.fn(),
}));

const appStoreMocks = vi.hoisted(() => {
	let pageValue = {
		params: { id: 'H00001' },
		url: new URL('http://localhost/hypotheses/H00001'),
	};
	const subscribers = new Set<(value: typeof pageValue) => void>();

	return {
		page: {
			subscribe(callback: (value: typeof pageValue) => void) {
				callback(pageValue);
				subscribers.add(callback);
				return () => subscribers.delete(callback);
			},
		},
		setUrl(url: string) {
			const nextUrl = new URL(url);
			const segments = nextUrl.pathname.split('/').filter(Boolean);
			pageValue = {
				params: { id: segments[1] ?? 'H00001' },
				url: nextUrl,
			};
			for (const subscriber of subscribers) {
				subscriber(pageValue);
			}
		},
	};
});

vi.mock('$lib/api', () => apiMocks);
vi.mock('$app/stores', () => ({
	page: appStoreMocks.page,
}));

import HypothesesPage from '../routes/hypotheses/+page.svelte';
import HypothesisDetailPage from '../routes/hypotheses/[id]/+page.svelte';

type MountedComponent = ReturnType<typeof mount>;

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
}

describe('/hypotheses routes', () => {
	let target: HTMLDivElement;
	let app: MountedComponent | null = null;

	beforeEach(() => {
		target = document.createElement('div');
		document.body.appendChild(target);
		appStoreMocks.setUrl('http://localhost/hypotheses/H00001');
		apiMocks.getHypotheses.mockResolvedValue({
			hypotheses: [
				{
					id: 'HYP-001',
					display_id: 'H00001',
					title: 'Funding dislocations mean revert',
					lane: 'exploration',
					source_type: 'agent_original',
					origin_agent_id: 'strategy-dev-1',
					origin_role: 'strategy-developer',
					origin_model: 'gpt-5.4',
					status: 'candidate_created',
					manager_state: 'active',
					novelty_score: 0.82,
					target_assets: ['BTC-PERP'],
					target_timeframes: ['15m'],
					strategy_count: 2,
					best_result: null,
					open_data_gap_count: 1,
					archived_at: null,
					deleted_at: null,
					restored_at: null,
					created_at: '2026-04-14T10:00:00Z',
					updated_at: '2026-04-14T11:00:00Z',
				},
			],
		});
		apiMocks.getRankedDataGaps.mockResolvedValue({
			items: [
				{
					id: 'gap-1',
					title: 'Funding rate history',
					category: 'market_microstructure',
					missing_dataset: 'funding_rates',
					missing_fields: ['funding_rate'],
					request_count: 4,
					priority_score: 9.2,
				},
			],
		});
		apiMocks.getHypothesisDetail.mockResolvedValue({
			hypothesis: {
				id: 'HYP-001',
				display_id: 'H00001',
				title: 'Funding dislocations mean revert',
				market_thesis: 'Extreme positive funding creates fadeable squeezes.',
				mechanism: 'Short crowded longs after funding spikes.',
				why_now: 'Crowding has increased since ETF launch.',
				lane: 'benchmarking',
				source_type: 'public_benchmark',
				origin_agent_id: 'strategy-dev-2',
				origin_role: 'strategy-developer',
				origin_model: 'claude',
				status: 'candidate_created',
				manager_state: 'active',
				novelty_score: 0.61,
				target_assets: ['BTC-PERP'],
				target_timeframes: ['15m', '1h'],
				created_at: '2026-04-14T08:00:00Z',
				updated_at: '2026-04-14T09:30:00Z',
				strategy_count: 1,
				best_result: null,
				open_data_gap_count: 1,
				archived_at: null,
				deleted_at: null,
				restored_at: null,
			},
			strategies: [
				{
					id: 'S0099',
					name: 'BTC Funding Fade',
					type: 'custom',
					symbol: 'BTC-PERP',
					timeframe: '15m',
					stage: 'quick_screen',
					status: 'active',
					owner: 'strategy-dev-2',
					latest_result: null,
					updated_at: '2026-04-14T09:35:00Z',
				},
			],
			artifacts: [
				{
					id: 'artifact-1',
					hypothesis_id: 'HYP-001',
					source_type: 'youtube',
					source_title: 'Funding Arbitrage Explained',
					source_ref: 'https://youtube.example/funding',
					claimed_edge: 'Fade extreme funding spikes.',
					implementation_summary: 'Use funding z-score plus trend filter.',
					adaptation_notes: 'Needs exchange-specific thresholds.',
					caveats: 'Popular on social channels, likely crowded.',
				},
			],
			data_gaps: [
				{
					id: 'gap-1',
					title: 'Funding rate history',
					category: 'market_microstructure',
					missing_dataset: 'funding_rates',
					missing_fields: ['funding_rate'],
					why_it_matters: 'Signals depend on extreme funding levels.',
					request_count: 4,
					priority_score: 9.2,
				},
			],
		});
		apiMocks.archiveHypothesis.mockResolvedValue({
			hypothesis: {
				id: 'HYP-001',
				display_id: 'H00001',
				title: 'Funding dislocations mean revert',
				manager_state: 'archived',
				archived_at: '2026-04-14T10:00:00Z',
				deleted_at: null,
				restored_at: null,
			},
		});
		apiMocks.trashHypothesis.mockResolvedValue({
			hypothesis: {
				id: 'HYP-001',
				display_id: 'H00001',
				title: 'Funding dislocations mean revert',
				manager_state: 'trash',
				archived_at: '2026-04-14T10:00:00Z',
				deleted_at: '2026-04-14T11:00:00Z',
				restored_at: null,
			},
		});
		apiMocks.restoreHypothesis.mockResolvedValue({
			hypothesis: {
				id: 'HYP-001',
				display_id: 'H00001',
				title: 'Funding dislocations mean revert',
				manager_state: 'active',
				archived_at: null,
				deleted_at: null,
				restored_at: '2026-04-14T12:00:00Z',
			},
		});
		apiMocks.bulkArchiveHypotheses.mockResolvedValue({ hypotheses: [] });
		apiMocks.bulkTrashHypotheses.mockResolvedValue({ hypotheses: [] });
		apiMocks.bulkRestoreHypotheses.mockResolvedValue({ hypotheses: [] });
	});

	afterEach(() => {
		if (app) {
			unmount(app);
			app = null;
		}
		target.remove();
		vi.clearAllMocks();
	});

	it('renders the hypotheses overview with leaderboard context', async () => {
		app = mount(HypothesesPage, { target });
		await flush();

		// The page lazy-loads one paginated view at a time (one getHypotheses call
		// for the active view on mount); other tabs load on switch.
		expect(apiMocks.getHypotheses).toHaveBeenCalledTimes(1);
		expect(apiMocks.getHypotheses).toHaveBeenCalledWith(expect.objectContaining({ view: 'active' }));
		expect(target.textContent).toContain('Funding dislocations mean revert');
		expect(target.textContent).toContain('Data gaps');
		expect(target.querySelector('a[href="/hypotheses/H00001"]')).not.toBeNull();
	});

	it('renders the manager table with active archived and trash controls', async () => {
		app = mount(HypothesesPage, { target });
		await flush();

		expect(target.textContent).toContain('Active');
		expect(target.textContent).toContain('Archived');
		expect(target.textContent).toContain('Trash');
		expect(target.querySelector('input[aria-label="Select visible crucibles"]')).not.toBeNull();
		expect(target.querySelector('table')).not.toBeNull();
	});

	it('archives a selected row and refreshes the active view', async () => {
		apiMocks.getHypotheses
			.mockResolvedValueOnce({
				hypotheses: [
					{
						id: 'HYP-001',
						display_id: 'H00001',
						title: 'Funding dislocations mean revert',
						lane: 'exploration',
						source_type: 'agent_original',
						origin_agent_id: 'strategy-dev-1',
						origin_role: 'strategy-developer',
						origin_model: 'gpt-5.4',
						status: 'candidate_created',
						manager_state: 'active',
						novelty_score: 0.82,
						target_assets: ['BTC-PERP'],
						target_timeframes: ['15m'],
						strategy_count: 2,
						best_result: null,
						open_data_gap_count: 1,
						archived_at: null,
						deleted_at: null,
						restored_at: null,
						created_at: '2026-04-14T10:00:00Z',
						updated_at: '2026-04-14T11:00:00Z',
					},
				],
			})
			.mockResolvedValueOnce({ hypotheses: [] });

		app = mount(HypothesesPage, { target });
		await flush();

		(target.querySelector('input[data-row-select="HYP-001"]') as HTMLInputElement).click();
		await flush();
		(target.querySelector('button[data-action="archive-selected"]') as HTMLButtonElement).click();
		await flush();

		expect(apiMocks.bulkArchiveHypotheses).toHaveBeenCalledWith(['HYP-001']);
		// mount (1) + refreshAll after the action (1).
		expect(apiMocks.getHypotheses).toHaveBeenCalledTimes(2);
	});

	it('trashes a row from the row action controls', async () => {
		apiMocks.getHypotheses
			.mockResolvedValueOnce({
				hypotheses: [
					{
						id: 'HYP-001',
						display_id: 'H00001',
						title: 'Funding dislocations mean revert',
						lane: 'exploration',
						source_type: 'agent_original',
						origin_agent_id: 'strategy-dev-1',
						origin_role: 'strategy-developer',
						origin_model: 'gpt-5.4',
						status: 'candidate_created',
						manager_state: 'active',
						novelty_score: 0.82,
						target_assets: ['BTC-PERP'],
						target_timeframes: ['15m'],
						strategy_count: 2,
						best_result: null,
						open_data_gap_count: 1,
						archived_at: null,
						deleted_at: null,
						restored_at: null,
						created_at: '2026-04-14T10:00:00Z',
						updated_at: '2026-04-14T11:00:00Z',
					},
				],
			})
			.mockResolvedValueOnce({ hypotheses: [] });

		app = mount(HypothesesPage, { target });
		await flush();

		(target.querySelector('button[data-row-action="trash-HYP-001"]') as HTMLButtonElement).click();
		await flush();

		expect(apiMocks.trashHypothesis).toHaveBeenCalledWith('HYP-001');
		// mount (1) + refreshAll after the action (1).
		expect(apiMocks.getHypotheses).toHaveBeenCalledTimes(2);
	});

	it('renders the hypothesis detail with linked strategies, artifacts, and data gaps', async () => {
		app = mount(HypothesisDetailPage, { target });
		await flush();

		expect(apiMocks.getHypothesisDetail).toHaveBeenCalledWith('H00001', { includeContent: false });
		expect(target.textContent).toContain('Funding dislocations mean revert');
		expect(target.textContent).toContain('Extreme positive funding creates fadeable squeezes.');
		expect(target.textContent).toContain('Funding Arbitrage Explained');
		expect(target.textContent).toContain('Funding rate history');
		expect(target.querySelector('a[href="/lab/strategy/S0099?returnTo=%2Fhypotheses%2FH00001"]')).not.toBeNull();
		expect(target.querySelector('a[href="https://youtube.example/funding"]')).not.toBeNull();
	});

	it('reloads detail data when client-side navigation changes the hypothesis id', async () => {
		apiMocks.getHypothesisDetail
			.mockResolvedValueOnce({
				hypothesis: {
					id: 'HYP-001',
					display_id: 'H00001',
					title: 'Funding dislocations mean revert',
					market_thesis: 'Extreme positive funding creates fadeable squeezes.',
					mechanism: 'Short crowded longs after funding spikes.',
					why_now: 'Crowding has increased since ETF launch.',
					lane: 'benchmarking',
					source_type: 'public_benchmark',
					origin_agent_id: 'strategy-dev-2',
					origin_role: 'strategy-developer',
					origin_model: 'claude',
					status: 'candidate_created',
					manager_state: 'active',
					novelty_score: 0.61,
					target_assets: ['BTC-PERP'],
					target_timeframes: ['15m', '1h'],
					created_at: '2026-04-14T08:00:00Z',
					updated_at: '2026-04-14T09:30:00Z',
					strategy_count: 1,
					best_result: null,
					open_data_gap_count: 1,
					archived_at: null,
					deleted_at: null,
					restored_at: null,
				},
				strategies: [],
				artifacts: [],
				data_gaps: [],
			})
			.mockResolvedValueOnce({
				hypothesis: {
					id: 'HYP-002',
					display_id: 'H00002',
					title: 'Overnight reversal in ETH',
					market_thesis: 'Asia session exhaustion reverts into Europe.',
					mechanism: 'Fade late-session trend continuation.',
					why_now: 'Range expansion has increased during Asia hours.',
					lane: 'exploration',
					source_type: 'agent_original',
					origin_agent_id: 'strategy-dev-4',
					origin_role: 'strategy-developer',
					origin_model: 'gpt-5.4',
					status: 'researching',
					manager_state: 'active',
					novelty_score: 0.74,
					target_assets: ['ETH-PERP'],
					target_timeframes: ['30m'],
					created_at: '2026-04-14T12:00:00Z',
					updated_at: '2026-04-14T12:15:00Z',
					strategy_count: 0,
					best_result: null,
					open_data_gap_count: 0,
					archived_at: null,
					deleted_at: null,
					restored_at: null,
				},
				strategies: [],
				artifacts: [],
				data_gaps: [],
			});

		app = mount(HypothesisDetailPage, { target });
		await flush();

		appStoreMocks.setUrl('http://localhost/hypotheses/H00002');
		await flush();

		expect(apiMocks.getHypothesisDetail).toHaveBeenNthCalledWith(1, 'H00001', { includeContent: false });
		expect(apiMocks.getHypothesisDetail).toHaveBeenNthCalledWith(2, 'H00002', { includeContent: false });
		expect(target.textContent).toContain('Overnight reversal in ETH');
		expect(target.textContent).not.toContain('Funding dislocations mean revert');
	});

	it('shows restore controls when a trashed hypothesis stays visible on the detail page', async () => {
		apiMocks.getHypothesisDetail.mockResolvedValueOnce({
			hypothesis: {
				id: 'HYP-001',
				display_id: 'H00001',
				title: 'Funding dislocations mean revert',
				market_thesis: 'Extreme positive funding creates fadeable squeezes.',
				mechanism: 'Short crowded longs after funding spikes.',
				why_now: 'Crowding has increased since ETF launch.',
				lane: 'benchmarking',
				source_type: 'public_benchmark',
				origin_agent_id: 'strategy-dev-2',
				origin_role: 'strategy-developer',
				origin_model: 'claude',
				status: 'candidate_created',
				manager_state: 'trash',
				novelty_score: 0.61,
				target_assets: ['BTC-PERP'],
				target_timeframes: ['15m', '1h'],
				created_at: '2026-04-14T08:00:00Z',
				updated_at: '2026-04-14T09:30:00Z',
				strategy_count: 1,
				best_result: null,
				open_data_gap_count: 1,
				archived_at: '2026-04-14T09:50:00Z',
				deleted_at: '2026-04-14T10:00:00Z',
				restored_at: null,
			},
			strategies: [],
			artifacts: [],
			data_gaps: [],
		});

		app = mount(HypothesisDetailPage, { target });
		await flush();

		expect(target.textContent).toContain('Trash');
		expect(target.querySelector('button[data-detail-action="restore"]')).not.toBeNull();
	});

	it('trashes the current hypothesis and keeps the detail page loaded', async () => {
		app = mount(HypothesisDetailPage, { target });
		await flush();

		(target.querySelector('button[data-detail-action="trash"]') as HTMLButtonElement).click();
		await flush();
		// Trash now routes through a confirmation dialog — accept it.
		(target.querySelector('button[data-detail-action="confirm-accept"]') as HTMLButtonElement).click();
		await flush();

		expect(apiMocks.trashHypothesis).toHaveBeenCalledWith('HYP-001');
		expect(target.textContent).toContain('Restore');
	});

	it('renders a graduated tab on the manager surface', async () => {
		app = mount(HypothesesPage, { target });
		await flush();

		const tabs = Array.from(target.querySelectorAll('button')).map((b) => b.textContent?.trim());
		expect(tabs.some((label) => label?.startsWith('Graduated'))).toBe(true);
	});

	it('switching to the graduated tab refetches with view=graduated', async () => {
		apiMocks.getHypotheses.mockResolvedValueOnce({ hypotheses: [] }); // initial active load
		apiMocks.getHypotheses.mockResolvedValueOnce({ hypotheses: [] }); // graduated load
		app = mount(HypothesesPage, { target });
		await flush();

		const graduatedBtn = Array.from(target.querySelectorAll('button')).find(
			(b) => b.textContent?.trim().startsWith('Graduated'),
		) as HTMLButtonElement;
		expect(graduatedBtn).toBeDefined();
		graduatedBtn.click();
		await flush();

		expect(apiMocks.getHypotheses).toHaveBeenLastCalledWith(
			expect.objectContaining({ view: 'graduated' }),
		);
	});

	it('shows a Revisit button on a graduated hypothesis detail and calls the API', async () => {
		apiMocks.getHypothesisDetail.mockResolvedValueOnce({
			hypothesis: {
				id: 'HYP-001',
				display_id: 'H00001',
				title: 'Funding dislocations mean revert',
				market_thesis: 'Extreme positive funding creates fadeable squeezes.',
				mechanism: 'Short crowded longs after funding spikes.',
				lane: 'benchmarking',
				source_type: 'public_benchmark',
				status: 'proven',
				manager_state: 'graduated',
				novelty_score: 0.61,
				target_assets: ['BTC-PERP'],
				target_timeframes: ['15m'],
				strategy_count: 2,
				best_result: null,
				open_data_gap_count: 0,
				archived_at: null,
				deleted_at: null,
				restored_at: null,
				graduated_at: '2026-04-14T12:00:00Z',
				next_revisit_at: '2026-07-13T12:00:00Z',
			},
			strategies: [],
			artifacts: [],
			data_gaps: [],
		});
		apiMocks.forceRevisitHypothesis.mockResolvedValue({
			hypothesis_id: 'HYP-001',
			manager_state: 'active',
			status: 'researching',
			next_revisit_at: '2026-07-13T12:00:00Z',
		});

		app = mount(HypothesisDetailPage, { target });
		await flush();

		const revisitBtn = target.querySelector(
			'button[data-detail-action="revisit"]',
		) as HTMLButtonElement;
		expect(revisitBtn).not.toBeNull();
		revisitBtn.click();
		await flush();

		expect(apiMocks.forceRevisitHypothesis).toHaveBeenCalledWith('HYP-001');
	});

	it('renders a canonical badge on linked strategies that are flagged canonical', async () => {
		apiMocks.getHypothesisDetail.mockResolvedValueOnce({
			hypothesis: {
				id: 'HYP-001',
				display_id: 'H00001',
				title: 'Funding dislocations mean revert',
				market_thesis: 'Extreme positive funding creates fadeable squeezes.',
				mechanism: 'Short crowded longs after funding spikes.',
				lane: 'benchmarking',
				source_type: 'public_benchmark',
				status: 'proven',
				manager_state: 'graduated',
				novelty_score: 0.61,
				target_assets: ['BTC-PERP'],
				target_timeframes: ['15m'],
				strategy_count: 1,
				best_result: null,
				open_data_gap_count: 0,
				archived_at: null,
				deleted_at: null,
				restored_at: null,
				graduated_at: '2026-04-14T12:00:00Z',
				next_revisit_at: '2026-07-13T12:00:00Z',
			},
			strategies: [
				{
					id: 'S0099',
					name: 'BTC Funding Fade',
					stage: 'gauntlet',
					status: 'active',
					gauntlet_status: 'passed',
					symbol: 'BTC-PERP',
					timeframe: '15m',
					owner: 'strategy-dev-2',
					latest_result: null,
					updated_at: '2026-04-14T09:35:00Z',
					canonical: true,
					parent_strategy_id: 'S0090',
				},
			],
			artifacts: [],
			data_gaps: [],
		});

		app = mount(HypothesisDetailPage, { target });
		await flush();

		expect(target.querySelector('[data-canonical-badge]')).not.toBeNull();
		expect(target.textContent).toContain('Canonical');
		// Forge proof status badge renders from the child's gauntlet_status.
		expect(target.querySelector('[data-forge-status="passed"]')).not.toBeNull();
		expect(target.textContent).toContain('Passed');
	});

	it('renders the crucible lifecycle stage, origin, and protection badge', async () => {
		apiMocks.getHypotheses.mockResolvedValue({
			hypotheses: [
				{
					id: 'HYP-009',
					display_id: 'H00009',
					title: 'Protected viable thesis',
					lane: 'benchmarking',
					origin: 'harvested',
					source_type: 'youtube',
					origin_agent_id: null,
					origin_role: null,
					origin_model: null,
					status: 'proven',
					crucible_status: 'viable',
					manager_state: 'active',
					protection_status: 'protected',
					novelty_score: 0.5,
					target_assets: ['BTC'],
					target_timeframes: ['1h'],
					strategy_count: 1,
					best_result: null,
					open_data_gap_count: 0,
					quality: 'productive',
					created_at: '2026-04-14T10:00:00Z',
					updated_at: '2026-04-14T11:00:00Z',
				},
			],
		});

		app = mount(HypothesesPage, { target });
		await flush();

		const cell = target.querySelector('[data-crucible-status="viable"]');
		expect(cell).not.toBeNull();
		expect(cell?.textContent).toContain('Viable');
		expect(cell?.textContent).toContain('Protected');
		expect(target.textContent).toContain('Harvested');
	});

	it('detail page names the Forge hand-off and renders verdict signals', async () => {
		apiMocks.getHypothesisDetail.mockResolvedValueOnce({
			hypothesis: {
				id: 'HYP-001',
				display_id: 'H00001',
				title: 'Funding dislocations mean revert',
				market_thesis: 'Extreme positive funding creates fadeable squeezes.',
				mechanism: 'Short crowded longs after funding spikes.',
				lane: 'benchmarking',
				origin: 'harvested',
				source_type: 'youtube',
				status: 'proven',
				crucible_status: 'viable',
				manager_state: 'active',
				protection_status: 'protected',
				novelty_score: 0.61,
				target_assets: ['BTC-PERP'],
				target_timeframes: ['15m'],
				strategy_count: 1,
				best_result: null,
				open_data_gap_count: 0,
				archived_at: null,
				deleted_at: null,
				restored_at: null,
				verdict_signals: {
					rolling_window_setting: 4,
					rolling_window_size: 3,
					hit_rate: 0.67,
					diversity_cells: 2,
					hit_rate_threshold: 0.4,
					min_diversity_cells: 2,
					mathematical_verdict: 'proven',
				},
			},
			strategies: [],
			artifacts: [],
			data_gaps: [],
		});

		app = mount(HypothesisDetailPage, { target });
		await flush();

		expect(target.textContent).toContain('Forge — Proof Attempts');
		expect(target.textContent).toContain('Hit rate');
		expect(target.textContent).toContain('Viable');
		expect(target.textContent).toContain('Harvested');
	});

	it('Discover button dispatches an operator-triggered harvest and refreshes', async () => {
		apiMocks.discoverCrucibles.mockResolvedValue({ created: true, mode: 'operator_approves' });

		app = mount(HypothesesPage, { target });
		await flush();
		const callsBefore = apiMocks.getHypotheses.mock.calls.length;

		const discoverBtn = target.querySelector('button[data-action="discover-crucibles"]') as HTMLButtonElement;
		expect(discoverBtn).not.toBeNull();
		discoverBtn.click();
		await flush();

		expect(apiMocks.discoverCrucibles).toHaveBeenCalledTimes(1);
		// refreshAll re-fetches the list after dispatching.
		expect(apiMocks.getHypotheses.mock.calls.length).toBeGreaterThan(callsBefore);
	});
});
