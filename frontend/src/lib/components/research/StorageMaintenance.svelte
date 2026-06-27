<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getDataHealth,
		scanOrphans,
		cleanupOrphans,
		getDatasetVersions,
		type DataHealth,
		type OrphanReport,
		type DatasetVersion
	} from '$lib/api/data';

	let health: DataHealth | null = null;
	let orphans: OrphanReport | null = null;
	let versions: DatasetVersion[] = [];
	let loading = true;
	let error: string | null = null;
	let scanning = false;
	let cleaning = false;
	let notice: string | null = null;

	function fmtBytes(n: number | null | undefined): string {
		if (!n) return '0 B';
		const u = ['B', 'KB', 'MB', 'GB', 'TB'];
		let i = 0;
		let v = n;
		while (v >= 1024 && i < u.length - 1) {
			v /= 1024;
			i++;
		}
		return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
	}

	function ago(ts: string | null): string {
		if (!ts) return '—';
		const t = Date.parse(ts);
		if (Number.isNaN(t)) return '—';
		const m = (Date.now() - t) / 60_000;
		if (m < 1) return 'now';
		if (m < 60) return `${Math.round(m)}m ago`;
		const h = m / 60;
		return h < 24 ? `${h.toFixed(1)}h ago` : `${(h / 24).toFixed(1)}d ago`;
	}

	async function load() {
		loading = true;
		error = null;
		try {
			[health, versions] = await Promise.all([getDataHealth(), getDatasetVersions({ limit: 12 })]);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load storage health';
		} finally {
			loading = false;
		}
	}

	async function doScan() {
		scanning = true;
		notice = null;
		error = null;
		try {
			orphans = await scanOrphans();
			const total = orphans.orphans.length + orphans.cataloged_missing.length;
			notice = total === 0 ? 'No storage drift — catalog and parquet are in sync. ✓' : null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Orphan scan failed';
		} finally {
			scanning = false;
		}
	}

	async function doCleanup() {
		if (cleaning) return;
		cleaning = true;
		notice = null;
		error = null;
		try {
			const res = await cleanupOrphans();
			const reviewNote = res.skipped > 0 ? ` ${res.skipped} left for manual review.` : '';
			notice =
				res.removed === 0
					? `Nothing auto-removed.${reviewNote}`
					: `Removed ${res.removed} orphaned file${res.removed === 1 ? '' : 's'} (${fmtBytes(res.bytes_freed)} freed).${reviewNote}`;
			orphans = await scanOrphans();
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Cleanup failed';
		} finally {
			cleaning = false;
		}
	}

	onMount(load);
</script>

