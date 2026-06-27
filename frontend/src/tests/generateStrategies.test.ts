import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchApiMock = vi.fn();
vi.mock('../lib/api/core', () => ({
	ACTIVE_API_BASE: 'http://127.0.0.1:8003/api',
	API_BASE: 'http://127.0.0.1:8003/api',
	fetchApi: (...args: unknown[]) => fetchApiMock(...args),
}));

import { generateHypothesisStrategies } from '$lib/api/hypotheses';

describe('generateHypothesisStrategies', () => {
	beforeEach(() => {
		fetchApiMock.mockReset();
	});

	it('POSTs to /hypotheses/{id}/generate-strategies', async () => {
		fetchApiMock.mockResolvedValue({ ok: true, task: { task_id: 123 }, already_running: false });

		const res = await generateHypothesisStrategies('HYP-abc');

		expect(fetchApiMock).toHaveBeenCalledWith(
			'/hypotheses/HYP-abc/generate-strategies',
			{ method: 'POST', body: JSON.stringify({ force: false }) },
		);
		expect(res.already_running).toBe(false);
		expect(res.task?.task_id).toBe(123);
	});

	it('url-encodes the id', async () => {
		fetchApiMock.mockResolvedValue({ ok: true, task: null, already_running: false });
		await generateHypothesisStrategies('HYP with space');
		expect(fetchApiMock).toHaveBeenCalledWith(
			'/hypotheses/HYP%20with%20space/generate-strategies',
			{ method: 'POST', body: JSON.stringify({ force: false }) },
		);
	});

	it('passes force: true when requested', async () => {
		fetchApiMock.mockResolvedValue({ ok: true, task: { task_id: 42 }, already_running: false });
		await generateHypothesisStrategies('HYP-abc', { force: true });
		expect(fetchApiMock).toHaveBeenCalledWith(
			'/hypotheses/HYP-abc/generate-strategies',
			{ method: 'POST', body: JSON.stringify({ force: true }) },
		);
	});
});
