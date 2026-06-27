import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';

const lifecycleMocks = vi.hoisted(() => ({
	getPromotionReadiness: vi.fn(),
	getPaperLiveReadiness: vi.fn(),
	runTimeframeSweep: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
	addToast: vi.fn(),
}));

vi.mock('$lib/api/lifecycle', () => lifecycleMocks);
vi.mock('$lib/stores/processTracker', () => ({
	addToast: toastMocks.addToast,
}));

import PromotionReadiness from '../lib/components/ui/PromotionReadiness.svelte';
import type { QuickScreenEvidenceRow } from '../lib/utils/quickScreenReadiness';

type MountedComponent = ReturnType<typeof mount>;

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
}

describe('PromotionReadiness evidence panel', () => {
	let target: HTMLDivElement;
	let app: MountedComponent | null = null;

	beforeEach(() => {
		target = document.createElement('div');
		document.body.appendChild(target);
		lifecycleMocks.getPromotionReadiness.mockReset();
		lifecycleMocks.getPaperLiveReadiness.mockReset();
		lifecycleMocks.runTimeframeSweep.mockReset();
		toastMocks.addToast.mockReset();
	});

	afterEach(() => {
		if (app) {
			unmount(app);
			app = null;
		}
		target.remove();
		vi.clearAllMocks();
	});

	it('shows gauntlet validation artifact evidence inline', async () => {
		lifecycleMocks.getPromotionReadiness.mockResolvedValue({
			ready: false,
			strategy_id: 'S0001',
			steps: [
				{
					name: 'validation_artifacts',
					status: 'failed',
					detail: 'Missing persisted artifact rows for: monte_carlo, regime_split',
					actionable: 'run_validation_suite',
				},
			],
		});

		app = mount(PromotionReadiness, {
			target,
			props: { strategyId: 'S0001', stage: 'gauntlet' },
		});

		await flush();

		expect(target.querySelector('[data-testid="readiness-row-validation_artifacts"]')).not.toBeNull();
		expect(target.querySelector('[data-testid="readiness-status-validation_artifacts"]')?.textContent).toContain('Blocked');
		expect(target.querySelector('[data-testid="readiness-detail-validation_artifacts"]')?.textContent).toContain(
			'Missing persisted artifact rows for: monte_carlo, regime_split'
		);
		expect(target.querySelector('[data-testid="readiness-action-validation_artifacts"]')?.textContent).toContain(
			'Run Validation'
		);
	});

	it('shows paper evidence detail text and actions for incomplete steps', async () => {
		lifecycleMocks.getPaperLiveReadiness.mockResolvedValue({
			ready: false,
			strategy_id: 'S0001',
			steps: [
				{ name: 'optimization', status: 'passed', detail: 'Best optimization result saved', actionable: null },
				{
					name: 'params_applied',
					status: 'warning',
					detail: 'Optimized params not applied',
					actionable: 'apply_best_params',
				},
				{
					name: 'confirmation_backtest',
					status: 'failed',
					detail: 'No confirmation backtest after optimization',
					actionable: 'run_confirmation_backtest',
				},
			],
		});

		app = mount(PromotionReadiness, {
			target,
			props: { strategyId: 'S0001', stage: 'paper' },
		});

		await flush();

		expect(target.querySelector('[data-testid="readiness-status-optimization"]')?.textContent).toContain('Passed');
		expect(target.querySelector('[data-testid="readiness-status-params_applied"]')?.textContent).toContain('Warning');
		expect(target.querySelector('[data-testid="readiness-status-confirmation_backtest"]')?.textContent).toContain(
			'Blocked'
		);

		expect(target.textContent).toContain('Optimized params not applied');
		expect(target.textContent).toContain('No confirmation backtest after optimization');
		expect(target.querySelector('[data-testid="readiness-action-params_applied"]')?.textContent).toContain(
			'Apply Best Params'
		);
		expect(target.querySelector('[data-testid="readiness-action-confirmation_backtest"]')?.textContent).toContain(
			'Run the Gauntlet'
		);
	});

	it('renders quick screen rows from the quickScreenRows prop', async () => {
		const quickScreenRows: QuickScreenEvidenceRow[] = [
			{
				key: 'is_sharpe_ratio',
				label: 'IS Sharpe Ratio',
				status: 'passed',
				actual: '0.82',
				required: '> 0.50',
				detail: 'Actual 0.82 | Required > 0.50',
			},
			{
				key: 'validation_coverage',
				label: 'Validation Coverage',
				status: 'failed',
				actual: '3/5',
				required: 'All required artifacts present',
				detail: 'Validation artifacts present: 3/5; missing monte_carlo, regime_split',
			},
		];

		app = mount(PromotionReadiness, {
			target,
			props: { strategyId: 'S0001', stage: 'quick_screen', quickScreenRows },
		});

		await flush();

		expect(target.querySelector('[data-testid="readiness-row-qs-is_sharpe_ratio"]')).not.toBeNull();
		expect(target.querySelector('[data-testid="readiness-status-qs-is_sharpe_ratio"]')?.textContent).toContain(
			'Passed'
		);
		expect(target.querySelector('[data-testid="readiness-detail-qs-is_sharpe_ratio"]')?.textContent).toContain(
			'Actual 0.82 | Required > 0.50'
		);
		expect(target.querySelector('[data-testid="readiness-status-qs-validation_coverage"]')?.textContent).toContain(
			'Blocked'
		);
		expect(target.textContent).toContain('Validation artifacts present: 3/5; missing monte_carlo, regime_split');
		expect(target.textContent).not.toContain('Minimum Return');
		expect(target.textContent).not.toContain('Max Drawdown');
		expect(
			Array.from(target.querySelectorAll('button')).some(
				(button) => (button.textContent ?? '').trim() === 'Refresh',
			),
		).toBe(false);
		expect(lifecycleMocks.getPromotionReadiness).not.toHaveBeenCalled();
		expect(lifecycleMocks.getPaperLiveReadiness).not.toHaveBeenCalled();
	});
});
