import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';

import ActivityStream from '../lib/components/dashboard/ActivityStream.svelte';
import type { DashboardActivityItem } from '$lib/api';

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
}));

vi.mock('$lib/components/ui/StrategyLink.svelte', async () => ({
	default: (await import('./fixtures/Stub.svelte')).default,
}));

type MountedComponent = ReturnType<typeof mount>;

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
}

function makeItem(overrides: Partial<DashboardActivityItem>): DashboardActivityItem {
	return {
		type: 'task',
		id: overrides.id ?? 'test-id',
		ts: overrides.ts ?? '',
		title: overrides.title ?? 'sample activity',
		detail: overrides.detail ?? '',
		strategy_id: overrides.strategy_id,
		...overrides,
	} as DashboardActivityItem;
}

describe('ActivityStream timestamp rendering', () => {
	let app: MountedComponent | null = null;
	let target: HTMLDivElement;

	beforeEach(() => {
		target = document.createElement('div');
		document.body.appendChild(target);
	});

	afterEach(() => {
		if (app) {
			unmount(app);
			app = null;
		}
		target.remove();
		vi.clearAllMocks();
	});

	it('renders em-dash fallback instead of "Invalid Date" for an empty timestamp', async () => {
		app = mount(ActivityStream, {
			target,
			props: {
				items: [makeItem({ id: 'empty-ts', ts: '', title: 'empty timestamp' })],
			},
		});

		await flush();

		expect(target.textContent).not.toContain('Invalid Date');
		expect(target.textContent).toContain('—');
		expect(target.textContent).toContain('empty timestamp');
	});

	it('renders em-dash fallback for an unparseable timestamp string', async () => {
		app = mount(ActivityStream, {
			target,
			props: {
				items: [makeItem({ id: 'garbage-ts', ts: 'not-a-real-date', title: 'bad timestamp' })],
			},
		});

		await flush();

		expect(target.textContent).not.toContain('Invalid Date');
		expect(target.textContent).toContain('—');
	});

	it('renders em-dash fallback when the field is undefined (genuinely missing)', async () => {
		// Simulate a backend payload where ts was never populated.
		const rawItem = {
			type: 'transition',
			id: 'missing-ts',
			title: 'missing timestamp',
			detail: '',
		} as unknown as DashboardActivityItem;

		app = mount(ActivityStream, {
			target,
			props: { items: [rawItem] },
		});

		await flush();

		expect(target.textContent).not.toContain('Invalid Date');
		expect(target.textContent).toContain('—');
	});

	it('still formats a valid ISO timestamp', async () => {
		app = mount(ActivityStream, {
			target,
			props: {
				items: [makeItem({ id: 'good-ts', ts: '2026-04-17T15:30:45Z', title: 'good timestamp' })],
			},
		});

		await flush();

		expect(target.textContent).not.toContain('Invalid Date');
		expect(target.textContent).not.toContain('—');
		// Locale-dependent, so just assert it looks like a time (contains a colon between digits).
		expect(target.textContent).toMatch(/\d{1,2}:\d{2}/);
	});
});
