<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		getBrainAuxiliary,
		recallSimilarSituation,
		type BrainRecallHit,
		type BrainRecallResponse,
		type BrainRecallScope
	} from '$lib/api/brain';

	let query = '';
	let scope: BrainRecallScope = 'all';
	let limit = 10;

	let response: BrainRecallResponse | null = null;
	let loading = false;
	let error = '';

	// Proactively detect whether the `recall` auxiliary model is configured so
	// we can surface the affordance before the user runs their first search.
	let auxRecallConfigured: boolean | null = null;

	async function checkAuxConfig() {
		try {
			const aux = await getBrainAuxiliary();
			const recall = aux.auxiliary?.recall;
			auxRecallConfigured = Boolean(recall && recall.provider && recall.model_id);
		} catch {
			// Best-effort: if the probe fails, fall back to the post-search banner.
			auxRecallConfigured = null;
		}
	}

	let elapsedMs = 0;
	let elapsedTimer: ReturnType<typeof setInterval> | null = null;

	function startElapsedCounter() {
		const startedAt = performance.now();
		elapsedMs = 0;
		if (elapsedTimer) clearInterval(elapsedTimer);
		elapsedTimer = setInterval(() => {
			elapsedMs = performance.now() - startedAt;
		}, 50);
	}

	function stopElapsedCounter() {
		if (elapsedTimer) {
			clearInterval(elapsedTimer);
			elapsedTimer = null;
		}
	}

	async function runSearch() {
		const q = query.trim();
		if (!q) return;
		loading = true;
		error = '';
		response = null;
		startElapsedCounter();
		try {
			response = await recallSimilarSituation(q, { scope, limit });
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
			stopElapsedCounter();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void runSearch();
		}
	}

	function highlightSnippet(snippet: string | null, q: string): string {
		if (!snippet) return '';
		const terms = q
			.split(/\s+/)
			.map((t) => t.trim())
			.filter((t) => t.length >= 2)
			.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		if (terms.length === 0) return escapeHtml(snippet);
		const escaped = escapeHtml(snippet);
		const re = new RegExp(`(${terms.join('|')})`, 'gi');
		return escaped.replace(re, '<mark>$1</mark>');
	}

	function escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function sourceLabel(hit: BrainRecallHit): string {
		return hit.source === 'brain_decisions' ? 'decision' : 'task';
	}

	function sourceClass(hit: BrainRecallHit): string {
		return hit.source === 'brain_decisions' ? 'src-decision' : 'src-task';
	}

	function formatScore(value: number | undefined | null): string {
		if (value == null || Number.isNaN(value)) return '—';
		return value.toFixed(3);
	}

	function formatTimestamp(value: string | null | undefined): string {
		if (!value) return '—';
		const dt = new Date(value);
		return Number.isNaN(dt.getTime()) ? value : dt.toLocaleString();
	}

	$: showAuxBanner =
		response &&
		response.ok &&
		response.hits.length > 0 &&
		(!response.summary || !response.aux_model);

	// Surface the affordance up front (no search run yet) once the probe has
	// confirmed the recall aux model is missing.
	$: showProactiveAuxBanner = !response && auxRecallConfigured === false;

	$: failure = response && !response.ok ? response : null;
	$: success = response && response.ok ? response : null;

	onMount(() => {
		void checkAuxConfig();
	});

	onDestroy(() => {
		stopElapsedCounter();
	});
</script>

