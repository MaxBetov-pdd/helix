import { describe, expect, it } from 'vitest';

import { shouldMarkBackendDisconnected } from '../lib/utils/connectionHealth';

describe('connection health disconnect threshold', () => {
	it('does not mark disconnected while websocket is still connected', () => {
		expect(
			shouldMarkBackendDisconnected({
				wsStillConnected: true,
				consecutiveFailures: 10,
				lastHealthyAt: 0,
				now: 20_000,
			})
		).toBe(false);
	});

	it('waits for multiple failures before marking disconnected', () => {
		expect(
			shouldMarkBackendDisconnected({
				wsStillConnected: false,
				consecutiveFailures: 1,
				lastHealthyAt: 0,
				now: 20_000,
			})
		).toBe(false);
		expect(
			shouldMarkBackendDisconnected({
				wsStillConnected: false,
				consecutiveFailures: 2,
				lastHealthyAt: 0,
				now: 20_000,
			})
		).toBe(false);
		expect(
			shouldMarkBackendDisconnected({
				wsStillConnected: false,
				consecutiveFailures: 3,
				lastHealthyAt: 0,
				now: 20_000,
			})
		).toBe(true);
	});

	it('keeps the app out of disconnected during the recent healthy grace window', () => {
		expect(
			shouldMarkBackendDisconnected({
				wsStillConnected: false,
				consecutiveFailures: 3,
				lastHealthyAt: 10_000,
				now: 20_000,
				graceMs: 15_000,
			})
		).toBe(false);
	});
});
