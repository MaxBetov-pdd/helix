<script lang="ts">
	import { getTimeframeLabel } from '$lib/config/timeframes';
	import { estimateBarCount, formatBarEstimate, formatDateWindowSummary } from '$lib/utils/dateRange';

	export let eyebrow = 'Experiment';
	export let title = '';
	export let description = '';
	export let symbol = '';
	export let timeframe = '1h';
	export let startDate = '';
	export let endDate = '';
	export let accent: 'cyan' | 'blue' | 'violet' | 'amber' | 'orange' | 'teal' | 'rose' = 'cyan';

	const accentStyles = {
		cyan: {
			eyebrow: 'text-cyan-300',
			glow: 'shadow-[0_0_0_1px_rgba(34,211,238,0.06),0_18px_40px_rgba(6,182,212,0.08)]',
			badge: 'border-cyan-900/80 bg-cyan-950/30 text-cyan-200',
		},
		blue: {
			eyebrow: 'text-blue-300',
			glow: 'shadow-[0_0_0_1px_rgba(96,165,250,0.06),0_18px_40px_rgba(59,130,246,0.08)]',
			badge: 'border-blue-900/80 bg-blue-950/30 text-blue-200',
		},
		violet: {
			eyebrow: 'text-violet-300',
			glow: 'shadow-[0_0_0_1px_rgba(167,139,250,0.06),0_18px_40px_rgba(139,92,246,0.08)]',
			badge: 'border-violet-900/80 bg-violet-950/30 text-violet-200',
		},
		amber: {
			eyebrow: 'text-amber-300',
			glow: 'shadow-[0_0_0_1px_rgba(251,191,36,0.06),0_18px_40px_rgba(245,158,11,0.08)]',
			badge: 'border-amber-900/80 bg-amber-950/30 text-amber-200',
		},
		orange: {
			eyebrow: 'text-orange-300',
			glow: 'shadow-[0_0_0_1px_rgba(251,146,60,0.06),0_18px_40px_rgba(249,115,22,0.08)]',
			badge: 'border-orange-900/80 bg-orange-950/30 text-orange-200',
		},
		teal: {
			eyebrow: 'text-teal-300',
			glow: 'shadow-[0_0_0_1px_rgba(45,212,191,0.06),0_18px_40px_rgba(20,184,166,0.08)]',
			badge: 'border-teal-900/80 bg-teal-950/30 text-teal-200',
		},
		rose: {
			eyebrow: 'text-rose-300',
			glow: 'shadow-[0_0_0_1px_rgba(251,113,133,0.06),0_18px_40px_rgba(244,63,94,0.08)]',
			badge: 'border-rose-900/80 bg-rose-950/30 text-rose-200',
		},
	};

	$: styles = accentStyles[accent];
	$: barEstimateLabel = formatBarEstimate(estimateBarCount(startDate, endDate, timeframe));
	$: timeframeLabel = getTimeframeLabel(timeframe) || '--';
	$: windowSummary = formatDateWindowSummary(startDate, endDate);
</script>

<section class={`rounded-2xl border border-[#1d1d1d] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_38%),linear-gradient(180deg,#0b0b0b_0%,#070707_100%)] p-4 ${styles.glow}`}>
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="max-w-2xl">
			<div class={`text-[10px] uppercase tracking-[0.28em] ${styles.eyebrow}`}>{eyebrow}</div>
			<h3 class="mt-2 text-lg font-semibold text-white">{title}</h3>
			{#if description}
				<p class="mt-1 text-sm text-gray-400">{description}</p>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-2 text-[11px]">
			{#if symbol}
				<span class={`rounded-full border px-2.5 py-1 font-medium ${styles.badge}`}>{symbol}</span>
			{/if}
			<span class="rounded-full border border-[#2b2b2b] bg-[#090909] px-2.5 py-1 text-gray-300">{timeframeLabel}</span>
			<span class="rounded-full border border-[#2b2b2b] bg-[#090909] px-2.5 py-1 text-gray-400">{windowSummary}</span>
			<span class="rounded-full border border-[#2b2b2b] bg-[#090909] px-2.5 py-1 text-gray-400">{barEstimateLabel}</span>
		</div>
	</div>
	<div class="mt-4">
		<slot />
	</div>
</section>