<div class="recall-tab">
	<div class="search">
		<div class="search-row">
			<input
				type="text"
				bind:value={query}
				on:keydown={handleKeydown}
				placeholder="Search past decisions and tasks (e.g. 'mean reversion ADX failure')"
				disabled={loading}
			/>
			<select bind:value={scope} disabled={loading}>
				<option value="all">All</option>
				<option value="decisions">Decisions only</option>
				<option value="tasks">Tasks only</option>
			</select>
			<button
				type="button"
				class="primary"
				on:click={runSearch}
				disabled={loading || !query.trim()}
			>
				{loading ? `Searching… ${(elapsedMs / 1000).toFixed(1)}s` : 'Search'}
			</button>
		</div>
		<div class="hint">
			Hybrid FTS5 + BM25 + auxiliary-LLM rerank/summary. Limit: {limit} hits per query.
		</div>
	</div>

	{#if showProactiveAuxBanner}
		<div class="aux-banner">
			<strong>No auxiliary model configured.</strong>
			Recall will return raw FTS5 hits with no LLM rerank or summary. Configure under
			<a href="/settings?section=models">Settings → Models</a>.
		</div>
	{/if}

	{#if error}
		<div class="error-banner">
			<strong>Recall failed:</strong>
			{error}
			<button class="link-btn" type="button" on:click={runSearch}>retry</button>
		</div>
	{/if}

	{#if failure}
		<div class="error-banner">
			<strong>Recall failed:</strong>
			{failure.detail ?? failure.error}
			<button class="link-btn" type="button" on:click={runSearch}>retry</button>
		</div>
	{/if}

	{#if loading}
		<div class="loading">Searching… {(elapsedMs / 1000).toFixed(1)}s elapsed</div>
	{:else if success}
		{#if showAuxBanner}
			<div class="aux-banner">
				<strong>No auxiliary model configured.</strong>
				FTS5 hits below, but no LLM summary or rerank. Configure under
				<a href="/settings?section=models">Settings → Models</a>.
			</div>
		{/if}

		{#if success.summary}
			<section class="summary">
				<header>
					<h3>Summary</h3>
					<span class="aux-meta">
						{success.aux_model ?? '—'} · {success.latency_ms} ms
					</span>
				</header>
				<p>{success.summary}</p>
			</section>
		{/if}

		<section class="hits">
			<header>
				<h3>Hits ({success.hits.length})</h3>
				<span class="meta">scope: {success.scope}</span>
			</header>
			{#if success.hits.length === 0}
				<p class="empty">No matches. Try a different query or broaden the scope.</p>
			{:else}
				<ul>
					{#each success.hits as hit (`${hit.source}-${hit.id}`)}
						<li>
							<div class="hit-head">
								<span class="badge {sourceClass(hit)}">{sourceLabel(hit)}</span>
								<span class="hit-id">#{hit.id}</span>
								<span class="score" title="BM25 / FTS5 score">
									score {formatScore(hit.score)}
								</span>
								{#if hit.rerank_score != null}
									<span class="score rerank" title="Aux-LLM rerank score">
										rerank {formatScore(hit.rerank_score)}
									</span>
								{/if}
								{#if hit.outcome}
									<span class="outcome">{hit.outcome}</span>
								{/if}
								<span class="when">{formatTimestamp(hit.created_at)}</span>
							</div>
							{#if hit.snippet}
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<p class="snippet">{@html highlightSnippet(hit.snippet, success.query)}</p>
							{:else if hit.situation}
								<p class="snippet muted">{hit.situation}</p>
							{/if}
							<a class="deep-link" href={hit.deep_link_url}>Open →</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{:else if !error && !failure}
		<div class="empty hero">
			<p>Search past Brain decisions and agent tasks to find similar situations.</p>
			<p class="hint">Press Enter or click Search to run.</p>
		</div>
	{/if}
</div>

<style>
	.recall-tab {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.search {
		background: #0d0d0d;
		border: 1px solid #2a2a2a;
		border-radius: 4px;
		padding: 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.search-row input {
		flex: 1;
		min-width: 240px;
		background: #050505;
		border: 1px solid #333;
		border-radius: 3px;
		color: #e5e5e5;
		padding: 0.5rem 0.625rem;
		font-size: 0.9375rem;
	}

	.search-row input:focus,
	.search-row select:focus {
		outline: none;
		border-color: #4f8df7;
	}

	.search-row select {
		background: #050505;
		border: 1px solid #333;
		border-radius: 3px;
		color: #e5e5e5;
		padding: 0.5rem 0.625rem;
		font-size: 0.875rem;
	}

	.search-row button {
		background: #1a1a1a;
		border: 1px solid #333;
		color: #ddd;
		padding: 0.5rem 1.25rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		min-width: 140px;
	}

	.search-row button.primary {
		background: #1e40af;
		border-color: #1e40af;
		color: #fff;
	}

	.search-row button.primary:hover:not(:disabled) {
		background: #1d4ed8;
	}

	.search-row button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.hint {
		color: #888;
		font-size: 0.75rem;
	}

	.error-banner {
		background: #2a1010;
		border: 1px solid #5a2020;
		color: #f8c0c0;
		padding: 0.625rem 0.875rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.aux-banner {
		background: #2a2410;
		border: 1px solid #5a4a14;
		color: #fde68a;
		padding: 0.625rem 0.875rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.aux-banner a {
		color: #fde68a;
		text-decoration: underline;
	}

	.link-btn {
		background: transparent;
		color: #f8c0c0;
		border: none;
		text-decoration: underline;
		cursor: pointer;
		margin-left: 0.5rem;
		padding: 0;
	}

	.loading,
	.empty {
		color: #888;
		font-size: 0.875rem;
		padding: 1rem;
		text-align: center;
		border: 1px dashed #2a2a2a;
		border-radius: 4px;
	}

	.empty.hero {
		padding: 2rem 1rem;
	}

	.summary {
		background: #0d1320;
		border: 1px solid #1e3a5f;
		border-radius: 4px;
		padding: 0.875rem 1rem;
	}

	.summary header,
	.hits header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.summary h3,
	.hits h3 {
		margin: 0;
		font-size: 0.9375rem;
		color: #ddd;
	}

	.aux-meta,
	.meta {
		color: #888;
		font-size: 0.75rem;
	}

	.summary p {
		margin: 0;
		font-size: 0.9375rem;
		color: #cfd8e8;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.hits ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hits li {
		background: #0d0d0d;
		border: 1px solid #2a2a2a;
		border-radius: 4px;
		padding: 0.625rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hit-head {
		display: flex;
		gap: 0.625rem;
		flex-wrap: wrap;
		align-items: center;
		font-size: 0.8125rem;
	}

	.badge {
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.src-decision {
		background: #1e3a5f;
		color: #93c5fd;
	}

	.src-task {
		background: #14532d;
		color: #86efac;
	}

	.hit-id {
		font-family: 'JetBrains Mono', 'Consolas', monospace;
		color: #ccc;
	}

	.score {
		color: #aaa;
		font-family: 'JetBrains Mono', 'Consolas', monospace;
		font-size: 0.75rem;
	}

	.score.rerank {
		color: #fde68a;
	}

	.outcome {
		color: #ccc;
		font-size: 0.75rem;
		text-transform: uppercase;
	}

	.when {
		color: #666;
		margin-left: auto;
		font-size: 0.75rem;
	}

	.snippet {
		margin: 0;
		font-size: 0.875rem;
		color: #ccc;
		line-height: 1.45;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.snippet.muted {
		color: #888;
		font-style: italic;
	}

	.snippet :global(mark) {
		background: #fde68a;
		color: #1a1300;
		padding: 0 0.15rem;
		border-radius: 2px;
	}

	.deep-link {
		color: #93c5fd;
		text-decoration: none;
		font-size: 0.8125rem;
		align-self: flex-start;
	}

	.deep-link:hover {
		text-decoration: underline;
	}
</style>
