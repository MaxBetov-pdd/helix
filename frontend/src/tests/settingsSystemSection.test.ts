import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { mount, unmount } from 'svelte';
import { get } from 'svelte/store';
import SettingsSystem from '../lib/components/settings/sections/SettingsSystem.svelte';
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

describe('SettingsSystem section', () => {
	it('renders the expected system subsections from the manifest', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSystem, {
			target,
			props: {
				settings: {
					self_healing_enabled: true,
					auto_restart_on_crash: true,
				},
			},
		});
		await flush();

		const text = target.textContent || '';
		expect(text).toContain('Remote engine');
		expect(text).toContain('Health & telemetry');
	});

	it('seeds originalValues on mount from the flat settings blob', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSystem, {
			target,
			props: {
				settings: {
					remote_engine_enabled: true,
				},
			},
		});
		await flush();

		const originals = get(originalValues);
		expect(originals['bot-operations.remote_engine_enabled']).toBe(true);
	});
});
