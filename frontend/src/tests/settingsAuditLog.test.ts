import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSettingsAuditLog, type SettingsAuditEntry } from '$lib/api';

describe('getSettingsAuditLog', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('calls /api/settings/audit-log with limit param and returns parsed entries', async () => {
		(fetch as any).mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => [
				{ id: 'risk.max_daily_loss', from: 200, to: 150, at: '2026-04-17T10:00:00Z', actor: 'ui' }
			]
		});

		const log: SettingsAuditEntry[] = await getSettingsAuditLog(5);

		expect(fetch).toHaveBeenCalled();
		const calledUrl = (fetch as any).mock.calls[0][0];
		expect(calledUrl).toContain('/settings/audit-log');
		expect(calledUrl).toContain('limit=5');
		expect(log).toHaveLength(1);
		expect(log[0].id).toBe('risk.max_daily_loss');
		expect(log[0].to).toBe(150);
	});

	it('defaults to limit=5 when no argument passed', async () => {
		(fetch as any).mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => []
		});
		await getSettingsAuditLog();
		const calledUrl = (fetch as any).mock.calls[0][0];
		expect(calledUrl).toContain('limit=5');
	});
});
