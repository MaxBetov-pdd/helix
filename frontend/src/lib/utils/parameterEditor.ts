export type ParameterValueKind = 'number' | 'boolean' | 'string' | 'json';

export function detectParameterValueKind(value: unknown): ParameterValueKind {
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	if (value !== null && typeof value === 'object') return 'json';
	return 'string';
}

export function cloneParameterRecord(value: Record<string, unknown>): Record<string, unknown> {
	return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function stableStringify(value: unknown): string {
	return JSON.stringify(sortValue(value));
}

export function areParameterRecordsEqual(
	left: Record<string, unknown>,
	right: Record<string, unknown>,
): boolean {
	return stableStringify(left) === stableStringify(right);
}

export function serializeParameterValue(value: unknown): string {
	const kind = detectParameterValueKind(value);
	if (kind === 'json') return JSON.stringify(value, null, 2);
	if (kind === 'boolean') return value ? 'true' : 'false';
	if (value === null || value === undefined) return '';
	return String(value);
}

export function parseParameterValue(
	raw: string,
	kind: ParameterValueKind,
): { value: unknown; error: string | null } {
	if (kind === 'number') {
		// `Number('')` and `Number('   ')` both coerce to 0, which would silently
		// rewrite the parameter to zero when the field is cleared. Treat empty /
		// whitespace-only input as a validation error instead of emitting 0.
		const trimmed = raw.trim();
		if (trimmed === '') {
			return { value: raw, error: 'Enter a number — empty values are not allowed.' };
		}
		const parsed = Number(trimmed);
		if (!Number.isFinite(parsed)) {
			return { value: raw, error: 'Expected a valid number.' };
		}
		return { value: parsed, error: null };
	}

	if (kind === 'json') {
		try {
			return {
				value: JSON.parse(raw),
				error: null,
			};
		} catch {
			return {
				value: raw,
				error: 'Invalid JSON. Fix the structure before saving.',
			};
		}
	}

	return { value: raw, error: null };
}

function sortValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map((entry) => sortValue(entry));
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, entryValue]) => [key, sortValue(entryValue)]),
		);
	}
	return value;
}
