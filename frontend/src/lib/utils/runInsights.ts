export type RunInsightActionKey =
	| 'optimize'
	| 'walk_forward'
	| 'monte_carlo'
	| 'param_jitter'
	| 'cost_stress'
	| 'regime_split'
	| 'backtest_with_params';

export interface ComparableRunMetrics {
	id: string;
	resultType: string;
	annualizedReturnPct: number | null;
	totalReturnPct: number;
	sharpe: number;
	maxDrawdownPct: number | null;
	winRatePct: number | null;
	trades: number;
	profitFactor: number | null;
}

export interface RunComparisonInsight {
	sampleSize: number;
	sharpeRank: number;
	sharpePercentile: number;
	returnRank: number;
	returnPercentile: number;
	sharpeDeltaVsMedian: number | null;
	returnDeltaVsMedian: number | null;
	drawdownDeltaVsMedian: number | null;
}

export interface RunInsightAction {
	key: RunInsightActionKey;
	label: string;
	description: string;
	tone: 'primary' | 'secondary' | 'caution';
}

export function analyzeRunRelativePosition(
	current: ComparableRunMetrics,
	peers: ComparableRunMetrics[],
): RunComparisonInsight {
	const sample = [current, ...peers];
	const bySharpe = [...sample].sort((left, right) => right.sharpe - left.sharpe);
	const byReturn = [...sample].sort((left, right) => {
		const leftValue = left.annualizedReturnPct ?? left.totalReturnPct;
		const rightValue = right.annualizedReturnPct ?? right.totalReturnPct;
		return rightValue - leftValue;
	});

	const sharpeValues = sample.map((item) => item.sharpe).sort((left, right) => left - right);
	const returnValues = sample
		.map((item) => item.annualizedReturnPct ?? item.totalReturnPct)
		.sort((left, right) => left - right);
	const drawdownValues = sample
		.map((item) => item.maxDrawdownPct)
		.filter((value): value is number => value !== null && Number.isFinite(value))
		.sort((left, right) => left - right);

	const currentReturn = current.annualizedReturnPct ?? current.totalReturnPct;

	return {
		sampleSize: sample.length,
		sharpeRank: bySharpe.findIndex((item) => item.id === current.id) + 1,
		sharpePercentile: percentileRank(current.sharpe, sharpeValues),
		returnRank: byReturn.findIndex((item) => item.id === current.id) + 1,
		returnPercentile: percentileRank(currentReturn, returnValues),
		sharpeDeltaVsMedian: median(sharpeValues) === null ? null : round(current.sharpe - (median(sharpeValues) ?? 0), 2),
		returnDeltaVsMedian: median(returnValues) === null ? null : round(currentReturn - (median(returnValues) ?? 0), 2),
		drawdownDeltaVsMedian:
			current.maxDrawdownPct === null || median(drawdownValues) === null
				? null
				: round(current.maxDrawdownPct - (median(drawdownValues) ?? 0), 2),
	};
}

export function buildRunNarrative(
	current: ComparableRunMetrics,
	insight: RunComparisonInsight,
): string[] {
	const lines: string[] = [];

	if (current.sharpe >= 1.5 && (current.maxDrawdownPct ?? 100) <= 20) {
		lines.push('Risk-adjusted performance is strong enough to justify deeper validation instead of another blind baseline run.');
	} else if (current.sharpe < 1.0 && current.totalReturnPct > 0) {
		lines.push('Returns are positive, but the risk-adjusted profile is still noisy relative to the payoff you are taking on.');
	} else if (current.totalReturnPct <= 0) {
		lines.push('This run is not earning its keep yet; use it as a diagnostic baseline, not as a promotion candidate.');
	}

	if (current.trades < 20) {
		lines.push('Trade count is thin, so any strong Sharpe or return reading is still under-sampled.');
	} else if (current.trades >= 50) {
		lines.push('Sample size is substantial enough that follow-up robustness work should be more informative than another date tweak.');
	}

	if (insight.sampleSize > 1) {
		if (insight.sharpePercentile >= 75) {
			lines.push(`This run sits in roughly the top quartile of Sharpe within ${insight.sampleSize} comparable runs.`);
		} else if (insight.sharpePercentile <= 25) {
			lines.push(`Sharpe is lagging most comparable runs, which points to structure issues rather than just missing polish.`);
		}

		if (insight.drawdownDeltaVsMedian !== null && insight.drawdownDeltaVsMedian > 5) {
			lines.push('Drawdown is materially worse than the peer median, so the edge may still be relying on too much pain tolerance.');
		}
	}

	if (lines.length === 0) {
		lines.push('The profile is mixed. Use comparative follow-up tests to identify whether the edge is real, fragile, or regime-dependent.');
	}

	return lines.slice(0, 3);
}

export function recommendRunActions(
	current: ComparableRunMetrics,
): RunInsightAction[] {
	const resultType = String(current.resultType || '').trim().toLowerCase();

	if (resultType === 'optimization') {
		return [
			action('backtest_with_params', 'Run the Gauntlet with these params', 'Convert the optimized parameter set into a concrete baseline run.', 'primary'),
			action('walk_forward', 'Run walk-forward', 'Check whether the optimized edge survives rolling out-of-sample windows.', 'secondary'),
			action('param_jitter', 'Probe parameter stability', 'Test whether the optimum is sharp and fragile or broad enough to trust.', 'secondary'),
		];
	}

	if (resultType === 'walk_forward') {
		return [
			action('monte_carlo', 'Run Monte Carlo', 'Measure survival odds and tail outcomes on the same validated baseline.', 'primary'),
			action('regime_split', 'Split by regime', 'See where the edge is actually coming from instead of averaging it away.', 'secondary'),
			action('cost_stress', 'Stress execution costs', 'Find out whether the out-of-sample edge survives worse fills.', 'secondary'),
		];
	}

	const actions: RunInsightAction[] = [
		action('optimize', 'Optimize parameters', 'Search for a cleaner parameter pocket instead of hand-tuning inputs.', 'primary'),
		action('walk_forward', 'Run walk-forward', 'Validate that the baseline survives rolling out-of-sample segments.', 'secondary'),
		action('monte_carlo', 'Run Monte Carlo', 'Estimate payoff distribution and downside tails.', 'secondary'),
	];

	if ((current.maxDrawdownPct ?? 0) > 15) {
		actions.push(action('cost_stress', 'Stress execution costs', 'This drawdown profile warrants harsher fee and slippage assumptions.', 'caution'));
	}

	if (current.trades >= 20) {
		actions.push(action('regime_split', 'Analyze regimes', 'Break the PnL apart by market condition before trusting the aggregate.', 'secondary'));
	} else {
		actions.push(action('param_jitter', 'Probe stability', 'With a thin sample, parameter fragility matters more than more cosmetics.', 'caution'));
	}

	return actions.slice(0, 4);
}

function action(
	key: RunInsightActionKey,
	label: string,
	description: string,
	tone: RunInsightAction['tone'],
): RunInsightAction {
	return { key, label, description, tone };
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const midpoint = Math.floor(values.length / 2);
	if (values.length % 2 === 1) return values[midpoint];
	return (values[midpoint - 1] + values[midpoint]) / 2;
}

function percentileRank(value: number, sortedValues: number[]): number {
	if (sortedValues.length === 0) return 50;
	const lessThanOrEqual = sortedValues.filter((item) => item <= value).length;
	return round((lessThanOrEqual / sortedValues.length) * 100, 0);
}

function round(value: number, precision: number): number {
	const factor = 10 ** precision;
	return Math.round(value * factor) / factor;
}
