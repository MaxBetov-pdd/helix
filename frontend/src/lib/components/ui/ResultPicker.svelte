<script lang="ts">
	import type { StrategyContainerHistoryItem } from '$lib/api';

	export let id = '';
	export let label = 'Gauntlet result';
	export let value = '';
	export let helpText = '';
	export let items: StrategyContainerHistoryItem[] = [];

	function fmtShortDate(value: string | null | undefined): string {
		if (!value) return '--';
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return '--';
		return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	$: selectedItem = items.find((item) => String(item.result_id || '').trim() === value) ?? null;
</script>

<label class="block" for={id}>
	<div class="text-[10px] uppercase tracking-[0.2em] text-gray-500">{label}</div>
	<select
		id={id}
		bind:value
		class="mt-1.5 w-full rounded border border-[#2b2b2b] bg-[#050505] px-3 py-2 text-sm text-white outline-none transition focus:border-white/60"
	>
		<option value="">Select result…</option>
		{#each items as item}
			<option value={item.result_id}>{item.result_id} — {item.symbol} {item.timeframe}</option>
		{/each}
	</select>
	{#if helpText}
		<div class="mt-1 text-[11px] text-gray-500">{helpText}</div>
	{/if}

	{#if selectedItem}
		<div class="mt-2 rounded-xl border border-[#1f1f1f] bg-[#070707] px-3 py-2 text-[11px] text-gray-400">
			<div class="flex flex-wrap items-center gap-2">
				<span class="rounded-full border border-[#2b2b2b] bg-black px-2 py-0.5 font-mono text-cyan-300">{selectedItem.result_id}</span>
				<span>{selectedItem.symbol || '--'}</span>
				<span class="text-gray-600">/</span>
				<span>{selectedItem.timeframe || '--'}</span>
				<span class="text-gray-600">/</span>
				<span>{fmtShortDate(selectedItem.start_date)} -> {fmtShortDate(selectedItem.end_date)}</span>
			</div>
		</div>
	{/if}
</label>
