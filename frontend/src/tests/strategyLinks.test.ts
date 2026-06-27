import { describe, it, expect } from 'vitest';
import { buildStrategyHref, normalizeStrategyId } from '../lib/utils/strategyLinks';

describe('strategyLinks', () => {
	it('normalizes strategy ids', () => {
		expect(normalizeStrategyId(' S00042 ')).toBe('S00042');
		expect(normalizeStrategyId(null)).toBe('');
	});

	it('builds /lab/strategy/[id] hrefs for valid ids', () => {
		const href = buildStrategyHref('S00042');
		expect(href).toBe('/lab/strategy/S00042');
		expect(href.startsWith('/lab/strategy/')).toBe(true);
	});

	it('encodes strategy id and returnTo values', () => {
		const href = buildStrategyHref('S 42/alpha', { returnTo: '/lab?tab=247&stage=backtesting' });
		expect(href).toBe('/lab/strategy/S%2042%2Falpha?returnTo=%2Flab%3Ftab%3D247%26stage%3Dbacktesting');
	});

	it('returns empty href for missing ids', () => {
		expect(buildStrategyHref('')).toBe('');
		expect(buildStrategyHref(undefined)).toBe('');
	});
});
