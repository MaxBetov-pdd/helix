<script lang="ts">
	export let steps: Array<{
		id: string;
		label: string;
		critical: boolean;
		satisfied: boolean;
	}>;
	export let activeIndex: number;
	export let onSelect: (index: number) => void;
	export let onSkipAll: () => void;

	function statusSuffix(step: { critical: boolean; satisfied: boolean }): string {
		if (step.critical && !step.satisfied) return ' (needs attention)';
		if (step.satisfied) return ' (complete)';
		return ' (pending)';
	}
</script>

<nav class="flex flex-col h-full border-r border-gray-800 bg-gray-950 w-[200px] p-3">
	<ol class="flex-1 space-y-1">
		{#each steps as step, i (step.id)}
			<li>
				<button
					type="button"
					aria-current={i === activeIndex ? 'step' : undefined}
					aria-label={step.label + statusSuffix(step)}
					class="w-full flex items-center gap-2 text-left px-2 py-2 rounded text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
					       {i === activeIndex ? 'bg-cyan-900/40 text-white' : 'text-gray-300 hover:bg-gray-900'}"
					on:click={() => onSelect(i)}
				>
					<span class="w-4 flex-shrink-0 text-xs" aria-hidden="true">
						{#if step.critical && !step.satisfied}
							<span class="text-amber-400">△</span>
						{:else if step.satisfied}
							<span class="text-emerald-400">✓</span>
						{:else}
							<span class="text-gray-600">○</span>
						{/if}
					</span>
					<span class="flex-1 truncate">{step.label}</span>
				</button>
			</li>
		{/each}
	</ol>
	<button
		type="button"
		class="mt-4 text-xs text-gray-500 hover:text-gray-300 text-left px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
		on:click={onSkipAll}
	>
		Skip all — I'll configure later
	</button>
</nav>
