import { fetchApi } from './core';
import type { GauntletStatus } from './lifecycle';

export interface GauntletWorkflowResponse {
	ok: boolean;
	workflow_id: string;
	strategy_id: string;
	workflow?: Record<string, unknown>;
}

export interface GauntletResumeResponse {
	ok: boolean;
	workflow_id: string;
	steps_run: number;
	last_outcome?: Record<string, unknown> | null;
}

export async function getGauntletWorkflowStatus(strategyId: string): Promise<GauntletStatus> {
	return fetchApi(`/gauntlet/strategies/${encodeURIComponent(strategyId)}/status`);
}

export async function createGauntletWorkflow(strategyId: string): Promise<GauntletWorkflowResponse> {
	return fetchApi(`/gauntlet/strategies/${encodeURIComponent(strategyId)}/workflow`, {
		method: 'POST',
	});
}

export async function resumeGauntletWorkflow(workflowId: string, maxSteps = 1): Promise<GauntletResumeResponse> {
	const params = new URLSearchParams({ max_steps: String(maxSteps) });
	return fetchApi(`/gauntlet/workflows/${encodeURIComponent(workflowId)}/resume?${params}`, {
		method: 'POST',
	});
}

export async function retryGauntletStep(stepId: string): Promise<Record<string, unknown>> {
	return fetchApi(`/gauntlet/steps/${encodeURIComponent(stepId)}/retry`, {
		method: 'POST',
	});
}

export async function cancelGauntletWorkflow(workflowId: string, reason = ''): Promise<Record<string, unknown>> {
	const params = new URLSearchParams();
	if (reason.trim()) params.set('reason', reason.trim());
	return fetchApi(`/gauntlet/workflows/${encodeURIComponent(workflowId)}/cancel${params.size ? `?${params}` : ''}`, {
		method: 'POST',
	});
}