<div class="rounded-lg border border-[#222] bg-[#0a0a0a] p-4">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-sm font-semibold tracking-tight text-gray-200">Storage &amp; maintenance</h2>
		<button class="rounded border border-[#333] px-2 py-0.5 text-[11px] text-gray-300 hover:bg-[#1a1a1a]" on:click={load} disabled={loading}>
			{loading ? '…' : 'Refresh'}
		</button>
	</div>

	{#if error}
		<div class="mb-2 rounded bg-red-900/40 p-2 text-xs text-red-200">{error}</div>
	{/if}
	{#if notice}
		<div class="mb-2 rounded bg-green-900/30 p-2 text-xs text-green-200">{notice}</div>
	{/if}

	{#if loading && !health}
		<div class="text-xs text-gray-500">Loading…</div>
	{:else if health}
		<!-- Storage summary -->
		<div class="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
			<div>
				<div class="text-gray-500">Datasets</div>
				<div class="font-mono text-gray-200">{health.dataset_count}</div>
			</div>
			<div>
				<div class="text-gray-500">Parquet files</div>
				<div class="font-mono text-gray-200">{health.total_parquet_files}</div>
			</div>
			<div>
				<div class="text-gray-500">Parquet size</div>
				<div class="font-mono text-gray-200">{fmtBytes(health.total_parquet_bytes)}</div>
			</div>
			<div>
				<div class="text-gray-500">DB size</div>
				<div class="font-mono text-gray-200">{fmtBytes(health.db_size_bytes)}{health.wal_present ? ` (+${fmtBytes(health.wal_size_bytes)} WAL)` : ''}</div>
			</div>
			<div>
				<div class="text-gray-500">Avg quality</div>
				<div class="font-mono {health.quality_avg_score == null ? 'text-gray-500' : health.quality_avg_score >= 90 ? 'text-green-300' : health.quality_avg_score >= 70 ? 'text-yellow-300' : 'text-red-300'}">
					{health.quality_avg_score == null ? '—' : health.quality_avg_score.toFixed(0)}
				</div>
			</div>
			<div>
				<div class="text-gray-500">Last ingestion</div>
				<div class="font-mono text-gray-200">{ago(health.last_ingestion_at)}</div>
			</div>
		</div>

		<!-- Orphan scan -->
		<div class="mb-4 border-t border-[#222] pt-3">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-medium text-gray-400">
					Storage drift
					{#if health.orphan_count > 0}
						<span class="ml-1 rounded bg-yellow-900/50 px-1.5 py-0.5 text-yellow-300">{health.orphan_count} flagged</span>
					{/if}
				</span>
				<div class="flex items-center gap-2">
					{#if orphans && orphans.orphans.some((o) => o.safe_delete)}
						<button class="rounded border border-orange-700 px-2 py-0.5 text-[11px] text-orange-300 hover:bg-[#1a1a1a] disabled:opacity-50" on:click={doCleanup} disabled={cleaning || scanning}>
							{cleaning ? 'cleaning…' : `Clean up ${orphans.orphans.filter((o) => o.safe_delete).length}`}
						</button>
					{/if}
					<button class="rounded border border-[#333] px-2 py-0.5 text-[11px] text-gray-300 hover:bg-[#1a1a1a] disabled:opacity-50" on:click={doScan} disabled={scanning || cleaning}>
						{scanning ? 'scanning…' : 'Scan orphans'}
					</button>
				</div>
			</div>
			{#if orphans}
				{#if orphans.orphans.length === 0 && orphans.cataloged_missing.length === 0}
					<div class="text-xs text-gray-500">In sync — no orphaned files or missing parquet.</div>
				{:else}
					<div class="space-y-1 text-xs">
						{#each orphans.orphans as o}
							<div class="flex items-center justify-between {o.safe_delete ? 'text-yellow-200/90' : 'text-gray-400'}">
								<span class="font-mono">{o.symbol}/{o.timeframe}</span>
								<span class="text-gray-500">{o.reason ?? 'orphan'} · {fmtBytes(o.size_bytes)}{o.safe_delete ? '' : ' · kept'}</span>
							</div>
						{/each}
						{#each orphans.cataloged_missing as m}
							<div class="flex items-center justify-between text-red-200/90">
								<span class="font-mono">{m.symbol}/{m.timeframe}</span>
								<span class="text-gray-500">cataloged but file missing</span>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>

		<!-- Recent versions audit trail -->
		<div class="border-t border-[#222] pt-3">
			<div class="mb-2 text-xs font-medium text-gray-400">Recent ingestion versions</div>
			{#if versions.length === 0}
				<div class="text-xs text-gray-500">No version history yet.</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-xs">
						<thead>
							<tr class="text-left text-gray-500">
								<th class="py-1 pr-3 font-medium">series</th>
								<th class="py-1 pr-3 font-medium">source</th>
								<th class="py-1 pr-3 font-medium text-right">rows</th>
								<th class="py-1 font-medium text-right">created</th>
							</tr>
						</thead>
						<tbody>
							{#each versions as v}
								<tr class="border-t border-[#222]">
									<td class="py-1 pr-3 font-mono text-gray-300">{v.symbol}<span class="text-gray-600">/{v.timeframe}</span></td>
									<td class="py-1 pr-3 text-gray-400">{v.source}</td>
									<td class="py-1 pr-3 text-right font-mono text-gray-400">{v.row_count.toLocaleString()}</td>
									<td class="py-1 text-right text-gray-500">{ago(v.created_at)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>
