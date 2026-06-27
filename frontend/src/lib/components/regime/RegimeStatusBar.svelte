<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatRegimeLabel, regimeBadgeClass } from '$lib/utils/labRegime';

	export let regime = '';
	export let confidence = 0;
	export let uncertain = false;
	export let championId: string | null = null;
	export let lastCycleAt: string | null = null;
	export let running = false;

	const dispatch = createEventDispatcher<{ run: void }>();

	function formatRelative(iso: string | null): string {
		if (!iso) return 'Never';
		const diff = Date.now() - new Date(iso).getTime();
		if (diff < 0) return 'Just now';
		const mins = Math.floor(diff / 60_000);
		if (mins < 1) return 'Just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	$: regimeKey = (regime || '').trim().toUpperCase();
	$: badgeClass = regimeKey
		? regimeBadgeClass({ regime: regimeKey, uncertain })
		: 'border-slate-700 bg-slate-500/10 text-slate-400';
</script>

<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
	<div class="flex flex-wrap items-center gap-4">
		<!-- Current regime -->
		<div class="flex items-center gap-2">
			<span class="text-[11px] uppercase tracking-[0.16em] text-slate-500">Regime</span>
			{#if regimeKey}
				<span class={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] font-medium ${badgeClass}`}>
					{formatRegimeLabel({ regime: regimeKey })}
				</span>
				{#if uncertain}
					<span class="text-[10px] uppercase tracking-[0.14em] text-amber-400">uncertain</span>
				{/if}
			{:else}
				<span class="text-sm text-slate-500">—</span>
			{/if}
		</div>

		<!-- Confidence -->
		{#if confidence > 0}
			<div class="flex items-center gap-1.5">
				<span class="text-[11px] uppercase tracking-[0.16em] text-slate-500">Conf</span>
				<span class={`text-sm font-medium ${uncertain ? 'text-amber-300' : 'text-slate-200'}`}>
					{(confidence * 100).toFixed(0)}%
				</span>
			</div>
		{/if}

		<!-- Champion -->
		<div class="flex items-center gap-1.5">
			<span class="text-[11px] uppercase tracking-[0.16em] text-slate-500">Champion</span>
			<span class={`text-sm font-medium ${championId ? 'text-emerald-300' : 'text-slate-500'}`}>
				{championId || 'None'}
			</span>
		</div>

		<!-- Last cycle -->
		<div class="flex items-center gap-1.5">
			<span class="text-[11px] uppercase tracking-[0.16em] text-slate-500">Last cycle</span>
			<span class={`text-sm ${running ? 'text-cyan-300' : 'text-slate-400'}`}>
				{running ? 'Running…' : formatRelative(lastCycleAt)}
			</span>
		</div>
	</div>

	<button
		class="rounded-md border px-4 py-2 text-sm font-medium transition-colors
			{running
				? 'cursor-not-allowed border-slate-700 bg-slate-800/60 text-slate-500'
				: 'border-cyan-600 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30'}"
		disabled={running}
		on:click={() => dispatch('run')}
	>
		{running ? 'Running…' : 'Run New Cycle'}
	</button>
</div>
