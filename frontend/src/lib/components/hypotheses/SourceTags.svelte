<script lang="ts">
	export let tags: string[] = [];
	export let size: 'sm' | 'md' = 'sm';

	type Palette = {
		label: string;
		classes: string;
	};

	// Keep these distinctive enough to spot in a dense list but tonally consistent
	// with the surrounding dark UI. One entry per source type we know about.
	const PALETTE: Record<string, Palette> = {
		youtube: { label: 'YouTube', classes: 'border-rose-500/60 bg-rose-950/40 text-rose-100' },
		reddit: { label: 'Reddit', classes: 'border-orange-500/60 bg-orange-950/40 text-orange-100' },
		github: { label: 'GitHub', classes: 'border-slate-500/60 bg-slate-800/60 text-slate-100' },
		blog: { label: 'Blog', classes: 'border-cyan-500/60 bg-cyan-950/40 text-cyan-100' },
		forum: { label: 'Forum', classes: 'border-purple-500/60 bg-purple-950/40 text-purple-100' },
	};

	function palette(tag: string): Palette {
		const key = tag.toLowerCase();
		return PALETTE[key] ?? { label: key, classes: 'border-gray-500/60 bg-gray-900/50 text-gray-200' };
	}

	$: sizeClass = size === 'md' ? 'px-2.5 py-1 text-[10px]' : 'px-2 py-0.5 text-[10px]';
</script>

{#if tags.length > 0}
	<div class="flex flex-wrap items-center gap-1.5">
		{#each tags as tag}
			{@const p = palette(tag)}
			<span class={`inline-flex border ${sizeClass} font-semibold uppercase tracking-[0.18em] ${p.classes}`}>
				{p.label}
			</span>
		{/each}
	</div>
{/if}
