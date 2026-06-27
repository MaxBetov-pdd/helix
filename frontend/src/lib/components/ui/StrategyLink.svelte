<script lang="ts">
	import { buildStrategyHref, normalizeStrategyId } from '$lib/utils/strategyLinks';

	export let strategyId = '';
	export let label: string | null = null;
	export let returnTo: string | null = null;
	export let className = '';
	export let titlePrefix = 'Open strategy';

	$: normalizedId = normalizeStrategyId(strategyId);
	$: text = (label ?? '').trim() || normalizedId || 'Unknown Strategy';
	$: href = buildStrategyHref(normalizedId, { returnTo });
	$: title = normalizedId ? `${titlePrefix}: ${normalizedId}` : text;
</script>

{#if normalizedId}
	<a
		href={href}
		title={title}
		class={`inline-flex items-center gap-1 rounded border border-cyan-900/60 bg-cyan-900/10 px-2 py-0.5 font-mono text-[11px] text-cyan-300 transition-colors hover:border-cyan-500 hover:text-cyan-200 ${className}`}
	>
		{text}
	</a>
{:else}
	<span class={`inline-flex items-center gap-1 rounded border border-[#333] bg-[#111] px-2 py-0.5 font-mono text-[11px] text-gray-500 ${className}`}>
		{text}
	</span>
{/if}
