import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../lib/api';
import {
	archiveHypothesis,
	bulkArchiveHypotheses,
	bulkRestoreHypotheses,
	bulkTrashHypotheses,
	discoverCrucibles,
	getHypothesisDetail,
	getHypotheses,
	getRankedDataGaps,
	restoreHypothesis,
	trashHypothesis,
} from '../lib/api/hypotheses';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('hypotheses api client', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('exports hypothesis helpers from the dedicated client and the API barrel', () => {
		expect(typeof getHypotheses).toBe('function');
		expect(typeof getHypothesisDetail).toBe('function');
		expect(typeof getRankedDataGaps).toBe('function');
		expect(typeof archiveHypothesis).toBe('function');
		expect(typeof trashHypothesis).toBe('function');
		expect(typeof restoreHypothesis).toBe('function');
		expect(typeof bulkArchiveHypotheses).toBe('function');
		expect(typeof bulkTrashHypotheses).toBe('function');
		expect(typeof bulkRestoreHypotheses).toBe('function');
		expect(typeof api.getHypotheses).toBe('function');
		expect(typeof api.getHypothesisDetail).toBe('function');
		expect(typeof api.getRankedDataGaps).toBe('function');
		expect(typeof api.archiveHypothesis).toBe('function');
		expect(typeof api.trashHypothesis).toBe('function');
		expect(typeof api.restoreHypothesis).toBe('function');
		expect(typeof api.bulkArchiveHypotheses).toBe('function');
		expect(typeof api.bulkTrashHypotheses).toBe('function');
		expect(typeof api.bulkRestoreHypotheses).toBe('function');
		expect(typeof discoverCrucibles).toBe('function');
		expect(typeof api.discoverCrucibles).toBe('function');
	});

	it('discoverCrucibles POSTs to the discover endpoint', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ created: true, mode: 'operator_approves', task_id: 7 }),
		});

		const res = await discoverCrucibles();

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/hypotheses/discover',
			expect.objectContaining({ method: 'POST' }),
		);
		expect(res.created).toBe(true);
	});

	it('requests filtered hypotheses with a query string', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ hypotheses: [] }),
		});

		await getHypotheses({ lane: 'exploration', status: 'proposed' });

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/hypotheses?lane=exploration&status=proposed',
			expect.anything(),
		);
	});

	it('requests hypotheses with manager filters and search', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ hypotheses: [] }),
		});

		await getHypotheses({
			view: 'archived',
			lane: 'exploration',
			search: 'funding',
			sort: 'updated_desc',
		});

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/hypotheses?view=archived&lane=exploration&search=funding&sort=updated_desc',
			expect.anything(),
		);
	});

	it('requests the ranked data-gap leaderboard with an explicit limit', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ items: [] }),
		});

		await getRankedDataGaps(5);

		expect(mockFetch).toHaveBeenCalledWith('/api/data-gaps?limit=5', expect.anything());
	});

	it('posts archive, trash, restore, and bulk lifecycle requests', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ hypothesis: { id: 'HYP-1' }, hypotheses: [] }),
		});

		await archiveHypothesis('HYP-1');
		await trashHypothesis('HYP-1');
		await restoreHypothesis('HYP-1');
		await bulkArchiveHypotheses(['HYP-1', 'H00002']);
		await bulkTrashHypotheses(['HYP-1']);
		await bulkRestoreHypotheses(['H00002']);

		expect(mockFetch).toHaveBeenNthCalledWith(
			1,
			'/api/hypotheses/HYP-1/archive',
			expect.objectContaining({ method: 'POST' }),
		);
		expect(mockFetch).toHaveBeenNthCalledWith(
			2,
			'/api/hypotheses/HYP-1/trash',
			expect.objectContaining({ method: 'POST' }),
		);
		expect(mockFetch).toHaveBeenNthCalledWith(
			3,
			'/api/hypotheses/HYP-1/restore',
			expect.objectContaining({ method: 'POST' }),
		);
		expect(mockFetch).toHaveBeenNthCalledWith(
			4,
			'/api/hypotheses/bulk/archive',
			expect.objectContaining({ method: 'POST', body: JSON.stringify({ ids: ['HYP-1', 'H00002'] }) }),
		);
		expect(mockFetch).toHaveBeenNthCalledWith(
			5,
			'/api/hypotheses/bulk/trash',
			expect.objectContaining({ method: 'POST', body: JSON.stringify({ ids: ['HYP-1'] }) }),
		);
		expect(mockFetch).toHaveBeenNthCalledWith(
			6,
			'/api/hypotheses/bulk/restore',
			expect.objectContaining({ method: 'POST', body: JSON.stringify({ ids: ['H00002'] }) }),
		);
	});
});
