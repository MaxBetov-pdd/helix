import type { ParamSpec, Strategy } from './types';
import {
	asArray,
	asRecord,
	fetchApi,
	isNotFoundError,
	isRouteMissingError,
} from './core';

// Strategy endpoints
function normalizeStrategyParamDefault(value: unknown): string | number | boolean {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	return JSON.stringify(value ?? '');
}

function normalizeStrategyParameters(raw: unknown): Record<string, ParamSpec> {
	let source: Record<string, unknown> | null = null;
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw);
			source = asRecord(parsed);
		} catch {
			source = null;
		}
	} else {
		source = asRecord(raw);
	}
	if (!source) return {};

	const out: Record<string, ParamSpec> = {};
	for (const [key, value] of Object.entries(source)) {
		const spec = asRecord(value);
		if (spec && ('default' in spec || 'type' in spec)) {
			out[key] = {
				type: typeof spec.type === 'string' ? spec.type : typeof spec.default,
				default: normalizeStrategyParamDefault(spec.default),
				min: typeof spec.min === 'number' ? spec.min : undefined,
				max: typeof spec.max === 'number' ? spec.max : undefined,
				step: typeof spec.step === 'number' ? spec.step : undefined,
				options: Array.isArray(spec.options)
					? spec.options.filter((option): option is string => typeof option === 'string')
					: undefined,
			};
			continue;
		}
		out[key] = {
			type: typeof value,
			default: normalizeStrategyParamDefault(value),
		};
	}
	return out;
}

function normalizeStrategyRecord(raw: unknown): Strategy | null {
	const row = asRecord(raw);
	if (!row) return null;

	const name = String(row.name ?? row.id ?? '').trim();
	if (!name) return null;
	const apiName = String(row.api_name ?? row.id ?? name).trim() || name;
	const description = String(row.description ?? row.notes ?? '').trim()
		|| `${String(row.type ?? 'strategy')} strategy`;

	return {
		name,
		api_name: apiName,
		version: String(row.version ?? '1.0.0'),
		description,
		parameters: normalizeStrategyParameters(row.parameters ?? row.params),
	};
}

export function normalizeStrategyPayload(payload: unknown): { strategies: Strategy[] } {
	const fromObject = asRecord(payload);
	if (fromObject && Array.isArray(fromObject.strategies)) {
		const normalized = fromObject.strategies
			.map((row) => normalizeStrategyRecord(row))
			.filter((row): row is Strategy => Boolean(row));
		return { strategies: normalized };
	}

	if (Array.isArray(payload)) {
		const normalized = payload
			.map((row) => normalizeStrategyRecord(row))
			.filter((row): row is Strategy => Boolean(row));
		return { strategies: normalized };
	}

	return { strategies: [] };
}

export async function getStrategies(): Promise<{ strategies: Strategy[] }> {
	const payload = await fetchApi<unknown>('/strategies');
	return normalizeStrategyPayload(payload);
}

export async function getPrebuiltStrategies(): Promise<{ strategies: Strategy[] }> {
	const payload = await fetchApi<unknown>('/strategies/prebuilt');
	return normalizeStrategyPayload(payload);
}

export async function getStrategy(name: string): Promise<Strategy> {
	try {
		const payload = await fetchApi<unknown>(`/strategies/${encodeURIComponent(name)}`);
		const normalized = normalizeStrategyRecord(payload);
		if (normalized) return normalized;
		throw new Error('Invalid strategy payload');
	} catch (error) {
		if (!isNotFoundError(error)) throw error;
		const all = await getStrategies();
		const target = name.trim().toLowerCase();
		const fallback = all.strategies.find((strategy) => {
			const strategyName = strategy.name.toLowerCase();
			const strategyApiName = (strategy.api_name ?? strategy.name).toLowerCase();
			return strategyName === target || strategyApiName === target;
		});
		if (fallback) return fallback;
		throw error;
	}
}
