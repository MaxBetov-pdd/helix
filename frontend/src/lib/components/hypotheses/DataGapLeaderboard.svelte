<script lang="ts">
	import type { DataGapSummary } from '$lib/api';

	export let items: DataGapSummary[] = [];
	export let title = 'Top Data Gaps';
	export let subtitle = 'The missing data most often blocking crucible execution.';
</script>

<div class="border border-[#222] bg-[#090909]">
	<div class="border-b border-[#222] bg-[#0d0d0d] px-5 py-4">
		<h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-gray-300">{title}</h2>
		<p class="mt-1 text-xs text-gray-500">{subtitle}</p>
	</div>

	<div class="divide-y divide-[#171717]">
		{#if items.length === 0}
			<div class="px-5 py-10 text-sm text-gray-500">No ranked data gaps yet.</div>
		{:else}
			{#each items as item, index}
				<div class="px-5 py-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="border border-[#2d2d2d] bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">#{index + 1}</span>
								<div class="text-sm font-semibold text-white">{item.title}</div>
							</div>
							<div class="mt-2 text-xs uppercase tracking-[0.18em] text-gray-500">{item.missing_dataset}</div>
							{#if item.why_it_matters}
								<p class="mt-2 text-sm leading-6 text-gray-400">{item.why_it_matters}</p>
							{/if}
						</div>
						<div class="text-right text-xs">
							<div class="text-gray-500">Requests</div>
							<div class="mt-1 font-semibold text-white">{item.request_count}</div>
							<div class="mt-3 text-gray-500">Priority</div>
							<div class="mt-1 font-semibold text-white">{item.priority_score.toFixed(1)}</div>
						</div>
					</div>
					{#if item.missing_fields.length}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each item.missing_fields as field}
								<span class="border border-[#222] bg-black/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-gray-400">{field}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
