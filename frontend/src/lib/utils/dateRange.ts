import { timeframeToMilliseconds } from '$lib/config/timeframes';

export type DateRangePresetId =
	| '1m'
	| '3m'
	| '6m'
	| '1y'
	| '2y'
	| '3y'
	| '5y'
	| 'ytd'
	| 'max'
	| 'custom';

export interface DateRangePreset {
	id: Exclude<DateRangePresetId, 'custom'>;
	label: string;
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
	{ id: '1m', label: '1M' },
	{ id: '3m', label: '3M' },
	{ id: '6m', label: '6M' },
	{ id: '1y', label: '1Y' },
	{ id: '2y', label: '2Y' },
	{ id: '3y', label: '3Y' },
	{ id: '5y', label: '5Y' },
	{ id: 'ytd', label: 'YTD' },
];

export interface ResolvedDateRange {
	startDate: string;
	endDate: string;
}

function toUtcDate(value?: Date): Date {
	const source = value ? new Date(value) : new Date();
	return new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate()));
}

function formatInputDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function shiftMonths(anchor: Date, months: number): Date {
	const shifted = new Date(anchor.getTime());
	shifted.setUTCMonth(shifted.getUTCMonth() - months);
	return shifted;
}

function shiftYears(anchor: Date, years: number): Date {
	const shifted = new Date(anchor.getTime());
	shifted.setUTCFullYear(shifted.getUTCFullYear() - years);
	return shifted;
}

function parseInputDate(value: string | null | undefined): Date | null {
	const normalized = String(value ?? '').trim();
	if (!normalized) return null;
	const parsed = new Date(`${normalized}T00:00:00Z`);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function rangeMatches(left: string, right: string): boolean {
	return left === right;
}

export function resolveDateRangePreset(
	presetId: Exclude<DateRangePresetId, 'custom'>,
	options: {
		anchorDate?: Date;
		minDate?: string | null;
		maxDate?: string | null;
	} = {},
): ResolvedDateRange {
	const anchor = options.maxDate ? parseInputDate(options.maxDate) ?? toUtcDate(options.anchorDate) : toUtcDate(options.anchorDate);
	const endDate = formatInputDate(anchor);

	switch (presetId) {
		case '1m':
			return { startDate: formatInputDate(shiftMonths(anchor, 1)), endDate };
		case '3m':
			return { startDate: formatInputDate(shiftMonths(anchor, 3)), endDate };
		case '6m':
			return { startDate: formatInputDate(shiftMonths(anchor, 6)), endDate };
		case '1y':
			return { startDate: formatInputDate(shiftYears(anchor, 1)), endDate };
		case '2y':
			return { startDate: formatInputDate(shiftYears(anchor, 2)), endDate };
		case '3y':
			return { startDate: formatInputDate(shiftYears(anchor, 3)), endDate };
		case '5y':
			return { startDate: formatInputDate(shiftYears(anchor, 5)), endDate };
		case 'ytd':
			return { startDate: `${anchor.getUTCFullYear()}-01-01`, endDate };
		case 'max':
			return { startDate: String(options.minDate ?? '').trim(), endDate };
	}
}

export function inferDateRangePreset(
	startDate: string | null | undefined,
	endDate: string | null | undefined,
	options: {
		anchorDate?: Date;
		minDate?: string | null;
		maxDate?: string | null;
	} = {},
): DateRangePresetId {
	const normalizedStart = String(startDate ?? '').trim();
	const normalizedEnd = String(endDate ?? '').trim();
	if (!normalizedStart && !normalizedEnd) return 'custom';

	if (normalizedStart && normalizedEnd && options.minDate) {
		const maxRange = resolveDateRangePreset('max', options);
		if (rangeMatches(normalizedStart, maxRange.startDate) && rangeMatches(normalizedEnd, maxRange.endDate)) {
			return 'max';
		}
	}

	for (const preset of DATE_RANGE_PRESETS) {
		const resolved = resolveDateRangePreset(preset.id, options);
		if (rangeMatches(normalizedStart, resolved.startDate) && rangeMatches(normalizedEnd, resolved.endDate)) {
			return preset.id;
		}
	}

	return 'custom';
}

export function estimateBarCount(
	startDate: string | null | undefined,
	endDate: string | null | undefined,
	timeframe: string | null | undefined,
): number | null {
	const start = parseInputDate(startDate);
	const end = parseInputDate(endDate);
	const intervalMs = timeframeToMilliseconds(timeframe);
	if (!start || !end || !intervalMs) return null;
	const durationMs = end.getTime() - start.getTime();
	if (durationMs < 0) return null;
	return Math.max(1, Math.floor(durationMs / intervalMs) + 1);
}

export function formatBarEstimate(value: number | null): string {
	if (value === null || !Number.isFinite(value) || value < 1) return '--';
	return `~${Math.round(value).toLocaleString()} bars`;
}

export function formatDateWindowSummary(
	startDate: string | null | undefined,
	endDate: string | null | undefined,
): string {
	const start = parseInputDate(startDate);
	const end = parseInputDate(endDate);
	if (!start || !end) return 'Custom window';

	const diffDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
	if (diffDays >= 365 * 2) {
		return `${(diffDays / 365).toFixed(diffDays >= 365 * 5 ? 0 : 1)} years`;
	}
	if (diffDays >= 90) {
		return `${Math.max(1, Math.round(diffDays / 30.4375))} months`;
	}
	if (diffDays >= 14) {
		return `${Math.max(1, Math.round(diffDays / 7))} weeks`;
	}
	return `${Math.max(1, diffDays)} days`;
}
