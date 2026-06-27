<script lang="ts">
  import { SETTINGS_MANIFEST, SETTINGS_SUBSECTIONS, type SettingsEntry } from '$lib/settings/manifest';
  import { searchSettings } from '$lib/settings/search';

  export let onPick: ((entry: SettingsEntry) => void) | undefined = undefined;

  let query = '';
  let highlightIndex = -1;
  let wrapperEl: HTMLDivElement;

  $: results = searchSettings(SETTINGS_MANIFEST, query).slice(0, 8);
  $: showDropdown = query.trim().length > 0;
  // Reset highlight whenever the query changes.
  $: query, (highlightIndex = -1);

  const subMap = new Map(SETTINGS_SUBSECTIONS.map((s) => [s.id, s]));

  function pick(entry: SettingsEntry) {
    if (typeof window !== 'undefined') {
      window.location.hash = `#${entry.area}/${entry.id}`;
    }
    onPick?.(entry);
    query = '';
    highlightIndex = -1;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length > 0) {
        highlightIndex = (highlightIndex + 1) % results.length;
      }
    } else if (event.key === 'ArrowUp') {
      if (results.length === 0) return;
      event.preventDefault();
      highlightIndex = highlightIndex <= 0 ? results.length - 1 : highlightIndex - 1;
    } else if (event.key === 'Enter') {
      if (highlightIndex >= 0 && highlightIndex < results.length) {
        event.preventDefault();
        pick(results[highlightIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      query = '';
      highlightIndex = -1;
    }
  }

  function handleFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || (wrapperEl && !wrapperEl.contains(next))) {
      query = '';
      highlightIndex = -1;
    }
  }
</script>

<div class="relative" bind:this={wrapperEl} on:focusout={handleFocusout}>
  <input
    type="search"
    bind:value={query}
    on:keydown={handleKeydown}
    placeholder="Search settings…"
    role="combobox"
    aria-expanded={showDropdown && results.length > 0}
    aria-controls="settings-search-results"
    aria-autocomplete="list"
    aria-activedescendant={highlightIndex >= 0 && results[highlightIndex]
      ? `settings-search-option-${results[highlightIndex].id}`
      : undefined}
    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
  />
  {#if showDropdown}
    <ul
      id="settings-search-results"
      role="listbox"
      class="absolute z-30 left-0 right-0 mt-1 bg-gray-950 border border-gray-800 rounded shadow-lg max-h-96 overflow-y-auto"
    >
      {#if results.length === 0}
        <li class="px-3 py-2 text-xs text-gray-500">No matches</li>
      {:else}
        {#each results as entry, i (entry.id)}
          <li
            role="option"
            id={`settings-search-option-${entry.id}`}
            aria-selected={i === highlightIndex}
          >
            <button
              type="button"
              on:click={() => pick(entry)}
              class="w-full text-left px-3 py-2 hover:bg-gray-900 text-sm text-gray-200"
              class:bg-gray-800={i === highlightIndex}
            >
              <span class="text-gray-500 text-xs"
                >{entry.area} › {subMap.get(entry.subsection)?.label ?? entry.subsection}</span
              >
              <span class="block">{entry.label}</span>
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  {/if}
</div>
