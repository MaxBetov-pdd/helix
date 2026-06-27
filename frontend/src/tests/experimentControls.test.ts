import { describe, expect, it } from 'vitest';

import { ORDERED_TIMEFRAME_OPTIONS, getTimeframeLabel } from '../lib/config/timeframes';
import {
	estimateBarCount,
	formatBarEstimate,
	inferDateRangePreset,
	resolveDateRangePreset,
} from '../lib/utils/dateRange';

describe('experiment control configuration', () => {
	it('keeps timeframe options ordered from fastest to slowest', () => {
		expect(ORDERED_TIMEFRAME_OPTIONS.map((option) => option.value)).toEqual([
			'1m',
			'5m',
			'15m',
			'30m',
			'1h',
			'4h',
			'1d',
			'1w',
		]);
		expect(getTimeframeLabel('4h')).toBe('4 hours');
	});

	it('resolves one-year presets against an explicit anchor date', () => {
		expect(
			resolveDateRangePreset('1y', {
				maxDate: '2026-03-07',
			}),
		).toEqual({
			startDate: '2025-03-07',
			endDate: '2026-03-07',
		});
	});

	it('infers presets and estimates bar counts for shared lab windows', () => {
		expect(
			inferDateRangePreset('2025-09-07', '2026-03-07', {
				maxDate: '2026-03-07',
			}),
		).toBe('6m');
		expect(estimateBarCount('2026-03-01', '2026-03-07', '1d')).toBe(7);
		expect(formatBarEstimate(1095)).toBe('~1,095 bars');
	});
});
