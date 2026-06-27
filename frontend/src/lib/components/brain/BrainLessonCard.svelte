<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BrainLesson } from '$lib/api/brain';

	export let lesson: BrainLesson;
	export let busy = false;

	const dispatch = createEventDispatcher<{
		edit: BrainLesson;
		validate: BrainLesson;
		delete: BrainLesson;
	}>();

	function formatDate(iso: string | null | undefined): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}

	function staleClass(lastValidatedAt: string | null): string {
		if (!lastValidatedAt) return 'stale';
		const ts = Date.parse(lastValidatedAt);
		if (!Number.isFinite(ts)) return 'stale';
		const ageDays = (Date.now() - ts) / 86400000;
		if (ageDays > 90) return 'stale';
		if (ageDays > 30) return 'aging';
		return 'fresh';
	}

	$: confidencePct = Math.round(lesson.confidence * 100);
	$: confidenceColor =
		lesson.confidence > 0.7
			? 'text-emerald-300'
			: lesson.confidence > 0.4
				? 'text-amber-300'
				: 'text-rose-300';
	$: freshness = staleClass(lesson.last_validated_at);
</script>

<article class="rounded-xl border border-[#1f1f1f] bg-black/40 p-4">
	<header class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<div class="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
				Situation
			</div>
			<p class="mt-1 break-words text-sm font-semibold text-white">
				{lesson.situation_pattern}
			</p>
		</div>
		<div class="flex shrink-0 flex-col items-end gap-1">
			<span class="text-[10px] uppercase tracking-[0.18em] text-gray-500">#{lesson.id}</span>
			<span class="text-[11px] font-semibold {confidenceColor}">{confidencePct}%</span>
		</div>
	</header>

	<p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-300">
		{lesson.lesson_text}
	</p>

	<footer class="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
		{#if lesson.evidence_decisions?.length}
			<span class="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-cyan-300">
				Evidence: {lesson.evidence_decisions.length} decisions
			</span>
		{:else}
			<span class="rounded-full border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-amber-300">
				No evidence linked
			</span>
		{/if}
		<span
			class="rounded-full border px-2 py-0.5 {freshness === 'stale' ? 'border-rose-500/30 bg-rose-500/5 text-rose-300' : freshness === 'aging' ? 'border-amber-500/30 bg-amber-500/5 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'}"
		>
			Validated {formatDate(lesson.last_validated_at)}
		</span>
		{#if lesson.created_by}
			<span class="text-gray-600">by {lesson.created_by}</span>
		{/if}
	</footer>

	<div class="mt-3 flex flex-wrap gap-2">
		<button
			type="button"
			on:click={() => dispatch('validate', lesson)}
			disabled={busy}
			class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200 transition hover:border-emerald-300 disabled:opacity-50"
		>
			Re-validate
		</button>
		<button
			type="button"
			on:click={() => dispatch('edit', lesson)}
			disabled={busy}
			class="rounded-lg border border-[#2a2a2a] bg-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-300 transition hover:border-white hover:text-white disabled:opacity-50"
		>
			Edit
		</button>
		<button
			type="button"
			on:click={() => dispatch('delete', lesson)}
			disabled={busy}
			class="ml-auto rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-200 transition hover:border-rose-300 disabled:opacity-50"
		>
			Delete
		</button>
	</div>
</article>
