<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SETTINGS_MANIFEST,
		SETTINGS_SUBSECTIONS,
		type SettingsEntry,
	} from '$lib/settings/manifest';
	import SettingsSubsection from '$lib/components/settings/primitives/SettingsSubsection.svelte';
	import SettingsFieldRow from '$lib/components/settings/primitives/SettingsFieldRow.svelte';
	import SettingsAdvancedHeader from '$lib/components/settings/primitives/SettingsAdvancedHeader.svelte';
	import { originalValues, pendingValues } from '$lib/settings/dirty';

	export let settings: Record<string, unknown>;
	export let currentValues: Record<string, unknown> = {};

	const AREA = 'data' as const;

	const subs = SETTINGS_SUBSECTIONS.filter((s) => s.area === AREA);
	const areaEntries = SETTINGS_MANIFEST.filter((e) => e.area === AREA);
	$: entriesBySub = Object.fromEntries(
		subs.map((s) => [s.id, areaEntries.filter((e) => e.subsection === s.id)]),
	) as Record<string, SettingsEntry[]>;

	function readByPath(obj: unknown, path: string): unknown {
		return path
			.split('.')
			.reduce<any>((cursor, key) => (cursor == null ? undefined : cursor[key]), obj);
	}

	function initialValue(entry: SettingsEntry): unknown {
		const v = readByPath(settings, entry.backendPath);
		return v === undefined ? entry.default : v;
	}

	onMount(() => {
		const origSeed: Record<string, unknown> = {};
		for (const e of areaEntries) origSeed[e.id] = initialValue(e);
		originalValues.update((o) => ({ ...o, ...origSeed }));
	});

	$: {
		const originals: Record<string, unknown> = {};
		for (const e of areaEntries) originals[e.id] = initialValue(e);
		const pend = $pendingValues;
		const areaPending: Record<string, unknown> = {};
		for (const e of areaEntries) {
			if (e.id in pend) areaPending[e.id] = pend[e.id];
		}
		currentValues = { ...currentValues, ...originals, ...areaPending };
	}

	function displayValue(entry: SettingsEntry): unknown {
		const pend = $pendingValues;
		if (entry.id in pend) return pend[entry.id];
		return initialValue(entry);
	}
</script>

<div class="space-y-6">
	{#each subs as sub (sub.id)}
		{@const entries = entriesBySub[sub.id] ?? []}
		{@const usedBy = [...new Set(entries.flatMap((e) => e.usedBy))]}
		<SettingsSubsection
			label={sub.label}
			description={sub.description ?? ''}
			deepLinkTo={sub.deepLinkTo}
			{usedBy}
		>
			{#if sub.advanced}<SettingsAdvancedHeader />{/if}
			{#each entries as entry (entry.id)}
				<SettingsFieldRow
					id={entry.id}
					label={entry.label}
					description={entry.description}
					unit={entry.unit}
					defaultValue={entry.default}
					value={displayValue(entry)}
					type={entry.type}
					options={entry.options ?? []}
				/>
			{/each}
		</SettingsSubsection>
	{/each}
</div>
