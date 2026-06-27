import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import { searchSettings } from '../lib/settings/search';

const entries = [
	{
		id: 'risk.max_daily_loss',
		label: 'Max daily loss',
		description: 'daily loss before block',
		area: 'trading',
		subsection: 'risk-loss-limits',
	},
	{
		id: 'agents.model_policy',
		label: 'Default model',
		description: 'Default model used by agents',
		area: 'agents',
		subsection: 'agents-model-policy',
	},
] as any;

describe('searchSettings', () => {
	it('matches by label', () => {
		const hits = searchSettings(entries, 'max daily');
		expect(hits).toHaveLength(1);
		expect(hits[0].id).toBe('risk.max_daily_loss');
	});

	it('matches by id', () => {
		const hits = searchSettings(entries, 'model_policy');
		expect(hits).toHaveLength(1);
		expect(hits[0].id).toBe('agents.model_policy');
	});

	it('matches by description', () => {
		const hits = searchSettings(entries, 'before block');
		expect(hits).toHaveLength(1);
		expect(hits[0].id).toBe('risk.max_daily_loss');
	});

	it('is case-insensitive', () => {
		const hits = searchSettings(entries, 'MAX DAILY');
		expect(hits).toHaveLength(1);
		expect(hits[0].id).toBe('risk.max_daily_loss');
	});

	it('returns [] on empty query', () => {
		expect(searchSettings(entries, '')).toEqual([]);
	});

	it('returns [] on whitespace-only query', () => {
		expect(searchSettings(entries, '   ')).toEqual([]);
	});
});

// Mock manifest with two entries + subsections for the component tests.
vi.mock('../lib/settings/manifest', () => ({
	SETTINGS_MANIFEST: [
		{
			id: 'risk.max_daily_loss',
			label: 'Max daily loss',
			default: 0,
			type: 'number',
			area: 'trading',
			subsection: 'risk-loss-limits',
			backendSection: 'risk',
			backendPath: 'max_daily_loss',
			description: 'daily loss before block',
			usedBy: [],
		},
		{
			id: 'agents.model_policy',
			label: 'Default model',
			default: '',
			type: 'text',
			area: 'agents',
			subsection: 'agents-model-policy',
			backendSection: 'agents',
			backendPath: 'model_policy',
			description: 'Default model used by agents',
			usedBy: [],
		},
	],
	SETTINGS_SUBSECTIONS: [
		{
			id: 'risk-loss-limits',
			area: 'trading',
			label: 'Loss limits',
			description: '',
		},
		{
			id: 'agents-model-policy',
			area: 'agents',
			label: 'Model policy',
			description: '',
		},
	],
	SETTINGS_AREAS: [],
}));

import SettingsSearch from '../lib/components/settings/shell/SettingsSearch.svelte';

let target: HTMLElement;
let instance: any;

afterEach(() => {
	if (instance) unmount(instance);
	target?.remove();
	if (typeof window !== 'undefined') {
		window.location.hash = '';
	}
});

async function flush(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await new Promise((r) => setTimeout(r, 0));
	await Promise.resolve();
}

describe('SettingsSearch component', () => {
	it('renders dropdown with matching results on input', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSearch, { target, props: {} });
		await flush();

		const input = target.querySelector('input[type="search"]') as HTMLInputElement;
		expect(input).toBeTruthy();

		input.value = 'max';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		await flush();

		const buttons = target.querySelectorAll('button');
		expect(buttons.length).toBeGreaterThanOrEqual(1);
		const joined = Array.from(buttons)
			.map((b) => b.textContent || '')
			.join(' | ');
		expect(joined).toContain('Max daily loss');
	});

	it('calls onPick with the chosen entry when a result is clicked', async () => {
		const onPick = vi.fn();
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSearch, { target, props: { onPick } });
		await flush();

		const input = target.querySelector('input[type="search"]') as HTMLInputElement;
		expect(input).toBeTruthy();

		input.value = 'model';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		await flush();

		const buttons = Array.from(target.querySelectorAll('button')) as HTMLButtonElement[];
		expect(buttons.length).toBeGreaterThanOrEqual(1);
		buttons[0].click();
		await flush();

		expect(onPick).toHaveBeenCalledTimes(1);
		const arg = onPick.mock.calls[0][0];
		expect(arg.id).toBe('agents.model_policy');
	});

	it('ArrowDown cycles highlight through results', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSearch, { target, props: {} });
		await flush();

		const input = target.querySelector('input[type="search"]') as HTMLInputElement;
		input.value = 'a';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		await flush();

		const items = target.querySelectorAll('li[role="option"]');
		expect(items.length).toBeGreaterThanOrEqual(2);

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		await flush();
		const itemsAfter1 = target.querySelectorAll('li[role="option"]');
		expect(itemsAfter1[0].getAttribute('aria-selected')).toBe('true');

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		await flush();
		const itemsAfter2 = target.querySelectorAll('li[role="option"]');
		expect(itemsAfter2[1].getAttribute('aria-selected')).toBe('true');
	});

	it('ArrowUp from empty highlights last result', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSearch, { target, props: {} });
		await flush();

		const input = target.querySelector('input[type="search"]') as HTMLInputElement;
		input.value = 'a';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		await flush();

		const items = target.querySelectorAll('li[role="option"]');
		expect(items.length).toBeGreaterThanOrEqual(2);

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
		await flush();

		const itemsAfter = target.querySelectorAll('li[role="option"]');
		expect(itemsAfter[itemsAfter.length - 1].getAttribute('aria-selected')).toBe('true');
	});

	it('Enter picks the highlighted entry', async () => {
		const onPick = vi.fn();
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSearch, { target, props: { onPick } });
		await flush();

		const input = target.querySelector('input[type="search"]') as HTMLInputElement;
		input.value = 'a';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		await flush();

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		await flush();

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		await flush();

		expect(onPick).toHaveBeenCalledTimes(1);
		// The first result when searching 'a' should match one of the mock entries.
		const arg = onPick.mock.calls[0][0];
		expect(['risk.max_daily_loss', 'agents.model_policy']).toContain(arg.id);
	});

	it('Escape clears the query and collapses dropdown', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSearch, { target, props: {} });
		await flush();

		const input = target.querySelector('input[type="search"]') as HTMLInputElement;
		input.value = 'max';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		await flush();

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await flush();

		expect(input.value).toBe('');
		expect(input.getAttribute('aria-expanded')).toBe('false');
	});

	it('input has combobox semantics', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		instance = mount(SettingsSearch, { target, props: {} });
		await flush();

		const input = target.querySelector('input[type="search"]') as HTMLInputElement;
		expect(input.getAttribute('role')).toBe('combobox');
		expect(input.getAttribute('aria-autocomplete')).toBe('list');
		expect(input.getAttribute('aria-expanded')).toBe('false');

		input.value = 'max';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		await flush();

		expect(input.getAttribute('aria-expanded')).toBe('true');
	});
});
