export interface BackendDisconnectDecisionInput {
	wsStillConnected: boolean;
	consecutiveFailures: number;
	lastHealthyAt: number;
	now?: number;
	failureThreshold?: number;
	graceMs?: number;
}

export function shouldMarkBackendDisconnected({
	wsStillConnected,
	consecutiveFailures,
	lastHealthyAt,
	now = Date.now(),
	failureThreshold = 3,
	graceMs = 15_000,
}: BackendDisconnectDecisionInput): boolean {
	if (wsStillConnected) return false;
	if (consecutiveFailures < failureThreshold) return false;
	if (lastHealthyAt > 0 && now - lastHealthyAt < graceMs) return false;
	return true;
}
