import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmount } from 'svelte';

const apiMock = vi.hoisted(() => ({
	getPaperSummary: vi.fn(),
}));

vi.mock('$lib/api/dashboard', () => apiMock);

import PaperSessionSummary from '../lib/components/dashboard/PaperSessionSummary.svelte';

let target: HTMLElement;
let instance: ReturnType<typeof mount> | null = null;

afterEach(() => {
	if (instance) {
		unmount(instance);
		instance = null;
	}
	target?.remove();
	apiMock.getPaperSummary.mockReset();
});

async function flush(): Promise<void> {
	await Promise.resolve();
	await new Promise((r) => setTimeout(r, 0));
	await Promise.resolve();
}

function buildSummary() {
	return {
		sessions: [
			{
				session_id: 'compat:strategy:S1',
				strategy_id: 'S1',
				strategy_name: 'Alpha',
				symbol: 'BTC/USDT',
				timeframe: '1h',
				status: 'watching',
				closed_count: 10,
				open_count: 1,
				realized_pnl_usd: 120.5,
				win_rate_pct: 60.0,
				close_reasons: { exit_signal: 9, reconcile_missing_on_exchange: 1 },
			},
			{
				session_id: 'compat:strategy:S2',
				strategy_id: 'S2',
				strategy_name: 'Beta',
				symbol: 'SOL/USDT',
				timeframe: '4h',
				status: 'watching',
				closed_count: 5,
				open_count: 0,
				realized_pnl_usd: -30.25,
				win_rate_pct: 20.0,
				close_reasons: { stale_position_sweep: 5 },
			},
		],
		totals: {
			session_count: 2,
			closed_count: 15,
			open_count: 1,
			realized_pnl_usd: 90.25,
			win_rate_pct: 46.6667,
			close_reasons: {
				exit_signal: 9,
				stale_position_sweep: 5,
				reconcile_missing_on_exchange: 1,
			},
		},
		include_deployed: false,
		timestamp: '2026-06-10T00:00:00+00:00',
	};
}

function mountWidget() {
	target = document.createElement('div');
	document.body.appendChild(target);
	instance = mount(PaperSessionSummary, { target, props: {} });
}

describe('PaperSessionSummary', () => {
	it('renders totals: closed, open, realized PnL, win rate', async () => {
		apiMock.getPaperSummary.mockResolvedValue(buildSummary());
		mountWidget();
		await flush();

		expect(target.querySelector('[data-testid="paper-summary-closed"]')?.textContent?.trim()).toBe('15');
		expect(target.querySelector('[data-testid="paper-summary-open"]')?.textContent?.trim()).toBe('1');
		expect(target.querySelector('[data-testid="paper-summary-pnl"]')?.textContent?.trim()).toBe('+$90.25');
		expect(target.querySelector('[data-testid="paper-summary-winrate"]')?.textContent?.trim()).toBe('46.7%');
	});

	it('renders the close_reason breakdown with synthetic reasons flagged', async () => {
		apiMock.getPaperSummary.mockResolvedValue(buildSummary());
		mountWidget();
		await flush();

		const reasons = target.querySelector('[data-testid="paper-summary-reasons"]');
		expect(reasons).toBeTruthy();
		const chips = Array.from(reasons!.querySelectorAll('.reason-chip'));
		expect(chips.length).toBe(3);
		// Sorted desc by count: exit_signal(9), stale_position_sweep(5), reconcile(1).
		expect(chips[0].textContent).toContain('exit_signal');
		expect(chips[0].textContent).toContain('9');
		expect(chips[0].classList.contains('reason-chip--warn')).toBe(false);
		expect(chips[1].textContent).toContain('stale_position_sweep');
		expect(chips[1].classList.contains('reason-chip--warn')).toBe(true);
		expect(chips[2].textContent).toContain('reconcile_missing_on_exchange');
		expect(chips[2].classList.contains('reason-chip--warn')).toBe(true);
	});

	it('expands a per-session table with PnL and dominant close reason', async () => {
		apiMock.getPaperSummary.mockResolvedValue(buildSummary());
		mountWidget();
		await flush();

		expect(target.querySelector('[data-testid="paper-summary-sessions"]')).toBeNull();
		const toggle = target.querySelector<HTMLButtonElement>('[data-testid="paper-summary-toggle"]');
		expect(toggle).toBeTruthy();
		toggle!.click();
		await flush();

		const rows = target.querySelectorAll('[data-testid="paper-summary-session-row"]');
		expect(rows.length).toBe(2);
		expect(rows[0].textContent).toContain('Alpha');
		expect(rows[0].textContent).toContain('+$120.50');
		expect(rows[0].textContent).toContain('exit_signal');
		expect(rows[1].textContent).toContain('Beta');
		expect(rows[1].textContent).toContain('-$30.25');
		expect(rows[1].textContent).toContain('stale_position_sweep');
	});

	it('degrades to an error message when the endpoint fails', async () => {
		apiMock.getPaperSummary.mockRejectedValue(new Error('summary unavailable'));
		mountWidget();
		await flush();

		const error = target.querySelector('[data-testid="paper-summary-error"]');
		expect(error).toBeTruthy();
		expect(error?.textContent).toContain('summary unavailable');
	});
});
