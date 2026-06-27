<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { getQualityReports, backfillGaps, type QualityReport } from '$lib/api/data';

	export let limit = 100;

	const dispatch = createEventDispatcher<{ select: { symbol: string; timeframe: string } }>();

	let reports: QualityReport[] = [];
	let loading = true;
	let error: string | null = null;
	let busy: string | null = null;
	let onlyProblems = true;

	type SortKey = 'series' | 'score' | 'gaps' | 'nulls' | 'ohlc' | 'age';
	let sortKey: SortKey = 'score';
	let sortDir: 1 | -1 = 1; // worst score first by default

	const sortVal: Record<SortKey, (r: QualityReport) => number | string> = {
		series: (r) => `${r.symbol}/${r.timeframe}`,
		score: (r) => r.quality_score,
		gaps: (r) => r.gaps,
		nulls: (r) => r.null_values,
		ohlc: (r) => r.invalid_high_low + r.invalid_close_range,
		age: (r) => r.freshness_hours ?? -1
	};

	function sortBy(k: SortKey) {
		if (sortKey === k) sortDir = sortDir === 1 ? -1 : 1;
		else {
			sortKey = k;
			sortDir = 1;
		}
	}

	function arrow(k: SortKey): string {
		return sortKey === k ? (sortDir === 1 ? ' ↑' : ' ↓') : '';
	}

	$: sorted = [...reports].sort((a, b) => {
		const va = sortVal[sortKey](a);
		const vb = sortVal[sortKey](b);
		if (va < vb) return -sortDir;
		if (va > vb) return sortDir;
		return 0;
	});
	$: shown = onlyProblems
		? sorted.filter((r) => r.quality_score < 95 || r.gaps > 0 || r.is_stale)
		: sorted;

	function scoreClass(score: number): string {
		if (score >= 90) return 'text-green-300';
		if (score >= 70) return 'text-yellow-300';
		return 'text-red-300';
	}

	function key(r: QualityReport): string {
		return `${r.symbol}:${r.timeframe}`;
	}

	async function load() {
		loading = true;
		error = null;
		try {
			reports = await getQualityReports(limit);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load quality reports';
		} finally {
			loading = false;
		}
	}

	async function fix(r: QualityReport) {
		if (busy) return;
		busy = key(r);
		try {
			await backfillGaps(r.symbol, r.timeframe);
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Backfill failed';
		} finally {
			busy = null;
		}
	}

	onMount(load);
</script>

<div class="rounded-lg border border-[#222] bg-[#0a0a0a] p-4">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-sm font-semibold tracking-tight text-gray-200">Quality leaderboard</h2>
		<div class="flex items-center gap-3 text-xs">
			<label class="flex items-center gap-1.5 text-gray-400">
				<input type="checkbox" bind:checked={onlyProblems} class="accent-blue-500" />
				Problems only
			</label>
			<button class="rounded border border-[#333] px-2 py-0.5 text-[11px] text-gray-300 hover:bg-[#1a1a1a]" on:click={load} disabled={loading}>
				{loading ? '…' : 'Refresh'}
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-2 rounded bg-red-900/40 p-2 text-xs text-red-200">{error}</div>
	{/if}

	{#if loading && reports.length === 0}
		<div class="text-xs text-gray-500">Loading…</div>
	{:else if shown.length === 0}
		<div class="text-xs text-gray-500">
			{reports.length === 0 ? 'No quality reports yet.' : 'All series look healthy. ✓'}
		</div>
	{:else}
		<div class="max-h-64 overflow-auto">
			<table class="w-full text-xs">
				<thead class="sticky top-0 bg-[#0a0a0a]">
					<tr class="text-left text-gray-500">
						<th class="py-1 pr-3 font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('series')}>series{arrow('series')}</button></th>
						<th class="py-1 pr-3 text-right font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('score')}>score{arrow('score')}</button></th>
						<th class="py-1 pr-3 text-right font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('gaps')}>gaps{arrow('gaps')}</button></th>
						<th class="py-1 pr-3 text-right font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('nulls')}>nulls{arrow('nulls')}</button></th>
						<th class="py-1 pr-3 text-right font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('ohlc')}>bad OHLC{arrow('ohlc')}</button></th>
						<th class="py-1 pr-3 text-right font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('age')}>age{arrow('age')}</button></th>
						<th class="py-1 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each shown as r (key(r))}
						<tr class="border-t border-[#222]">
							<td class="py-1 pr-3">
								<button
									class="font-mono text-gray-300 hover:text-blue-300 hover:underline"
									on:click={() => dispatch('select', { symbol: r.symbol, timeframe: r.timeframe })}
									title="View series detail"
								>
									{r.symbol}<span class="text-gray-600">/{r.timeframe}</span>
								</button>
							</td>
							<td class="py-1 pr-3 text-right font-mono font-bold {scoreClass(r.quality_score)}">{r.quality_score}</td>
							<td class="py-1 pr-3 text-right font-mono {r.gaps > 0 ? 'text-yellow-300' : 'text-gray-500'}">{r.gaps}</td>
							<td class="py-1 pr-3 text-right font-mono {r.null_values > 0 ? 'text-yellow-300' : 'text-gray-500'}">{r.null_values}</td>
							<td class="py-1 pr-3 text-right font-mono {(r.invalid_high_low + r.invalid_close_range) > 0 ? 'text-red-300' : 'text-gray-500'}">
								{r.invalid_high_low + r.invalid_close_range}
							</td>
							<td class="py-1 pr-3 text-right font-mono {r.is_stale ? 'text-red-300' : 'text-gray-500'}">
								{r.freshness_hours != null ? `${r.freshness_hours.toFixed(0)}h` : '—'}
							</td>
							<td class="py-1 text-right">
								{#if r.gaps > 0}
									<button
										class="rounded border border-[#333] px-2 py-0.5 text-[11px] text-blue-300 hover:bg-[#1a1a1a] disabled:opacity-50"
										on:click={() => fix(r)}
										disabled={busy === key(r)}
									>
										{busy === key(r) ? 'filling…' : 'Backfill'}
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
