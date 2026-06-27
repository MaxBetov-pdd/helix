import { writable } from 'svelte/store';
import type {
	HelixDashboardResponse,
	HelixRiskStatus,
	HelixRegimeSnapshot,
	HelixScannerState,
	HelixSentimentSnapshot,
	HelixTrade,
} from '$lib/api';

// Passive writable stores — populated by heartbeat.ts via the unified
// /api/system/heartbeat endpoint.  Individual pages that need a direct
// refresh can still call the original API functions and .set() here.

export const helixDashboard = writable<HelixDashboardResponse | null>(null);
export const helixRisk = writable<HelixRiskStatus | null>(null);
export const helixSentiment = writable<HelixSentimentSnapshot | null>(null);
export const helixRegime = writable<HelixRegimeSnapshot | null>(null);
export const helixOpenTrades = writable<HelixTrade[]>([]);
export const helixScannerState = writable<HelixScannerState | null>(null);
