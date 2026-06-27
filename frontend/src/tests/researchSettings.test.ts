import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mount, tick, unmount } from 'svelte';

import ResearchSettingsPanel from '../lib/components/settings/ResearchSettingsPanel.svelte';
import type { ResearchSettings } from '$lib/api';

type MountedComponent = ReturnType<typeof mount>;

function buildSettings(): ResearchSettings {
	return {
		external_benchmarking_enabled: true,
		lane_weights: {
			exploration: 0.5,
			exploitation: 0.3,
			benchmarking: 0.2,
		},
		spawn_limits: {
			per_run: 2,
			rolling_window: 6,
			window_days: 7,
		},
		memory_modes: {
			exploration: {
				constraint_memory: true,
				inspiration_memory: 'optional',
			},
			exploitation: {
				constraint_memory: true,
				inspiration_memory: 'bounded',
			},
			benchmarking: {
				constraint_memory: true,
				inspiration_memory: 'bounded',
			},
		},
		allowed_external_source_types: ['reddit', 'youtube', 'blog', 'github', 'forum', 'book', 'paper'],
	};
}

function buildSettingsWithCustomSource(): ResearchSettings {
	return {
		...buildSettings(),
		allowed_external_source_types: [...buildSettings().allowed_external_source_types, 'podcast'],
	};
}

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
}

