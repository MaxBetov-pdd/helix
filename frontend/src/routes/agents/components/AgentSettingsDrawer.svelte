<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { AccentColor, AgentHubSettings } from './agentHubSettings';

	import { fade, fly } from 'svelte/transition';

	export let settings: Writable<AgentHubSettings>;

	const dispatch = createEventDispatcher<{ close: void; reset: void }>();

	const pollIntervalOptions = [3000, 5000, 10000, 15000, 30000];
	const accentOptions: Array<{ value: AccentColor; label: string; color: string }> = [
		{ value: 'cyan', label: 'Cyan', color: '#06b6d4' },
		{ value: 'green', label: 'Green', color: '#22c55e' },
		{ value: 'amber', label: 'Amber', color: '#f59e0b' },
		{ value: 'rose', label: 'Rose', color: '#fb7185' }
	];

	const defaultSettings: AgentHubSettings = {
		pollInterval: 5000,
		taskQueueCount: 15,
		compactCards: false,
		dateFormat: 'absolute',
		accent: 'cyan',
		soundOnComplete: false,
		showInternalWorkers: true,
		showSchedulerErrors: false
	};

	const rowCountMarks = [10, 15, 25, 50];

	$: current = $settings;
	$: clampedRowCount = Math.min(50, Math.max(10, Math.floor(current.taskQueueCount / 5) * 5));

	function clampTaskQueueCount(value: string) {
		const parsed = Number(value);
		if (!Number.isFinite(parsed)) return current.taskQueueCount;
		return Math.min(50, Math.max(10, Math.round(parsed / 5) * 5));
	}

	function closeDrawer() {
		dispatch('close');
	}

	function resetSettings() {
		settings.set({ ...defaultSettings });
		dispatch('close');
		dispatch('reset');
	}

	function formatPollInterval(ms: number): string {
		return `${ms / 1000}s`;
	}

	function onTaskQueueInput(value: string) {
		const next = clampTaskQueueCount(value);
		settings.update((value) => ({ ...value, taskQueueCount: next }));
	}
</script>

<div class="fixed inset-0 z-50">
	<button
		type="button"
		aria-label="Close settings drawer"
		class="absolute inset-0 bg-black/80 backdrop-blur-sm"
		transition:fade
		on:click={closeDrawer}
	></button>
	<div
		class="absolute right-0 top-0 h-full w-full max-w-sm bg-[#0a0a0a] border-l border-[#222] shadow-2xl flex flex-col text-sm text-gray-200"
		transition:fly={{ x: 320 }}
	>
		<div class="px-4 py-3 border-b border-[#222] flex items-center justify-between sticky top-0 bg-[#0a0a0a]">
			<h2 class="font-bold tracking-wider uppercase text-xs">Agent Hub Settings</h2>
			<button class="terminal-button-icon" type="button" on:click={closeDrawer} aria-label="Close settings">
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<div class="p-4 space-y-6 overflow-y-auto flex-1 min-h-0">
			<section class="space-y-2">
				<h3 class="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Polling</h3>
				<div>
					<label class="block text-[10px] text-gray-500 uppercase tracking-wider mb-1" for="hub-poll-interval">
						Poll Interval
					</label>
					<select
						id="hub-poll-interval"
						class="terminal-select"
						bind:value={current.pollInterval}
					>
						{#each pollIntervalOptions as option}
							<option value={option}>{formatPollInterval(option)}</option>
						{/each}
					</select>
				</div>
			</section>

			<section class="space-y-4">
				<h3 class="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Task Queue</h3>
				<div>
					<div class="flex items-center justify-between mb-1">
						<label class="text-[10px] text-gray-500 uppercase tracking-wider" for="hub-task-count">
							Row Count
						</label>
						<span class="text-xs text-gray-300">{clampedRowCount}</span>
					</div>
					<input
						id="hub-task-count"
						type="range"
						min="10"
						max="50"
						step="5"
						value={clampedRowCount}
						on:input={(event) => onTaskQueueInput((event.currentTarget as HTMLInputElement).value)}
					/>
					<div class="mt-1 flex items-center justify-between text-[10px] text-gray-500">
						{#each rowCountMarks as mark}
							<span>{mark}</span>
						{/each}
					</div>
				</div>
				<div class="flex items-center justify-between">
					<div>
						<label for="hub-date-format" class="text-[10px] text-gray-500 uppercase tracking-wider">Date Format</label>
						<select
							id="hub-date-format"
							class="terminal-select mt-1"
							bind:value={current.dateFormat}
						>
							<option value="absolute">Absolute</option>
							<option value="relative">Relative</option>
						</select>
					</div>
				</div>
				<label class="flex items-center justify-between text-xs cursor-pointer">
					<span class="uppercase tracking-wider text-[10px] text-gray-500">Compact Card Mode</span>
					<input
						type="checkbox"
						checked={current.compactCards}
						on:change={(event) => settings.update((value) => ({ ...value, compactCards: (event.currentTarget as HTMLInputElement).checked }))}
					/>
				</label>
				<label class="flex items-center justify-between text-xs cursor-pointer">
					<span class="uppercase tracking-wider text-[10px] text-gray-500">Sound on Task Completion</span>
					<input
						type="checkbox"
						checked={current.soundOnComplete}
						on:change={(event) => settings.update((value) => ({ ...value, soundOnComplete: (event.currentTarget as HTMLInputElement).checked }))}
					/>
				</label>
				<label class="flex items-center justify-between text-xs cursor-pointer">
					<span class="uppercase tracking-wider text-[10px] text-gray-500">Show Internal Workers</span>
					<input
						type="checkbox"
						checked={current.showInternalWorkers}
						on:change={(event) => settings.update((value) => ({ ...value, showInternalWorkers: (event.currentTarget as HTMLInputElement).checked }))}
					/>
				</label>
			</section>

			<section class="space-y-3">
				<h3 class="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Scheduler</h3>
				<label class="flex items-center justify-between text-xs cursor-pointer">
					<span class="uppercase tracking-wider text-[10px] text-gray-500">Auto-expand errors</span>
					<input
						type="checkbox"
						checked={current.showSchedulerErrors}
						on:change={(event) => settings.update((value) => ({ ...value, showSchedulerErrors: (event.currentTarget as HTMLInputElement).checked }))}
					/>
				</label>
				<div>
					<div class="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Accent</div>
					<div class="flex gap-2">
						{#each accentOptions as accent}
							<button
								type="button"
								class={`w-7 h-7 rounded-full border ${current.accent === accent.value ? 'border-white' : 'border-[#444]'}`}
								style={`background: ${accent.color}`}
								aria-label={`Set accent to ${accent.label}`}
								on:click={() => settings.update((value) => ({ ...value, accent: accent.value }))}
							></button>
						{/each}
					</div>
				</div>
			</section>

			<section class="pt-2">
				<button type="button" class="w-full terminal-button-danger" on:click={resetSettings}>Reset to Defaults</button>
			</section>
		</div>
	</div>
</div>
