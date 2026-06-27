import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';

const apiMocks = vi.hoisted(() => ({
	getHypothesisDetail: vi.fn(),
	generateHypothesisStrategies: vi.fn(),
	retriggerHypothesisResearch: vi.fn(),
	archiveHypothesis: vi.fn(),
	trashHypothesis: vi.fn(),
	restoreHypothesis: vi.fn(),
	reopenHypothesis: vi.fn(),
	updateHypothesis: vi.fn(),
	forceRevisitHypothesis: vi.fn(),
}));

const appStoreMocks = vi.hoisted(() => {
	const pageValue = {
		params: { id: 'HYP-abc' },
		url: new URL('http://localhost/hypotheses/HYP-abc'),
	};
	return {
		page: {
			subscribe(callback: (value: typeof pageValue) => void) {
				callback(pageValue);
				return () => {};
			},
		},
	};
});

vi.mock('$lib/api', () => apiMocks);
vi.mock('$app/stores', () => ({
	page: appStoreMocks.page,
}));

import HypothesisDetailPage from '../routes/hypotheses/[id]/+page.svelte';

type MountedComponent = ReturnType<typeof mount>;

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
}

const activeHypothesisDetail = {
	hypothesis: {
		id: 'HYP-abc',
		display_id: 'H00289',
		title: 'BB+RSI',
		market_thesis: 't',
		mechanism: 'm',
		why_now: '',
		lane: 'benchmarking',
		source_type: 'operator_manual',
		origin_agent_id: 'strategy-dev',
		origin_role: 'strategy-developer',
		origin_model: 'claude',
		status: 'open',
		manager_state: 'active',
		operator_notes: '',
		quality: 'enriched',
		novelty_score: 0.5,
		target_assets: [],
		target_timeframes: [],
		strategy_count: 0,
		best_result: null,
		open_data_gap_count: 0,
		archived_at: null,
		deleted_at: null,
		restored_at: null,
		created_at: '2026-04-14T08:00:00Z',
		updated_at: '2026-04-14T09:30:00Z',
	},
	strategies: [],
	artifacts: [],
	data_gaps: [],
	research_task: null,
	agent_activity: [],
};

describe('hypothesis detail — Generate Candidate Strategies button', () => {
	let target: HTMLDivElement;
	let app: MountedComponent | null = null;

	beforeEach(() => {
		target = document.createElement('div');
		document.body.appendChild(target);
		Object.values(apiMocks).forEach((m) => m.mockReset?.());
		apiMocks.getHypothesisDetail.mockResolvedValue(activeHypothesisDetail);
	});

	afterEach(() => {
		if (app) {
			unmount(app);
			app = null;
		}
		target.remove();
		vi.clearAllMocks();
	});

	it('renders the Generate Candidate Strategies button on active hypotheses', async () => {
		app = mount(HypothesisDetailPage, { target });
		await flush();

		const btn = target.querySelector('button[data-detail-action="generate-strategies"]');
		expect(btn).not.toBeNull();
		expect(btn?.textContent).toMatch(/Generate Candidate Strategies/i);
	});

	it('calls generateHypothesisStrategies on click and shows a success banner', async () => {
		apiMocks.generateHypothesisStrategies.mockResolvedValue({
			ok: true,
			task: { task_id: 42 },
			already_running: false,
		});

		app = mount(HypothesisDetailPage, { target });
		await flush();

		const btn = target.querySelector('button[data-detail-action="generate-strategies"]') as HTMLButtonElement;
		expect(btn).not.toBeNull();
		btn.click();
		await flush();
		await flush();

		expect(apiMocks.generateHypothesisStrategies).toHaveBeenCalledWith('HYP-abc', { force: false });
		expect(target.textContent).toMatch(/Candidate strategy task queued/i);
	});

	it('shows "already queued" when backend reports dedupe', async () => {
		apiMocks.generateHypothesisStrategies.mockResolvedValue({
			ok: true,
			task: { task_id: 42 },
			already_running: true,
		});

		app = mount(HypothesisDetailPage, { target });
		await flush();

		const btn = target.querySelector('button[data-detail-action="generate-strategies"]') as HTMLButtonElement;
		expect(btn).not.toBeNull();
		btn.click();
		await flush();
		await flush();

		expect(target.textContent).toMatch(/Candidate strategy task already queued/i);
	});
});
