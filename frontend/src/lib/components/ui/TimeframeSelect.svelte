<script lang="ts">
	import { ORDERED_TIMEFRAME_OPTIONS } from '$lib/config/timeframes';

	export let id = '';
	export let label = 'Timeframe';
	export let value = '1h';
	export let helpText = '';
	export let disabled = false;
</script>

<label class="block" for={id}>
	<div class="text-[10px] uppercase tracking-[0.2em] text-gray-500">{label}</div>
	<select
		id={id}
		bind:value
		{disabled}
		class="mt-1.5 w-full rounded border border-[#2b2b2b] bg-[#050505] px-3 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-white/60"
	>
		{#each ORDERED_TIMEFRAME_OPTIONS as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if helpText}
		<div class="mt-1 text-[11px] text-gray-500">{helpText}</div>
	{/if}
</label>
