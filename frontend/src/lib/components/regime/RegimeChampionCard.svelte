<script lang="ts">
	import type { LabRegimeContainerSnapshot, LabRegimeContainerMember, PendingChampionApproval } from '$lib/api';
	import { approveApproval, denyApproval } from '$lib/api';
	import { formatRegimeLabel, regimeBadgeClass, regimeSwatchClass } from '$lib/utils/labRegime';

	export let container: LabRegimeContainerSnapshot | null = null;
	export let regime: string;
	export let workerActive: boolean = true;
	export let workerLastUpdated: string | null = null;
	export let cycleError: string | null = null;
	export let pendingApproval: PendingChampionApproval | null = null;

	let approving = false;
	let denying = false;

	function fmt(value: number | null | undefined, decimals = 2): string {
		if (value == null || !Number.isFinite(value)) return '—';
		return value.toFixed(decimals);
	}

	function metricFrom(member: LabRegimeContainerMember, key: string): number | null {
		const metrics = member.metrics_json as Record<string, unknown> | undefined;
		const adjusted = (metrics?.adjusted ?? {}) as Record<string, unknown>;
		const raw = (metrics?.raw ?? {}) as Record<string, unknown>;
		const val = adjusted[key] ?? raw[key];
		return typeof val === 'number' ? val : null;
	}

	$: members = (container?.members ?? []).slice(0, 5);
	$: championId = container?.champion?.strategy_id ?? null;
	$: badgeClass = regimeBadgeClass({ regime });
	$: swatchClass = regimeSwatchClass({ regime });

	$: approvalChange = pendingApproval?.payload?.champion_changes?.find(
		(c) => c.regime === regime
	) ?? null;

	async function handleApprove() {
		if (!pendingApproval) return;
		approving = true;
		try {
			await approveApproval(pendingApproval.id, { actor: 'operator' });
			pendingApproval = null;
		} catch {
			// silently handled — user can retry
		} finally {
			approving = false;
		}
	}

	async function handleDeny() {
		if (!pendingApproval) return;
		denying = true;
		try {
			await denyApproval(pendingApproval.id, { reason: 'Operator rejected champion promotion' });
			pendingApproval = null;
		} catch {
			// silently handled — user can retry
		} finally {
			denying = false;
		}
	}
</script>

<article class="flex flex-col rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
	<!-- Regime header -->
	<div class={`flex items-center gap-2 px-4 py-3 border-b border-slate-800`}>
		<span class={`h-2 w-2 rounded-full ${swatchClass}`}></span>
		<span class={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] font-medium ${badgeClass}`}>
			{formatRegimeLabel({ regime })}
		</span>
		{#if !workerActive && workerLastUpdated}
			<span class="ml-auto text-[10px] uppercase tracking-[0.14em] text-orange-400/80" title="Worker unavailable">
				Last updated {workerLastUpdated}
			</span>
		{:else if championId}
			<span class="ml-auto text-[10px] uppercase tracking-[0.14em] text-amber-400/80">Champion set</span>
		{/if}
	</div>

	<!-- Error / empty states -->
	{#if cycleError}
		<div class="flex flex-1 items-center justify-center px-4 py-8">
			<p class="text-center text-xs text-red-400/80">Last cycle failed — {cycleError}</p>
		</div>
	{:else if !container && !workerActive}
		<div class="flex flex-1 items-center justify-center px-4 py-8">
			<p class="text-center text-xs text-orange-400/70">Worker unavailable — awaiting first cycle</p>
		</div>
	{:else if !container}
		<div class="flex flex-1 items-center justify-center px-4 py-8">
			<div class="flex items-center gap-2">
				<svg class="h-3 w-3 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
					<path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-75" />
				</svg>
				<p class="text-xs text-slate-500">Running first cycle...</p>
			</div>
		</div>
	{:else if members.length === 0}
		<div class="flex flex-1 items-center justify-center px-4 py-8">
			<p class="text-center text-xs text-slate-600">No strategies admitted yet</p>
		</div>
	{:else}
		<!-- Pending approval banner -->
		{#if approvalChange}
			<div class="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
				<div class="flex items-center gap-2 text-xs">
					<span class="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-amber-300">
						Pending
					</span>
					<span class="text-slate-300">
						{approvalChange.old_champion_strategy_id ?? '(none)'}
						<span class="text-slate-500 mx-1">&rarr;</span>
						<span class="text-amber-200">{approvalChange.new_champion_strategy_id}</span>
					</span>
					<span class="text-slate-500 text-[10px]">score {fmt(approvalChange.new_champion_score)}</span>
				</div>
				<div class="mt-2 flex gap-2">
					<button
						on:click={handleApprove}
						disabled={approving || denying}
						class="rounded border border-emerald-600/50 bg-emerald-600/10 px-3 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-600/20 disabled:opacity-50"
					>
						{approving ? 'Approving...' : 'Approve'}
					</button>
					<button
						on:click={handleDeny}
						disabled={approving || denying}
						class="rounded border border-red-600/50 bg-red-600/10 px-3 py-1 text-[11px] font-medium text-red-300 hover:bg-red-600/20 disabled:opacity-50"
					>
						{denying ? 'Denying...' : 'Reject'}
					</button>
				</div>
			</div>
		{/if}

		<!-- Strategy list -->
		<div class="divide-y divide-slate-800/60">
			{#each members as member, i}
				{@const isChampion = member.strategy_id === championId}
				{@const sharpe = metricFrom(member, 'sharpe')}
				{@const pf = metricFrom(member, 'profit_factor')}
				{@const scoreWidth = `${Math.max(4, Math.min(100, (member.score ?? 0) * 100))}%`}

				<div class={`px-4 py-2.5 ${isChampion ? 'bg-amber-500/5' : 'bg-transparent'}`}>
					<div class="flex items-center gap-2">
						<!-- Rank badge -->
						<span class={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold
							${isChampion
								? 'border border-amber-500/60 bg-amber-500/15 text-amber-300'
								: 'border border-slate-700 bg-slate-800/60 text-slate-500'}`}>
							{i + 1}
						</span>

						<!-- Strategy ID -->
						<span class={`flex-1 truncate text-xs font-medium ${isChampion ? 'text-amber-100' : 'text-slate-200'}`}>
							{member.strategy_id}
							{#if isChampion}
								<span class="ml-1.5 text-[9px] uppercase tracking-[0.14em] text-amber-400/70">Champion</span>
							{/if}
						</span>

						<!-- Metrics -->
						<div class="flex shrink-0 items-center gap-2 text-[11px] text-slate-400">
							{#if sharpe != null}
								<span title="Sharpe">S {fmt(sharpe)}</span>
							{/if}
							{#if pf != null}
								<span title="Profit Factor">PF {fmt(pf)}</span>
							{/if}
						</div>
					</div>

					<!-- Score bar -->
					<div class="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-800/80">
						<div
							class={`h-full rounded-full transition-all ${isChampion ? 'bg-amber-400/70' : 'bg-slate-500/60'}`}
							style={`width: ${scoreWidth}`}
						></div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</article>
