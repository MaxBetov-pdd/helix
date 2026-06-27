import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { mount, unmount } from 'svelte';
import { get } from 'svelte/store';
import SettingsNotifications from '../lib/components/settings/sections/SettingsNotifications.svelte';
import { originalValues, clearDirty } from '../lib/settings/dirty';

let target: HTMLElement;
let instance: any;

afterEach(() => {
	if (instance) unmount(instance);
	target?.remove();
});

beforeEach(() => {
	clearDirty();
	originalValues.set({});
});

async function flush(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await new Promise((r) => setTimeout(r, 0));
	await Promise.resolve();
}

describe('SettingsNotifications section', () => {
	it('renders the expected notifications subsections from the manifest', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsNotifications, {
			target,
			props: {
				settings: {
					discord_bot_token: 'token-x',
					notification_level: 'all',
				},
			},
		});
		await flush();

		const text = target.textContent || '';
		expect(text).toContain('Discord transport');
		expect(text).toContain('Event subscriptions');
		expect(text).toContain('Delivery policy');
	});

	it('seeds originalValues on mount from the flat settings blob', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsNotifications, {
			target,
			props: {
				settings: {
					discord_bot_token: 'token-x',
				},
			},
		});
		await flush();

		const originals = get(originalValues);
		expect(originals['notifications.discord_bot_token']).toBe('token-x');
	});
});
