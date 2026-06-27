<script lang="ts">
	import type { HypothesisStatus, VerdictMemo, VerdictSignals } from '$lib/api';

	export let status: HypothesisStatus | string;
	export let memo: VerdictMemo | null | undefined = null;
	export let memoAt: string | null | undefined = null;
	export let memoBy: string | null | undefined = null;
	export let signals: VerdictSignals | null | undefined = null;
	export let canReopen = false;
	export let onReopen: (rationale: string) => Promise<void> = async () => {};

	let reopenRationale = '';
	let busy = false;

	async function doReopen() {
		busy = true;
		try {
			await onReopen(reopenRationale.trim());
			reopenRationale = '';
		} finally {
			busy = false;
		}
	}

	function statusLabel(s: string): string {
		switch (s) {
			case 'proven':
				return 'Proven';
			case 'disproven':
				return 'Disproven';
			case 'researching':
				return 'Researching';
			default:
				return 'Proposed';
		}
	}

	function statusTone(s: string): string {
		switch (s) {
			case 'proven':
				return 'text-emerald-200';
			case 'disproven':
				return 'text-slate-400 line-through';
			case 'researching':
				return 'text-sky-200';
			default:
				return 'text-amber-200';
		}
	}

	function claimLabel(v: string): string {
		switch (v) {
			case 'confirmed':
				return 'Claim confirmed';
			case 'partially_confirmed':
				return 'Claim partially confirmed';
			case 'disproven':
				return 'Claim busted';
			case 'unverified':
				return 'Claim unverified';
			default:
				return '';
		}
	}

	function claimClasses(v: string): string {
		switch (v) {
			case 'confirmed':
				return 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200';
			case 'partially_confirmed':
				return 'border-amber-400/60 bg-amber-500/15 text-amber-200';
			case 'disproven':
				return 'border-rose-500/60 bg-rose-500/15 text-rose-200';
			default:
				return 'border-slate-500/50 bg-slate-700/20 text-slate-300';
		}
	}

	function formatStamp(value: string | null | undefined): string {
		if (!value) return '';
		const normalized = value.includes('T') ? value : `${value}Z`;
		const parsed = new Date(normalized);
		if (Number.isNaN(parsed.getTime())) return value;
		return parsed.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}
</script>

<section class="rounded-lg border border-[#222] bg-[#0b0b0b] p-4" data-testid="verdict-memo-card">
	<div class="flex items-center justify-between gap-3">
		<div class="text-xs uppercase tracking-[0.22em] text-slate-400">Current verdict</div>
		{#if canReopen}
			<button
				type="button"
				class="rounded border border-amber-500/60 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
				on:click={doReopen}
				disabled={busy}
				data-action="reopen-hypothesis"
			>
				{busy ? 'Reopening…' : 'Reopen'}
			</button>
		{/if}
	</div>

	<div class={`mt-2 text-lg font-semibold ${statusTone(status)}`}>{statusLabel(status)}</div>

	{#if memo?.claim_verdict && memo.claim_verdict !== 'no_claim'}
		<div class="mt-2">
			<span class={`inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${claimClasses(memo.claim_verdict)}`} data-claim-verdict={memo.claim_verdict}>
				{claimLabel(memo.claim_verdict)}
			</span>
			{#if memo.claim_assessment}
				<p class="mt-1.5 text-xs text-slate-400">{memo.claim_assessment}</p>
			{/if}
		</div>
	{/if}

	{#if memo?.rationale}
		<p class="mt-2 text-sm text-slate-200">{memo.rationale}</p>
	{:else if !memo}
		<p class="mt-2 text-sm text-slate-500">No verdict memo has been written yet.</p>
	{/if}

	{#if memo?.evidence_summary}
		<p class="mt-2 text-xs text-slate-400">{memo.evidence_summary}</p>
	{/if}

	{#if signals && signals.rolling_window_size > 0}
		<div class="mt-3 grid grid-cols-3 gap-2 text-center">
			<div class="border border-[#222] bg-black/40 px-2 py-1.5">
				<div class="text-[9px] uppercase tracking-[0.16em] text-slate-500">Hit rate</div>
				<div class="mt-0.5 text-sm font-semibold text-slate-200">{Math.round(signals.hit_rate * 100)}%</div>
				<div class="text-[9px] text-slate-600">need ≥ {Math.round(signals.hit_rate_threshold * 100)}%</div>
			</div>
			<div class="border border-[#222] bg-black/40 px-2 py-1.5">
				<div class="text-[9px] uppercase tracking-[0.16em] text-slate-500">Diversity</div>
				<div class="mt-0.5 text-sm font-semibold text-slate-200">{signals.diversity_cells}</div>
				<div class="text-[9px] text-slate-600">need ≥ {signals.effective_min_diversity_cells ?? signals.min_diversity_cells} cells</div>
			</div>
			<div class="border border-[#222] bg-black/40 px-2 py-1.5">
				<div class="text-[9px] uppercase tracking-[0.16em] text-slate-500">Window</div>
				<div class="mt-0.5 text-sm font-semibold text-slate-200">{signals.rolling_window_size}/{signals.rolling_window_setting}</div>
				<div class="text-[9px] text-slate-600">children</div>
			</div>
		</div>
		<div class="mt-1.5 text-[10px] text-slate-500">
			Evidence floor: <span class="text-slate-300">{signals.mathematical_verdict}</span>
		</div>
	{/if}

	{#if memo?.next_step_suggestions?.length}
		<div class="mt-3">
			<div class="text-[10px] uppercase tracking-[0.18em] text-slate-400">Next steps</div>
			<ul class="mt-1 list-disc pl-5 text-sm text-slate-300">
				{#each memo.next_step_suggestions as suggestion}
					<li>{suggestion}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if memo?.garbage_signal}
		<div class="mt-3 inline-flex items-center rounded border border-rose-500/50 bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-rose-200">
			Garbage signal
		</div>
	{/if}

	{#if memoAt}
		<div class="mt-3 text-[11px] text-slate-500">Written {formatStamp(memoAt)} by {memoBy ?? 'unknown'}</div>
	{/if}

	{#if canReopen}
		<label class="mt-3 block text-[10px] uppercase tracking-[0.18em] text-slate-500" for="reopen-rationale">
			Optional rationale
		</label>
		<input
			id="reopen-rationale"
			type="text"
			bind:value={reopenRationale}
			placeholder="Why reopen this crucible?"
			class="mt-1 w-full rounded border border-[#222] bg-black/60 px-2 py-1 text-xs text-slate-100 outline-none placeholder:text-slate-600"
		/>
	{/if}
</section>
