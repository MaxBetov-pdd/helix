<script lang="ts">
	export let id = '';
	export let label = '';
	export let value: number | string = '';
	export let helpText = '';
	export let min: number | string | undefined = undefined;
	export let max: number | string | undefined = undefined;
	export let step: number | string | undefined = undefined;
	export let placeholder = '';
</script>

<label class="block" for={id}>
	<div class="text-[10px] uppercase tracking-[0.2em] text-gray-500">{label}</div>
	<input
		id={id}
		type="number"
		bind:value
		{min}
		{max}
		{step}
		{placeholder}
		class="mt-1.5 w-full rounded border border-[#2b2b2b] bg-[#050505] px-3 py-2 text-sm text-white outline-none transition focus:border-white/60"
	/>
	{#if helpText}
		<div class="mt-1 text-[11px] text-gray-500">{helpText}</div>
	{/if}
</label>
