export function normalizeStrategyId(strategyId: unknown): string {
	return String(strategyId ?? '').trim();
}

export function buildStrategyHref(
	strategyId: unknown,
	options?: {
		returnTo?: string | null;
	}
): string {
	const normalizedId = normalizeStrategyId(strategyId);
	if (!normalizedId) return '';

	const base = `/lab/strategy/${encodeURIComponent(normalizedId)}`;
	const normalizedReturnTo = typeof options?.returnTo === 'string'
		? options.returnTo.trim()
		: '';
	return normalizedReturnTo
		? `${base}?returnTo=${encodeURIComponent(normalizedReturnTo)}`
		: base;
}
