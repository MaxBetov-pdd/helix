<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		listBrainLessons,
		searchBrainLessons,
		createBrainLesson,
		updateBrainLesson,
		deleteBrainLesson,
		validateBrainLesson,
		type BrainLesson,
	} from '$lib/api/brain';
	import BrainLessonCard from './BrainLessonCard.svelte';

	let lessons: BrainLesson[] = [];
	let loading = true;
	let busyIds = new Set<number>();
	let error = '';
	let searchQuery = '';
	let minConfidence = 0;

	// In-page toast + confirm (replaces native window.confirm/alert so the
	// prompts are themed and testable; mirrors BrainMemoryTab).
	let toast = '';
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let confirmMessage = '';
	let confirmResolve: ((ok: boolean) => void) | null = null;

	function showToast(message: string) {
		toast = message;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toast = '';
		}, 5000);
	}

	function askConfirm(message: string): Promise<boolean> {
		confirmMessage = message;
		return new Promise<boolean>((resolve) => {
			confirmResolve = resolve;
		});
	}

	function resolveConfirm(ok: boolean) {
		const resolve = confirmResolve;
		confirmResolve = null;
		confirmMessage = '';
		if (resolve) resolve(ok);
	}

	let editing: BrainLesson | null = null;
	let creating = false;
	let formSituation = '';
	let formLessonText = '';
	let formEvidence = '';
	let formConfidence = 0.5;
	let formError = '';
	let formSaving = false;

	async function load(): Promise<void> {
		loading = true;
		try {
			if (searchQuery.trim()) {
				const res = await searchBrainLessons(searchQuery.trim(), 50);
				lessons = res.items;
			} else {
				const res = await listBrainLessons({ limit: 100, minConfidence });
				lessons = res.items;
			}
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load lessons.';
		} finally {
			loading = false;
		}
	}

	function startCreate(): void {
		editing = null;
		creating = true;
		formSituation = '';
		formLessonText = '';
		formEvidence = '';
		formConfidence = 0.5;
		formError = '';
	}

	function startEdit(lesson: BrainLesson): void {
		creating = false;
		editing = lesson;
		formSituation = lesson.situation_pattern;
		formLessonText = lesson.lesson_text;
		formEvidence = lesson.evidence_decisions.join(', ');
		formConfidence = lesson.confidence;
		formError = '';
	}

	function cancelForm(): void {
		creating = false;
		editing = null;
		formError = '';
	}

	function parseEvidence(raw: string): number[] {
		return raw
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map((s) => Number(s))
			.filter((n) => Number.isFinite(n) && n > 0);
	}

	async function submitForm(): Promise<void> {
		if (!formSituation.trim() || !formLessonText.trim()) {
			formError = 'Situation and lesson text are required.';
			return;
		}
		formSaving = true;
		formError = '';
		try {
			if (editing) {
				await updateBrainLesson(editing.id, {
					situation_pattern: formSituation.trim(),
					lesson_text: formLessonText.trim(),
					confidence: formConfidence,
				});
			} else {
				await createBrainLesson({
					situation_pattern: formSituation.trim(),
					lesson_text: formLessonText.trim(),
					evidence_decisions: parseEvidence(formEvidence),
					confidence: formConfidence,
				});
			}
			cancelForm();
			await load();
		} catch (err) {
			formError = err instanceof Error ? err.message : 'Failed to save lesson.';
		} finally {
			formSaving = false;
		}
	}

	async function handleValidate(lesson: BrainLesson): Promise<void> {
		busyIds = new Set(busyIds).add(lesson.id);
		try {
			await validateBrainLesson(lesson.id);
			await load();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to validate.';
		} finally {
			busyIds = new Set([...busyIds].filter((id) => id !== lesson.id));
		}
	}

	async function handleDelete(lesson: BrainLesson): Promise<void> {
		const ok = await askConfirm(`Delete lesson #${lesson.id}? This cannot be undone.`);
		if (!ok) return;
		busyIds = new Set(busyIds).add(lesson.id);
		try {
			await deleteBrainLesson(lesson.id);
			await load();
			showToast(`Lesson #${lesson.id} deleted.`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete.';
		} finally {
			busyIds = new Set([...busyIds].filter((id) => id !== lesson.id));
		}
	}

	onMount(load);

	onDestroy(() => {
		if (toastTimer) clearTimeout(toastTimer);
		// Reject any in-flight confirm so a pending handler promise can settle.
		if (confirmResolve) resolveConfirm(false);
	});
</script>

<div class="brain-lessons">
	<header class="toolbar">
		<div class="search-row">
			<input
				type="search"
				bind:value={searchQuery}
				on:keydown={(e) => e.key === 'Enter' && load()}
				placeholder="Search situation pattern + lesson text…"
				class="search"
			/>
			<button type="button" on:click={load} class="primary-btn">Search</button>
		</div>
		<div class="filter-row">
			<label class="filter">
				Min confidence:
				<input
					type="range"
					min="0"
					max="1"
					step="0.1"
					bind:value={minConfidence}
					on:change={load}
				/>
				<span class="filter-val">{Math.round(minConfidence * 100)}%</span>
			</label>
			<span class="count">{lessons.length} lesson{lessons.length === 1 ? '' : 's'}</span>
			<button type="button" on:click={startCreate} class="primary-btn">+ New lesson</button>
		</div>
	</header>

	{#if creating || editing}
		<form class="form" on:submit|preventDefault={submitForm}>
			<h3>{editing ? `Edit lesson #${editing.id}` : 'New lesson'}</h3>
			<label>
				<span>Situation pattern</span>
				<input
					type="text"
					bind:value={formSituation}
					placeholder="TRENDING regime with low volume"
					maxlength="500"
				/>
			</label>
			<label>
				<span>Lesson text</span>
				<textarea
					bind:value={formLessonText}
					rows="4"
					placeholder="Skip breakout strategies — they whipsaw without volume confirmation."
					maxlength="2000"
				></textarea>
			</label>
			{#if !editing}
				<label>
					<span>Evidence decision IDs (comma-separated)</span>
					<input type="text" bind:value={formEvidence} placeholder="42, 101, 233" />
				</label>
			{/if}
			<label>
				<span>Confidence: {Math.round(formConfidence * 100)}%</span>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					bind:value={formConfidence}
				/>
			</label>
			{#if formError}
				<div class="form-error">{formError}</div>
			{/if}
			<div class="form-actions">
				<button type="submit" class="primary-btn" disabled={formSaving}>
					{formSaving ? 'Saving…' : editing ? 'Save changes' : 'Create lesson'}
				</button>
				<button type="button" on:click={cancelForm} class="ghost-btn">Cancel</button>
			</div>
		</form>
	{/if}

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if loading}
		<div class="empty">Loading lessons…</div>
	{:else if lessons.length === 0}
		<div class="empty">
			{searchQuery
				? `No lessons match "${searchQuery}".`
				: 'No lessons yet. The Brain captures these from successful and failed cycles.'}
		</div>
	{:else}
		<div class="lesson-grid">
			{#each lessons as lesson (lesson.id)}
				<BrainLessonCard
					{lesson}
					busy={busyIds.has(lesson.id)}
					on:edit={(e) => startEdit(e.detail)}
					on:validate={(e) => handleValidate(e.detail)}
					on:delete={(e) => handleDelete(e.detail)}
				/>
			{/each}
		</div>
	{/if}

	{#if confirmMessage}
		<button
			type="button"
			class="confirm-overlay"
			aria-label="Cancel"
			on:click={() => resolveConfirm(false)}
		></button>
		<div
			class="confirm-dialog"
			role="dialog"
			aria-modal="true"
			aria-label="Confirm"
			tabindex="-1"
		>
			<p>{confirmMessage}</p>
			<div class="confirm-actions">
				<button type="button" class="primary-btn" on:click={() => resolveConfirm(true)}>
					Delete
				</button>
				<button type="button" class="ghost-btn" on:click={() => resolveConfirm(false)}>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	{#if toast}
		<div class="toast">{toast}</div>
	{/if}
</div>

<style>
	.brain-lessons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-row {
		display: flex;
		gap: 0.5rem;
	}

	.search {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: #050505;
		border: 1px solid #2a2a2a;
		border-radius: 0.5rem;
		color: #e5e5e5;
		font-size: 0.875rem;
	}

	.filter-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.filter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #888;
	}

	.filter input[type='range'] {
		width: 120px;
	}

	.filter-val {
		color: #fff;
		min-width: 32px;
	}

	.count {
		font-size: 0.75rem;
		color: #888;
	}

	.primary-btn {
		background: rgba(79, 141, 247, 0.18);
		border: 1px solid rgba(79, 141, 247, 0.4);
		color: #b6cefb;
		padding: 0.4rem 0.8rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.primary-btn:hover:not(:disabled) {
		border-color: #4f8df7;
		color: #fff;
	}

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ghost-btn {
		background: transparent;
		border: 1px solid #2a2a2a;
		color: #888;
		padding: 0.4rem 0.8rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.ghost-btn:hover {
		color: #fff;
		border-color: #fff;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid #2a2a2a;
		border-radius: 0.75rem;
		background: #0a0a0a;
	}

	.form h3 {
		margin: 0;
		font-size: 0.875rem;
		color: #fff;
	}

	.form label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #aaa;
	}

	.form input[type='text'],
	.form textarea {
		padding: 0.5rem 0.75rem;
		background: #050505;
		border: 1px solid #2a2a2a;
		border-radius: 0.5rem;
		color: #e5e5e5;
		font-size: 0.875rem;
		font-family: inherit;
	}

	.form-error {
		color: #f87171;
		font-size: 0.75rem;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
	}

	.lesson-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	@media (min-width: 900px) {
		.lesson-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.error {
		padding: 0.75rem;
		border: 1px solid rgba(248, 113, 113, 0.4);
		background: rgba(248, 113, 113, 0.1);
		border-radius: 0.5rem;
		color: #fca5a5;
		font-size: 0.875rem;
	}

	.empty {
		padding: 2rem;
		text-align: center;
		color: #666;
		font-size: 0.875rem;
	}

	.confirm-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		border: none;
		padding: 0;
		cursor: pointer;
		z-index: 1001;
	}

	.confirm-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #0d0d0d;
		border: 1px solid #2a2a2a;
		border-radius: 0.75rem;
		padding: 1.25rem;
		max-width: 420px;
		width: calc(100% - 2rem);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
		z-index: 1002;
	}

	.confirm-dialog p {
		margin: 0 0 1rem;
		color: #e5e5e5;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.toast {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		background: #1e293b;
		border: 1px solid #334155;
		color: #e5e5e5;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		max-width: 380px;
		z-index: 1000;
	}
</style>