describe('ResearchSettingsPanel', () => {
	let target: HTMLDivElement;
	let app: MountedComponent | null = null;

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
	});

	it('emits the edited research settings payload when saved', async () => {
		const saves: ResearchSettings[] = [];
		app = mount(ResearchSettingsPanel, {
			target,
			props: {
				draft: buildSettings(),
				onsave: (event: CustomEvent<ResearchSettings>) => saves.push(event.detail),
			},
		});
		await flush();

		const benchmarkingToggle = target.querySelector<HTMLInputElement>('[data-testid="research-external-benchmarking"]');
		expect(benchmarkingToggle).not.toBeNull();
		if (!benchmarkingToggle) return;
		benchmarkingToggle.checked = false;
		benchmarkingToggle.dispatchEvent(new Event('change', { bubbles: true }));

		const perRunInput = target.querySelector<HTMLInputElement>('[data-testid="research-per-run"]');
		expect(perRunInput).not.toBeNull();
		if (!perRunInput) return;
		perRunInput.value = '3';
		perRunInput.dispatchEvent(new Event('input', { bubbles: true }));

		const inspirationSelect = target.querySelector<HTMLSelectElement>('[data-testid="research-exploration-inspiration"]');
		expect(inspirationSelect).not.toBeNull();
		if (!inspirationSelect) return;
		inspirationSelect.value = 'bounded';
		inspirationSelect.dispatchEvent(new Event('change', { bubbles: true }));

		const redditSourceToggle = target.querySelector<HTMLInputElement>('[data-testid="research-source-reddit"]');
		expect(redditSourceToggle).not.toBeNull();
		if (!redditSourceToggle) return;
		redditSourceToggle.checked = false;
		redditSourceToggle.dispatchEvent(new Event('change', { bubbles: true }));

		target.querySelector<HTMLButtonElement>('[data-testid="research-save"]')?.click();
		await flush();

		expect(saves).toHaveLength(1);
		expect(saves[0].external_benchmarking_enabled).toBe(false);
		expect(saves[0].spawn_limits.per_run).toBe(3);
		expect(saves[0].memory_modes.exploration.inspiration_memory).toBe('bounded');
		expect(saves[0].allowed_external_source_types).not.toContain('reddit');
	});

	it('emits hypothesis discipline overrides when the new fields are edited', async () => {
		const saves: ResearchSettings[] = [];
		app = mount(ResearchSettingsPanel, {
			target,
			props: {
				draft: buildSettings(),
				onsave: (event: CustomEvent<ResearchSettings>) => saves.push(event.detail),
			},
		});
		await flush();

		const capInput = target.querySelector<HTMLInputElement>('[data-testid="hypothesis-active-pool-cap"]');
		const minPickInput = target.querySelector<HTMLInputElement>('[data-testid="hypothesis-min-strategies-per-pick"]');
		const hitRateInput = target.querySelector<HTMLInputElement>('[data-testid="hypothesis-verdict-hit-rate-threshold"]');
		expect(capInput).not.toBeNull();
		expect(minPickInput).not.toBeNull();
		expect(hitRateInput).not.toBeNull();
		if (!capInput || !minPickInput || !hitRateInput) return;

		capInput.value = '8';
		capInput.dispatchEvent(new Event('input', { bubbles: true }));
		minPickInput.value = '5';
		minPickInput.dispatchEvent(new Event('input', { bubbles: true }));
		hitRateInput.value = '0.55';
		hitRateInput.dispatchEvent(new Event('input', { bubbles: true }));

		target.querySelector<HTMLButtonElement>('[data-testid="research-save"]')?.click();
		await flush();

		expect(saves).toHaveLength(1);
		const discipline = saves[0].hypothesis_discipline;
		expect(discipline).toBeDefined();
		expect(discipline?.active_pool_cap).toBe(8);
		expect(discipline?.min_strategies_per_pick).toBe(5);
		expect(discipline?.verdict_hit_rate_threshold).toBeCloseTo(0.55);
		// Untouched defaults survive
		expect(discipline?.revisit_interval_days).toBe(90);
	});

	it('emits autonomous_discovery overrides when toggled', async () => {
		const saves: ResearchSettings[] = [];
		app = mount(ResearchSettingsPanel, {
			target,
			props: {
				// buildSettings() omits autonomous_discovery -> exercises the defaults-merge path.
				draft: buildSettings(),
				onsave: (event: CustomEvent<ResearchSettings>) => saves.push(event.detail),
			},
		});
		await flush();

		const enabledToggle = target.querySelector<HTMLInputElement>('[data-testid="research-autonomous-discovery-enabled"]');
		const modeSelect = target.querySelector<HTMLSelectElement>('[data-testid="research-autonomous-discovery-mode"]');
		expect(enabledToggle).not.toBeNull();
		expect(modeSelect).not.toBeNull();
		if (!enabledToggle || !modeSelect) return;

		enabledToggle.checked = true;
		enabledToggle.dispatchEvent(new Event('change', { bubbles: true }));
		modeSelect.value = 'autonomous';
		modeSelect.dispatchEvent(new Event('change', { bubbles: true }));

		target.querySelector<HTMLButtonElement>('[data-testid="research-save"]')?.click();
		await flush();

		expect(saves).toHaveLength(1);
		const discovery = saves[0].autonomous_discovery;
		expect(discovery).toBeDefined();
		expect(discovery?.enabled).toBe(true);
		expect(discovery?.mode).toBe('autonomous');
		// Untouched default survives the merge.
		expect(discovery?.max_open_discovery_tasks).toBe(1);
	});

	it('preserves unknown source types while editing known ones', async () => {
		const saves: ResearchSettings[] = [];
		app = mount(ResearchSettingsPanel, {
			target,
			props: {
				draft: buildSettingsWithCustomSource(),
				onsave: (event: CustomEvent<ResearchSettings>) => saves.push(event.detail),
			},
		});
		await flush();

		expect(target.textContent).toContain('podcast');

		const githubSourceToggle = target.querySelector<HTMLInputElement>('[data-testid="research-source-github"]');
		expect(githubSourceToggle).not.toBeNull();
		if (!githubSourceToggle) return;
		githubSourceToggle.checked = false;
		githubSourceToggle.dispatchEvent(new Event('change', { bubbles: true }));

		target.querySelector<HTMLButtonElement>('[data-testid="research-save"]')?.click();
		await flush();

		expect(saves).toHaveLength(1);
		expect(saves[0].allowed_external_source_types).toContain('podcast');
		expect(saves[0].allowed_external_source_types).not.toContain('github');
	});
});
