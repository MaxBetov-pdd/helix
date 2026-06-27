<script lang="ts">
  import { SETTINGS_AREAS } from '$lib/settings/manifest';
  export let active: string;
  export let onChange: (id: string) => void = () => {};
</script>

<nav class="flex flex-col gap-1 p-2 border-r border-gray-800 min-w-[14rem] sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
  {#each SETTINGS_AREAS as area (area.id)}
    <button
      type="button"
      aria-current={active === area.id ? 'page' : undefined}
      on:click={() => onChange(area.id)}
      class="text-left text-sm px-3 py-2 rounded transition-colors {
        active === area.id
          ? (area.danger ? 'bg-red-950 text-red-300' : 'bg-gray-800 text-white')
          : (area.danger ? 'text-red-400 hover:text-red-300 hover:bg-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-900')
      }"
    >
      {area.label}
    </button>
  {/each}
</nav>
