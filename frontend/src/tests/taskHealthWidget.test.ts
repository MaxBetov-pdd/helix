import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmount } from 'svelte';

const apiMock = vi.hoisted(() => ({
	getTaskHealth: vi.fn(),
}));

vi.mock('$lib/api/dashboard', () => apiMock);

import TaskHealthWidget from '../lib/components/dashboard/TaskHealthWidget.svelte';

let target: HTMLElement;
let instance: ReturnType<typeof mount> | null = null;

afterEach(() => {
	if (instance) {
		unmount(instance);
		instance = null;
	}
	target?.remove();
	apiMock.getTaskHealth.mockReset();
});

async function flush(): Promise<void> {
	await Promise.resolve();
	await new Promise((r) => setTimeout(r, 0));
	await Promise.resolve();
}

function buildHealth(overrides: Partial<Record<string, number>> = {}, status = 'ok', issues: string[] = []) {
	return {
		status,
		issues,
		queues: {
			agent_pending: 4,
			agent_running: 2,
			agent_stale_pending: 0,
			agent_stale_running: 0,
			brain_pending: 1,
			brain_running: 1,
			brain_stale_pending: 0,
			brain_stale_running: 0,
			...overrides,
		},
		long_running_scheduler_jobs: 0,
		overdue_due_scheduler_jobs: 0,
	};
}

function mountWidget() {
	target = document.createElement('div');
	document.body.appendChild(target);
	instance = mount(TaskHealthWidget, { target, props: {} });
}

describe('TaskHealthWidget', () => {
	it('renders combined queued/running depth across agent and brain queues', async () => {
		apiMock.getTaskHealth.mockResolvedValue(buildHealth());
		mountWidget();
		await flush();

		expect(target.querySelector('[data-testid="task-health-queued"]')?.textContent?.trim()).toBe('5');
		expect(target.querySelector('[data-testid="task-health-running"]')?.textContent?.trim()).toBe('3');
		expect(target.querySelector('[data-testid="task-health-stale-pending"]')?.textContent?.trim()).toBe('0');
		expect(target.querySelector('[data-testid="task-health-stale-running"]')?.textContent?.trim()).toBe('0');
		expect(target.querySelector('[data-testid="task-health-status"]')?.textContent?.trim()).toBe('ok');
	});

	it('highlights stale counts in warning color when stale > 0', async () => {
		apiMock.getTaskHealth.mockResolvedValue(
			buildHealth(
				{ agent_stale_pending: 2, brain_stale_running: 1 },
				'degraded',
				['agent_stale_pending=2', 'brain_stale_running=1'],
			),
		);
		mountWidget();
		await flush();

		const stalePending = target.querySelector('[data-testid="task-health-stale-pending"]');
		const staleRunning = target.querySelector('[data-testid="task-health-stale-running"]');
		expect(stalePending?.textContent?.trim()).toBe('2');
		expect(staleRunning?.textContent?.trim()).toBe('1');
		expect(stalePending?.classList.contains('stat-value--warn')).toBe(true);
		expect(staleRunning?.classList.contains('stat-value--warn')).toBe(true);

		const status = target.querySelector('[data-testid="task-health-status"]');
		expect(status?.textContent?.trim()).toBe('degraded');
		expect(status?.classList.contains('status-pill--warn')).toBe(true);

		const issues = target.querySelector('[data-testid="task-health-issues"]');
		expect(issues?.textContent).toContain('agent_stale_pending=2');
		expect(issues?.textContent).toContain('(+1)');
	});

	it('does not flag warning style when stale counts are zero', async () => {
		apiMock.getTaskHealth.mockResolvedValue(buildHealth());
		mountWidget();
		await flush();

		const stalePending = target.querySelector('[data-testid="task-health-stale-pending"]');
		expect(stalePending?.classList.contains('stat-value--warn')).toBe(false);
		expect(target.querySelector('[data-testid="task-health-issues"]')).toBeNull();
	});

	it('degrades to an error message when the endpoint fails', async () => {
		apiMock.getTaskHealth.mockRejectedValue(new Error('health endpoint down'));
		mountWidget();
		await flush();

		const error = target.querySelector('[data-testid="task-health-error"]');
		expect(error).toBeTruthy();
		expect(error?.textContent).toContain('health endpoint down');
	});
});
