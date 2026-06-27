import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmount } from 'svelte';

const apiMock = vi.hoisted(() => ({
	getCriticalHealthAlerts: vi.fn(),
}));

vi.mock('$lib/api/dashboard', () => apiMock);

import CriticalAlertsBanner from '../lib/components/dashboard/CriticalAlertsBanner.svelte';

let target: HTMLElement;
let instance: ReturnType<typeof mount> | null = null;

afterEach(() => {
	if (instance) {
		unmount(instance);
		instance = null;
	}
	target?.remove();
	apiMock.getCriticalHealthAlerts.mockReset();
});

async function flush(): Promise<void> {
	await Promise.resolve();
	await new Promise((r) => setTimeout(r, 0));
	await Promise.resolve();
}

function alert(component: string, message: string, timestamp = '2026-06-10T00:00:00+00:00') {
	return { severity: 'critical', component, message, timestamp, action_taken: '' };
}

function mountBanner() {
	target = document.createElement('div');
	document.body.appendChild(target);
	instance = mount(CriticalAlertsBanner, { target, props: {} });
}

describe('CriticalAlertsBanner', () => {
	it('renders nothing when there are no critical alerts', async () => {
		apiMock.getCriticalHealthAlerts.mockResolvedValue({ alerts: [], count: 0 });
		mountBanner();
		await flush();

		expect(target.querySelector('[data-testid="critical-alerts-banner"]')).toBeNull();
	});

	it('renders nothing when the endpoint fails (no fake alarms)', async () => {
		apiMock.getCriticalHealthAlerts.mockRejectedValue(new Error('offline'));
		mountBanner();
		await flush();

		expect(target.querySelector('[data-testid="critical-alerts-banner"]')).toBeNull();
	});

	it('shows count and latest message when critical alerts exist', async () => {
		apiMock.getCriticalHealthAlerts.mockResolvedValue({
			alerts: [
				alert('scheduler', 'Scheduler heartbeat lost'),
				alert('exchange', 'Hyperliquid account breaker open'),
			],
			count: 2,
		});
		mountBanner();
		await flush();

		const banner = target.querySelector('[data-testid="critical-alerts-banner"]');
		expect(banner).toBeTruthy();
		expect(
			target.querySelector('[data-testid="critical-alerts-count"]')?.textContent,
		).toContain('2 alerts');
		expect(banner?.textContent).toContain('Scheduler heartbeat lost');
		// Second alert hidden until expanded.
		expect(banner?.textContent).not.toContain('Hyperliquid account breaker open');
	});

	it('expands to list the remaining alerts', async () => {
		apiMock.getCriticalHealthAlerts.mockResolvedValue({
			alerts: [
				alert('scheduler', 'Scheduler heartbeat lost'),
				alert('exchange', 'Hyperliquid account breaker open'),
				alert('data', 'OHLCV feed stale'),
			],
			count: 3,
		});
		mountBanner();
		await flush();

		const toggle = target.querySelector<HTMLButtonElement>(
			'[data-testid="critical-alerts-toggle"]',
		);
		expect(toggle).toBeTruthy();
		expect(toggle?.textContent).toContain('+2 more');

		toggle!.click();
		await flush();

		const list = target.querySelector('[data-testid="critical-alerts-list"]');
		expect(list).toBeTruthy();
		expect(list?.textContent).toContain('Hyperliquid account breaker open');
		expect(list?.textContent).toContain('OHLCV feed stale');

		toggle!.click();
		await flush();
		expect(target.querySelector('[data-testid="critical-alerts-list"]')).toBeNull();
	});

	it('omits the expand toggle for a single alert', async () => {
		apiMock.getCriticalHealthAlerts.mockResolvedValue({
			alerts: [alert('scheduler', 'Scheduler heartbeat lost')],
			count: 1,
		});
		mountBanner();
		await flush();

		expect(target.querySelector('[data-testid="critical-alerts-banner"]')).toBeTruthy();
		expect(target.querySelector('[data-testid="critical-alerts-toggle"]')).toBeNull();
	});
});
