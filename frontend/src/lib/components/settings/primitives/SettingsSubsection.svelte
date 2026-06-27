<script lang="ts">
  export let label: string;
  export let description: string;
  export let deepLinkTo: string | undefined = undefined;
  export let usedBy: string[] = [];
  let usedByOpen = false;
</script>

<section class="bg-black border border-gray-800 rounded-lg p-6 space-y-4">
  <header class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
    <h2 class="text-lg font-semibold text-white">{label}</h2>
    {#if deepLinkTo}
      <a href={deepLinkTo} class="text-xs text-blue-400 hover:underline">→ {deepLinkTo}</a>
    {/if}
  </header>
  <p class="text-sm text-gray-400">{description}</p>
  {#if usedBy.length}
    <button
      type="button"
      aria-expanded={usedByOpen}
      aria-controls={`used-by-${label}`}
      on:click={() => (usedByOpen = !usedByOpen)}
      class="text-xs text-gray-500 hover:text-gray-300"
    >
      Used by <span aria-hidden="true">{usedByOpen ? '▾' : '▸'}</span>
    </button>
    {#if usedByOpen}
      <ul id={`used-by-${label}`} class="text-xs text-gray-400 pl-4 space-y-1">
        {#each usedBy as reader}<li>{reader}</li>{/each}
      </ul>
    {/if}
  {/if}
  <div class="space-y-1"><slot /></div>
</section>
