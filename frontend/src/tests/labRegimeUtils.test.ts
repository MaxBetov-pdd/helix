import { describe, expect, it } from 'vitest';

import {
	formatRegimeLabel,
	isRegimeUncertain,
	regimeBadgeClass,
	regimeSwatchClass,
	summarizeTimelineReturn,
} from '$lib/utils/labRegime';

describe('labRegime utils', () => {
	it('formats core regime labels cleanly', () => {
		expect(formatRegimeLabel('TREND_UP')).toBe('TREND UP');
		expect(formatRegimeLabel('HIGH_VOL')).toBe('HIGH VOL');
	});

	it('treats overlay and uncertain-share signals as uncertainty', () => {
		expect(isRegimeUncertain({ regime: 'RANGE', uncertain: true })).toBe(true);
		expect(isRegimeUncertain({ regime: 'RANGE', overlay_regime: 'TRANSITION' })).toBe(true);
		expect(isRegimeUncertain({ regime: 'RANGE', uncertain_share: 0.12 })).toBe(true);
		expect(isRegimeUncertain({ regime: 'RANGE', uncertain_share: 0 })).toBe(false);
	});

	it('adds the expected tone classes for uncertain regimes', () => {
		expect(regimeBadgeClass({ regime: 'HIGH_VOL' })).toContain('fuchsia');
		expect(regimeSwatchClass({ regime: 'TREND_DOWN', uncertain: true })).toContain('amber');
	});

	it('summarizes final timeline return', () => {
		const points = [
			{ return_pct: 0 },
			{ return_pct: 8 },
			{ return_pct: -3 },
		];
		expect(summarizeTimelineReturn(points)).toBe(-3);
	});
});
