import { fetchApi } from './core';

export interface OperatorPreferences {
	notification_channels: string[];
	quiet_hours: string | null;
	risk_appetite: 'conservative' | 'balanced' | 'aggressive' | null;
	response_style: 'terse' | 'conversational' | 'verbose' | null;
}

export interface OperatorProfileStructured {
	name: string | null;
	timezone: string | null;
	starting_capital_usd: number | null;
	risk_per_trade_pct: number | null;
	exchange: string | null;
	asset_universe: string | null;
	preferences: OperatorPreferences;
	rules: string[];
}

export interface OperatorProfileResponse {
	exists: boolean;
	structured: OperatorProfileStructured | null;
	body: string;
	parse_error: string | null;
	has_structured: boolean;
}

export interface OperatorProfileUpdatePayload {
	structured?: Partial<OperatorProfileStructured>;
	body?: string;
}

export async function getProfile(): Promise<OperatorProfileResponse> {
	return fetchApi<OperatorProfileResponse>('/profile');
}

export async function putProfile(
	payload: OperatorProfileUpdatePayload
): Promise<OperatorProfileResponse> {
	return fetchApi<OperatorProfileResponse>('/profile', {
		method: 'PUT',
		body: JSON.stringify(payload),
		headers: { 'Content-Type': 'application/json' }
	});
}
