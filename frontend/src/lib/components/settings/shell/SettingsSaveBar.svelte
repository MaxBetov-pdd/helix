<script lang="ts">
	import {
		dirtyFields,
		originalValues,
		clearDirty,
		groupDirtyByBackendSection,
		listEmptyNumericDirtyFields,
	} from '$lib/settings/dirty';
	import { updateSettingsSection } from '$lib/api';

	export let currentValues: Record<string, unknown>;

	let saving = false;
	let error: string | null = null;

	$: count = $dirtyFields.size;
	$: hidden = count === 0;

	async function saveAll() {
		saving = true;
		error = null;
		const savingIds = new Set($dirtyFields);
		if (savingIds.size === 0) {
			saving = false;
			return;
		}
		const snapshot: Record<string, unknown> = {};
		for (const id of savingIds) snapshot[id] = currentValues[id];
		// Refuse to submit empty numeric fields — a persisted null silently
		// poisons backend configs. Mirror of the backend's 400 on null leaves.
		const emptyNumeric = listEmptyNumericDirtyFields(snapshot);
		if (emptyNumeric.length > 0) {
			saving = false;
			error = `${emptyNumeric.map((f) => `'${f.label}'`).join(', ')} ${
				emptyNumeric.length === 1 ? 'is' : 'are'
			} empty — enter a number or revert`;
			return;
		}
		const grouped = groupDirtyByBackendSection(snapshot);
		if (Object.keys(grouped).length === 0) {
			saving = false;
			error = 'No saveable fields';
			return;
		}
		const results = await Promise.allSettled(
			Object.entries(grouped).map(([section, payload]) =>
				updateSettingsSection(section, payload),
			),
		);
		const failed = results.filter((r) => r.status === 'rejected');
		saving = false;
		if (failed.length === 0) {
			originalValues.update((o) => ({ ...o, ...snapshot }));
			dirtyFields.update((set) => {
				const next = new Set(set);
				for (const id of savingIds) next.delete(id);
				return next;
			});
		} else {
			error = `${failed.length} section(s) failed to save`;
		}
	}

	function revertAll() {
		clearDirty();
	}
</script>

{#if !hidden}
	<div
		class="fixed bottom-0 inset-x-0 z-40 bg-gray-950 border-t border-gray-800 py-3 px-6 flex items-center justify-between"
	>
		<span class="text-sm text-amber-400"
			>{count} unsaved change{count === 1 ? '' : 's'}</span
		>
		<div class="flex items-center gap-2">
			{#if error}<span class="text-xs text-red-400">{error}</span>{/if}
			<button
				type="button"
				on:click={revertAll}
				disabled={saving}
				class="text-xs text-gray-400 hover:text-white px-3 py-1.5"
			>
				Revert all
			</button>
			<button
				type="button"
				on:click={saveAll}
				disabled={saving}
				class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded"
			>
				{saving ? 'Saving…' : 'Save all'}
			</button>
		</div>
	</div>
{/if}
