<script lang="ts">
	import { onMount } from 'svelte';
	import { getCollectionHealth, type CollectionHealth, type CollectionStream } from '$lib/api/data';

	let health: CollectionHealth | null = null;
	let loading = true;
	let error: string | null = null;

	const STATUS: Record<CollectionStream['status'], { label: string; dot: string; text: string }> = {
		healthy: { label: 'Healthy', dot: 'bg-green-500', text: 'text-green-300' },
		recovering: { label: 'Recovering', dot: 'bg-yellow-500', text: 'text-yellow-300' },
		down: { label: 'Down', dot: 'bg-red-500', text: 'text-red-300' },
		never_ran: { label: 'Idle', dot: 'bg-gray-600', text: 'text-gray-500' }
	};

	const STATUS_ORDER: Record<string, number> = { down: 0, recovering: 1, healthy: 2, never_ran: 3 };
	type SortKey = 'stream' | 'status' | 'last_success' | 'fails';
	let sortKey: SortKey = 'status';
	let sortDir: 1 | -1 = 1;

	const sortVal: Record<SortKey, (s: CollectionStream) => number | string> = {
		stream: (s) => s.stream,
		status: (s) => STATUS_ORDER[s.status] ?? 9,
		last_success: (s) => (s.last_success ? Date.parse(s.last_success) || 0 : 0),
		fails: (s) => s.consecutive_failures
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

	$: streams = health
		? [...health.streams].sort((a, b) => {
				const va = sortVal[sortKey](a);
				const vb = sortVal[sortKey](b);
				if (va < vb) return -sortDir;
				if (va > vb) return sortDir;
				return 0;
			})
		: [];

	function ago(ts: string | null): string {
		if (!ts) return '—';
		const t = Date.parse(ts);
		if (Number.isNaN(t)) return '—';
		const m = (Date.now() - t) / 60_000;
		if (m < 1) return 'now';
		return m < 60 ? `${Math.round(m)}m ago` : `${(m / 60).toFixed(1)}h ago`;
	}

	function scoreClass(score: number): string {
		if (score >= 90) return 'text-green-300';
		if (score >= 70) return 'text-yellow-300';
		return 'text-red-300';
	}

	async function load() {
		loading = true;
		error = null;
		try {
			health = await getCollectionHealth();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load source health';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div class="rounded-lg border border-[#222] bg-[#0a0a0a] p-4">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-sm font-semibold tracking-tight text-gray-200">Source health</h2>
		<div class="flex items-center gap-3 text-xs">
			{#if health}
				<span class="text-gray-400">Data health</span>
				<span class="font-mono text-base font-bold {scoreClass(health.score)}">{health.score}</span>
			{/if}
			<button class="rounded border border-[#333] px-2 py-0.5 text-[11px] text-gray-300 hover:bg-[#1a1a1a]" on:click={load} disabled={loading}>
				{loading ? '…' : 'Refresh'}
			</button>
		</div>
	</div>

	{#if error}
		<div class="rounded bg-red-900/40 p-2 text-xs text-red-200">{error}</div>
	{:else if loading && !health}
		<div class="text-xs text-gray-500">Loading…</div>
	{:else if health}
		<div class="max-h-64 overflow-auto">
			<table class="w-full text-xs">
				<thead class="sticky top-0 bg-[#0a0a0a]">
					<tr class="text-left text-gray-500">
						<th class="py-1 pr-3 font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('stream')}>stream{arrow('stream')}</button></th>
						<th class="py-1 pr-3 font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('status')}>status{arrow('status')}</button></th>
						<th class="py-1 pr-3 font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('last_success')}>last success{arrow('last_success')}</button></th>
						<th class="py-1 pr-3 text-right font-medium"><button class="hover:text-gray-300" on:click={() => sortBy('fails')}>fails{arrow('fails')}</button></th>
						<th class="py-1 font-medium">last error</th>
					</tr>
				</thead>
				<tbody>
					{#each streams as s}
						<tr class="border-t border-[#222]">
							<td class="py-1 pr-3 font-mono text-gray-300">{s.stream}</td>
							<td class="py-1 pr-3">
								<span class="inline-flex items-center gap-1.5 {STATUS[s.status].text}">
									<span class="inline-block h-2 w-2 rounded-full {STATUS[s.status].dot}"></span>
									{STATUS[s.status].label}
								</span>
							</td>
							<td class="py-1 pr-3 text-gray-400">{ago(s.last_success)}</td>
							<td class="py-1 pr-3 text-right font-mono {s.consecutive_failures > 0 ? 'text-red-300' : 'text-gray-500'}">
								{s.consecutive_failures}
							</td>
							<td class="max-w-[18rem] truncate py-1 text-gray-500" title={s.last_error ?? ''}>
								{s.last_error ?? '—'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
