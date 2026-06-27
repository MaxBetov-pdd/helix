<script lang="ts">
	import {
		runEvidenceCleanup,
		runTriageBatch,
		type EvidenceCleanupResponse,
		type TriageBatchResponse,
	} from '$lib/api';

	type LogTone = 'info' | 'success' | 'error';

	interface LogEntry {
		id: number;
		timestamp: string;
		tone: LogTone;
		message: string;
	}

	let logs: LogEntry[] = [];
	let logCounter = 0;
	let evidenceBusy = false;
	let triageBusy = false;
	let dryRun = false;
	let triageBatchSize = 10;
	let evidenceResult: EvidenceCleanupResponse | null = null;
	let evidenceWasDryRun = false;
	let triageResult: TriageBatchResponse | null = null;

	function pushLog(tone: LogTone, message: string): void {
		logCounter += 1;
		logs = [
			{ id: logCounter, timestamp: new Date().toLocaleTimeString(), tone, message },
			...logs,
		].slice(0, 50);
	}

	async function doEvidenceCleanup(): Promise<void> {
		if (evidenceBusy) return;
		if (!dryRun && !confirm('Run the evidence rule for real? This permanently marks matching hypotheses disproven.')) {
			return;
		}
		evidenceBusy = true;
		evidenceWasDryRun = dryRun;
		pushLog('info', `Running evidence rule${dryRun ? ' (dry run)' : ''}…`);
		try {
			const result: EvidenceCleanupResponse = await runEvidenceCleanup(dryRun);
			evidenceResult = result;
			const count = dryRun ? (result.would_disprove_count ?? 0) : (result.disproven_count ?? 0);
			const label = dryRun ? 'would disprove' : 'disproved';
			pushLog('success', `Evidence rule: ${label} ${count} hypotheses.`);
		} catch (err) {
			pushLog('error', `Evidence rule failed: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			evidenceBusy = false;
		}
	}

	async function doTriage(): Promise<void> {
		if (triageBusy) return;
		triageBusy = true;
		pushLog('info', `Running LLM triage (batch size ${triageBatchSize})…`);
		try {
			const result: TriageBatchResponse = await runTriageBatch(triageBatchSize);
			triageResult = result;
			pushLog(
				'success',
				`Triage: wrote ${result.processed_count} memos, ${result.errors?.length ?? 0} errors.`,
			);
			if (result.errors?.length) {
				for (const entry of result.errors) {
					pushLog('error', `  - ${entry.id}: ${entry.error_code ?? 'unknown_error'}`);
				}
			}
		} catch (err) {
			pushLog('error', `Triage failed: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			triageBusy = false;
		}
	}

	function toneClass(tone: LogTone): string {
		if (tone === 'error') return 'text-rose-300';
		if (tone === 'success') return 'text-emerald-300';
		return 'text-slate-300';
	}
</script>

<section class="mx-auto max-w-4xl p-6">
	<header class="mb-6">
		<h1 class="text-2xl font-semibold text-slate-100">Crucible cleanup</h1>
		<p class="mt-1 text-sm text-slate-400">
			Run evidence-rule sweeps and LLM triage batches over hypotheses that still need verdict memos.
		</p>
	</header>

	<div class="grid gap-4 md:grid-cols-2">
		<div class="rounded-lg border border-slate-700/60 bg-slate-900/60 p-4">
			<h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Evidence rule</h2>
			<p class="mt-1 text-xs text-slate-400">
				Mark any hypothesis disproven whose best strategy has ≥ 3 fails and 0 passes.
			</p>
			<label class="mt-3 inline-flex items-center gap-2 text-xs text-slate-300">
				<input type="checkbox" bind:checked={dryRun} class="rounded border-slate-600" />
				Dry run (preview only)
			</label>
			<button
				type="button"
				class="mt-3 w-full rounded border border-sky-500/50 bg-sky-500/10 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-200 transition hover:bg-sky-500/20 disabled:opacity-50"
				on:click={doEvidenceCleanup}
				disabled={evidenceBusy}
			>
				{evidenceBusy ? 'Running…' : 'Run evidence rule'}
			</button>
			{#if evidenceResult}
				{@const ids = evidenceResult.ids ?? []}
				{@const count = evidenceWasDryRun
					? (evidenceResult.would_disprove_count ?? ids.length)
					: (evidenceResult.disproven_count ?? ids.length)}
				<div class="mt-3 rounded border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
					<div class="font-semibold text-slate-200">
						{evidenceWasDryRun ? `Would disprove ${count}` : `Disproved ${count}`} hypotheses
					</div>
					{#if ids.length}
						<ul class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
							{#each ids as id (id)}
								<li>
									<a href={`/hypotheses/${id}`} class="text-sky-300 underline-offset-2 hover:underline">
										{id}
									</a>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-1 text-slate-500">No matching hypotheses.</p>
					{/if}
				</div>
			{/if}
		</div>

		<div class="rounded-lg border border-slate-700/60 bg-slate-900/60 p-4">
			<h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">LLM triage</h2>
			<p class="mt-1 text-xs text-slate-400">
				Write a verdict memo for each hypothesis still missing one.
			</p>
			<label class="mt-3 flex items-center gap-2 text-xs text-slate-300">
				Batch size
				<input
					type="number"
					bind:value={triageBatchSize}
					min="1"
					max="50"
					class="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
				/>
			</label>
			<button
				type="button"
				class="mt-3 w-full rounded border border-violet-500/50 bg-violet-500/10 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-50"
				on:click={doTriage}
				disabled={triageBusy}
			>
				{triageBusy ? 'Running…' : 'Run LLM triage'}
			</button>
			{#if triageResult}
				{@const processedIds = triageResult.processed_ids ?? []}
				<div class="mt-3 rounded border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
					<div class="font-semibold text-slate-200">
						Wrote {triageResult.processed_count} memos · {triageResult.errors?.length ?? 0} errors
					</div>
					{#if processedIds.length}
						<ul class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
							{#each processedIds as id (id)}
								<li>
									<a href={`/hypotheses/${id}`} class="text-violet-300 underline-offset-2 hover:underline">
										{id}
									</a>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-1 text-slate-500">No hypotheses processed.</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-6 rounded-lg border border-slate-700/60 bg-slate-900/60 p-4">
		<h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Activity log</h2>
		{#if logs.length === 0}
			<p class="mt-2 text-xs text-slate-500">No actions yet.</p>
		{:else}
			<ul class="mt-2 space-y-1 font-mono text-xs">
				{#each logs as entry (entry.id)}
					<li class={toneClass(entry.tone)}>
						<span class="text-slate-600">[{entry.timestamp}]</span>
						{entry.message}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
