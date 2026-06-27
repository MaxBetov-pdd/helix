import { describe, expect, it } from 'vitest';

import {
	analyzeRunRelativePosition,
	buildRunNarrative,
	recommendRunActions,
	type ComparableRunMetrics,
} from '../lib/utils/runInsights';

const current: ComparableRunMetrics = {
	id: 'bt-3',
	resultType: 'backtest',
	annualizedReturnPct: 28,
	totalReturnPct: 24,
	sharpe: 1.92,
	maxDrawdownPct: 12,
	winRatePct: 54,
	trades: 48,
	profitFactor: 1.8,
};

const peers: ComparableRunMetrics[] = [
	{
		id: 'bt-1',
		resultType: 'backtest',
		annualizedReturnPct: 15,
		totalReturnPct: 12,
		sharpe: 1.1,
		maxDrawdownPct: 18,
		winRatePct: 49,
		trades: 31,
		profitFactor: 1.2,
	},
	{
		id: 'bt-2',
		resultType: 'backtest',
		annualizedReturnPct: 22,
		totalReturnPct: 20,
		sharpe: 1.45,
		maxDrawdownPct: 16,
		winRatePct: 52,
		trades: 40,
		profitFactor: 1.4,
	},
];

describe('runInsights', () => {
	it('computes rank and deltas relative to peer history', () => {
		const insight = analyzeRunRelativePosition(current, peers);
		expect(insight.sampleSize).toBe(3);
		expect(insight.sharpeRank).toBe(1);
		expect(insight.returnRank).toBe(1);
		expect(insight.sharpeDeltaVsMedian).toBeGreaterThan(0);
		expect(insight.drawdownDeltaVsMedian).toBeLessThan(0);
	});

	it('builds actionable narrative bullets', () => {
		const insight = analyzeRunRelativePosition(current, peers);
		const narrative = buildRunNarrative(current, insight);
		expect(narrative.length).toBeGreaterThan(0);
		expect(narrative.join(' ')).toMatch(/top quartile|strong enough|sample size/i);
	});

	it('recommends follow-up actions based on result type', () => {
		expect(recommendRunActions(current).map((item) => item.key)).toContain('walk_forward');
		expect(
			recommendRunActions({
				...current,
				id: 'opt-1',
				resultType: 'optimization',
			}).map((item) => item.key),
		).toContain('backtest_with_params');
	});
});
