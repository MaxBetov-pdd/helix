<script lang="ts">
	export let activeStep = 0; // 0=idle, 1=model, 2=segments, 3=matrix, 4=done, -1=failed
	export let lastCompletedAt: string | null = null;

	const steps = [
		{ label: 'Model Rebuild', key: 1 },
		{ label: 'Segments', key: 2 },
		{ label: 'Matrix', key: 3 },
		{ label: 'Complete', key: 4 },
	];

	function formatRelative(iso: string | null): string {
		if (!iso) return '';
		const diff = Date.now() - new Date(iso).getTime();
		if (diff < 0) return 'just now';
		const mins = Math.floor(diff / 60_000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	function stepClass(key: number): string {
		if (activeStep === -1 && key === failedKey) return 'failed';
		if (key < activeStep) return 'done';
		if (key === activeStep) return 'running';
		return 'pending';
	}

	$: failedKey = activeStep === -1 ? lastFailedStep : null;
	$: lastFailedStep = 1; // default: failed on first step if unknown
	$: isRunning = activeStep > 0 && activeStep < 4;
	$: isDone = activeStep === 4;
	$: isFailed = activeStep === -1;
	$: isIdle = activeStep === 0;
</script>

{#if isIdle && lastCompletedAt}
	<div class="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-2 text-xs text-slate-500">
		<svg class="h-3.5 w-3.5 text-emerald-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
		</svg>
		Last cycle completed {formatRelative(lastCompletedAt)}
	</div>
{:else if !isIdle}
	<div class="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
		<p class="mb-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">Cycle Progress</p>
		<div class="flex items-center gap-0">
			{#each steps as step, i}
				{@const state = stepClass(step.key)}
				<div class="flex items-center">
					<!-- Step node -->
					<div class="flex flex-col items-center gap-1">
						<div class={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-all
							${state === 'done' ? 'border-emerald-600 bg-emerald-500/20 text-emerald-300' :
							  state === 'running' ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.35)]' :
							  state === 'failed' ? 'border-rose-600 bg-rose-500/15 text-rose-300' :
							  'border-slate-700 bg-slate-900 text-slate-600'}`}>
							{#if state === 'done'}
								<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
								</svg>
							{:else if state === 'failed'}
								<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
								</svg>
							{:else if state === 'running'}
								<span class="animate-pulse">•••</span>
							{:else}
								{step.key}
							{/if}
						</div>
						<span class={`text-[10px] uppercase tracking-[0.12em] whitespace-nowrap
							${state === 'done' ? 'text-emerald-400' :
							  state === 'running' ? 'text-cyan-300' :
							  state === 'failed' ? 'text-rose-400' :
							  'text-slate-600'}`}>
							{step.label}
						</span>
					</div>

					<!-- Connector line -->
					{#if i < steps.length - 1}
						<div class={`mx-1 mb-4 h-[2px] w-10 rounded-full transition-all
							${step.key < activeStep ? 'bg-emerald-600/60' : 'bg-slate-700/60'}`}></div>
					{/if}
				</div>
			{/each}
		</div>
		{#if isFailed}
			<p class="mt-2 text-xs text-rose-400">Cycle failed — check worker logs for details.</p>
		{/if}
	</div>
{/if}
