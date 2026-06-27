export interface TimeframeOption {
	value: string;
	label: string;
	minutes: number;
}

export const ORDERED_TIMEFRAME_OPTIONS: TimeframeOption[] = [
	{ value: '1m', label: '1 minute', minutes: 1 },
	{ value: '5m', label: '5 minutes', minutes: 5 },
	{ value: '15m', label: '15 minutes', minutes: 15 },
	{ value: '30m', label: '30 minutes', minutes: 30 },
	{ value: '1h', label: '1 hour', minutes: 60 },
	{ value: '4h', label: '4 hours', minutes: 240 },
	{ value: '1d', label: '1 day', minutes: 1440 },
	{ value: '1w', label: '1 week', minutes: 10080 },
];

export const ORDERED_TIMEFRAME_VALUES = ORDERED_TIMEFRAME_OPTIONS.map((option) => option.value);

export function getTimeframeOption(value: string | null | undefined): TimeframeOption | null {
	const normalized = String(value ?? '').trim().toLowerCase();
	return ORDERED_TIMEFRAME_OPTIONS.find((option) => option.value === normalized) ?? null;
}

export function getTimeframeLabel(value: string | null | undefined): string {
	return getTimeframeOption(value)?.label ?? String(value ?? '').trim();
}

export function timeframeToMilliseconds(value: string | null | undefined): number | null {
	const option = getTimeframeOption(value);
	if (!option) return null;
	return option.minutes * 60 * 1000;
}
