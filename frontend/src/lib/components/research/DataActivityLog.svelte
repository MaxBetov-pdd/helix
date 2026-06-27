<script lang="ts">
	import { onMount } from 'svelte';
	import { getDataActivity, type DataActivity, type DataActivityEvent } from '$lib/api/data';

	let activity: DataActivity | null = null;
	let loading = true;
	let error: string | null = null;
	let actionFilter = 'all';
	let search = '';

	const ACTION_META: Record<string, { label: string; icon: string; tone: string }> = {
		download: { label: 'Download', icon: '↓', tone: 'border-cyan-700 text-cyan-300' },
		backfill: { label: 'Backfill', icon: '⛏', tone: 'border-blue-700 text-blue-300' },
		source_reconciliation: { label: 'Reconcile', icon: '⇄', tone: 'border-purple-700 text-purple-300' },
		csv_upload: { label: 'CSV upload', icon: '⇪', tone: 'border-emerald-700 text-emerald-300' },
		dataset_delete: { label: 'Delete', icon: '✕', tone: 'border-red-700 text-red-300' },
		orphan_scan: { label: 'Orphan scan', icon: '⚠', tone: 'border-amber-700 text-amber-300' },
		orphan_cleanup: { label: 'Cleanup', icon: '♻', tone: 'border-orange-700 text-orange-300' },
		event: { label: 'Event', icon: '•', tone: 'border-[#222] text-gray-300' }
	};

	function meta(action: string) {
		return ACTION_META[action] ?? ACTION_META.event;
	}

	function levelClass(level: string): string {
		if (level === 'error') return 'text-red-300';
		if (level === 'warning') return 'text-yellow-300';
		return 'text-gray-300';
	}

	function ago(ts: string | null): string {
		if (!ts) return '—';
		const t = Date.parse(ts.includes('T') ? ts : `${ts.replace(' ', 'T')}Z`);
		if (Number.isNaN(t)) return '—';
		const m = (Date.now() - t) / 60_000;
		if (m < 1) return 'just now';
		if (m < 60) return `${Math.round(m)}m ago`;
		const h = m / 60;
		if (h < 24) return `${h.toFixed(1)}h ago`;
		return `${(h / 24).toFixed(1)}d ago`;
	}

	$: events = activity?.events ?? [];
	$: actions = Array.from(new Set(events.map((e) => e.action)));
	$: query = search.trim().toLowerCase();
	$: shown = events.filter((e) => {
		if (actionFilter !== 'all' && e.action !== actionFilter) return false;
		if (!query) return true;
		const sym = String(e.detail?.symbol ?? '');
		return `${e.message} ${e.action} ${sym}`.toLowerCase().includes(query);
	});

	async function load() {
		loading = true;
		error = null;
		try {
			activity = await getDataActivity(200);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load activity';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div class="rounded-lg border border-[#222] bg-[#0a0a0a] p-4">
	<div class="mb-1 flex flex-wrap items-center justify-between gap-3">
		<h2 class="text-sm font-semibold tracking-tight text-gray-200">Activity log</h2>
		<div class="flex flex-wrap items-center gap-2 text-xs">
			<input
				type="text"
				bind:value={search}
				placeholder="Search symbol, action…"
				class="w-40 rounded border border-[#333] bg-[#111] px-2 py-0.5 text-[11px] text-gray-200 outline-none focus:border-cyan-500"
			/>
			<select
				bind:value={actionFilter}
				class="rounded border border-[#333] bg-[#111] px-2 py-0.5 text-[11px] text-gray-200 outline-none focus:border-cyan-500"
			>
				<option value="all">All actions</option>
				{#each actions as a}
					<option value={a}>{meta(a).label}</option>
				{/each}
			</select>
			<button class="rounded border border-[#333] px-2 py-0.5 text-[11px] text-gray-300 hover:bg-[#1a1a1a]" on:click={load} disabled={loading}>
				{loading ? '…' : 'Refresh'}
			</button>
		</div>
	</div>
	<p class="mb-3 text-[11px] text-gray-500">Every download, backfill, upload, delete, reconciliation, and cleanup, newest first.</p>

	{#if error}
		<div class="rounded bg-red-900/40 p-2 text-xs text-red-200">{error}</div>
	{:else if loading && events.length === 0}
		<div class="text-xs text-gray-500">Loading activity…</div>
	{:else if shown.length === 0}
		<div class="text-xs text-gray-500">
			{events.length === 0
				? 'No data actions logged yet. Download a dataset or backfill a series and it will appear here.'
				: 'No activity for this filter.'}
		</div>
	{:else}
		<ol class="relative space-y-0">
			{#each shown as event}
				{@const m = meta(event.action)}
				<li class="flex items-start gap-3 border-t border-[#222] py-2 first:border-t-0">
					<span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] {m.tone}" title={m.label}>
						{m.icon}
					</span>
					<div class="min-w-0 flex-1">
						<div class="text-xs {levelClass(event.level)}">{event.message}</div>
						{#if event.detail?.error}
							<div class="mt-0.5 truncate font-mono text-[11px] text-red-300/80" title={String(event.detail.error)}>
								{event.detail.error}
							</div>
						{/if}
					</div>
					<span class="shrink-0 whitespace-nowrap text-[11px] text-gray-500" title={event.ts ?? ''}>{ago(event.ts)}</span>
				</li>
			{/each}
		</ol>
	{/if}
</div>
