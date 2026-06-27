import { describe, expect, it } from 'vitest';

import {
	areParameterRecordsEqual,
	detectParameterValueKind,
	parseParameterValue,
	serializeParameterValue,
	stableStringify,
} from '../lib/utils/parameterEditor';

describe('parameterEditor utils', () => {
	it('detects parameter kinds correctly', () => {
		expect(detectParameterValueKind(14)).toBe('number');
		expect(detectParameterValueKind(true)).toBe('boolean');
		expect(detectParameterValueKind('ema_cross')).toBe('string');
		expect(detectParameterValueKind({ fast: 12, slow: 26 })).toBe('json');
	});

	it('parses numbers and json with validation', () => {
		expect(parseParameterValue('12.5', 'number')).toEqual({ value: 12.5, error: null });
		expect(parseParameterValue('abc', 'number').error).toBeTruthy();
		expect(parseParameterValue('{"fast":12}', 'json')).toEqual({ value: { fast: 12 }, error: null });
		expect(parseParameterValue('{oops', 'json').error).toMatch(/Invalid JSON/i);
	});

	it('does not silently coerce empty or whitespace numbers to zero', () => {
		// Empty string would coerce to 0 via Number('') — must surface an error instead.
		const empty = parseParameterValue('', 'number');
		expect(empty.error).toBeTruthy();
		expect(empty.value).not.toBe(0);

		// Whitespace-only is likewise rejected (Number('   ') is also 0).
		const whitespace = parseParameterValue('   ', 'number');
		expect(whitespace.error).toBeTruthy();
		expect(whitespace.value).not.toBe(0);

		// A genuine zero is still accepted with no error.
		expect(parseParameterValue('0', 'number')).toEqual({ value: 0, error: null });
	});

	it('parses integers and decimals, tolerating surrounding whitespace', () => {
		expect(parseParameterValue('14', 'number')).toEqual({ value: 14, error: null });
		expect(parseParameterValue('14.5', 'number')).toEqual({ value: 14.5, error: null });
		expect(parseParameterValue('-3', 'number')).toEqual({ value: -3, error: null });
		// Leading/trailing whitespace around a real number is trimmed, not rejected.
		expect(parseParameterValue('  7  ', 'number')).toEqual({ value: 7, error: null });
		expect(parseParameterValue(' 2.25 ', 'number')).toEqual({ value: 2.25, error: null });
	});

	it('compares records using stable sorted json semantics', () => {
		const left = { slow: 26, fast: 12, flags: { enabled: true, mode: 'aggressive' } };
		const right = { fast: 12, flags: { mode: 'aggressive', enabled: true }, slow: 26 };
		expect(stableStringify(left)).toBe(stableStringify(right));
		expect(areParameterRecordsEqual(left, right)).toBe(true);
		expect(serializeParameterValue({ fast: 12 })).toContain('"fast": 12');
	});
});
