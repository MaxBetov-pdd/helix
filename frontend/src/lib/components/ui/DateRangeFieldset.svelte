<script lang="ts">
	import {
		DATE_RANGE_PRESETS,
		estimateBarCount,
		formatBarEstimate,
		formatDateWindowSummary,
		inferDateRangePreset,
		resolveDateRangePreset,
		type DateRangePresetId,
	} from '$lib/utils/dateRange';

	export let idPrefix = 'date-range';
	export let startDate = '';
	export let endDate = '';
	export let timeframe = '1h';
	export let title = 'Date range';
	export let description = 'Use a preset to move quickly, or switch to custom dates.';
	export let minDate = '';
	export let maxDate = '';
	export let accent: 'cyan' | 'blue' | 'violet' | 'amber' | 'rose' = 'cyan';

	// Today in UTC (YYYY-MM-DD). When no explicit maxDate is provided we cap the
	// date inputs at today so the End date can't be pushed into the future. This
	// guard only affects the <input max> ceiling — preset resolution still uses
	// the raw `maxDate` prop, so existing preset behavior is unchanged.
	const todayUtc = new Date().toISOString().slice(0, 10);
	$: maxCeiling = maxDate || todayUtc;

	const accentStyles = {
		cyan: {
			active: 'border-cyan-500/70 bg-cyan-500/12 text-cyan-200',
			idle: 'border-[#2b2b2b] bg-[#070707] text-gray-400 hover:border-cyan-700 hover:text-cyan-200',
			meta: 'text-cyan-300',
		},
		blue: {
			active: 'border-blue-500/70 bg-blue-500/12 text-blue-200',
			idle: 'border-[#2b2b2b] bg-[#070707] text-gray-400 hover:border-blue-700 hover:text-blue-200',
			meta: 'text-blue-300',
		},
		violet: {
			active: 'border-violet-500/70 bg-violet-500/12 text-violet-200',
			idle: 'border-[#2b2b2b] bg-[#070707] text-gray-400 hover:border-violet-700 hover:text-violet-200',
			meta: 'text-violet-300',
		},
		amber: {
			active: 'border-amber-500/70 bg-amber-500/12 text-amber-200',
			idle: 'border-[#2b2b2b] bg-[#070707] text-gray-400 hover:border-amber-700 hover:text-amber-200',
			meta: 'text-amber-300',
		},
		rose: {
			active: 'border-rose-500/70 bg-rose-500/12 text-rose-200',
			idle: 'border-[#2b2b2b] bg-[#070707] text-gray-400 hover:border-rose-700 hover:text-rose-200',
			meta: 'text-rose-300',
		},
	};

	function applyPreset(presetId: Exclude<DateRangePresetId, 'custom'>): void {
		const resolved = resolveDateRangePreset(presetId, {
			minDate: minDate || undefined,
			maxDate: maxDate || undefined,
		});
		startDate = resolved.startDate;
		endDate = resolved.endDate;
	}

	$: activePreset = inferDateRangePreset(startDate, endDate, {
		minDate: minDate || undefined,
		maxDate: maxDate || undefined,
	});
	$: barEstimate = estimateBarCount(startDate, endDate, timeframe);
	$: barEstimateLabel = formatBarEstimate(barEstimate);
	$: windowSummary = formatDateWindowSummary(startDate, endDate);
	$: styles = accentStyles[accent];
</script>

<div class="rounded border border-[#1a1a1a] bg-[#050505] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<div class="text-[10px] uppercase tracking-[0.24em] text-gray-500">{title}</div>
			<div class="mt-1 text-xs text-gray-500">{description}</div>
		</div>
		<div class="flex flex-wrap items-center gap-2 text-[11px]">
			<span class={`rounded-full border border-[#2b2b2b] bg-[#090909] px-2.5 py-1 ${styles.meta}`}>
				{windowSummary}
			</span>
			<span class="rounded-full border border-[#2b2b2b] bg-[#090909] px-2.5 py-1 text-gray-400">
				{barEstimateLabel}
			</span>
		</div>
	</div>

	<div class="mt-3 flex flex-wrap gap-2">
		{#each DATE_RANGE_PRESETS as preset}
			<button
				type="button"
				class={`rounded-full border px-2.5 py-1 text-[11px] transition ${activePreset === preset.id ? styles.active : styles.idle}`}
				on:click={() => applyPreset(preset.id)}
			>
				{preset.label}
			</button>
		{/each}
		{#if minDate}
			<button
				type="button"
				class={`rounded-full border px-2.5 py-1 text-[11px] transition ${activePreset === 'max' ? styles.active : styles.idle}`}
				on:click={() => applyPreset('max')}
			>
				Max
			</button>
		{/if}
		<span class={`rounded-full border px-2.5 py-1 text-[11px] ${activePreset === 'custom' ? styles.active : 'border-[#2b2b2b] bg-[#070707] text-gray-500'}`}>
			Custom
		</span>
	</div>

	<div class="mt-3 grid gap-3 md:grid-cols-2">
		<label class="block" for={`${idPrefix}-start`}>
			<div class="text-[10px] uppercase tracking-[0.2em] text-gray-500">Start</div>
			<input
				id={`${idPrefix}-start`}
				type="date"
				bind:value={startDate}
				min={minDate || undefined}
				max={endDate || maxCeiling}
				class="mt-1.5 w-full rounded border border-[#2b2b2b] bg-[#050505] px-3 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-white/60"
			/>
		</label>
		<label class="block" for={`${idPrefix}-end`}>
			<div class="text-[10px] uppercase tracking-[0.2em] text-gray-500">End</div>
			<input
				id={`${idPrefix}-end`}
				type="date"
				bind:value={endDate}
				min={startDate || minDate || undefined}
				max={maxCeiling}
				class="mt-1.5 w-full rounded border border-[#2b2b2b] bg-[#050505] px-3 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-white/60"
			/>
		</label>
	</div>
</div>
