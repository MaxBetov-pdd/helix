<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let message = '';
	export let tone: 'error' | 'warning' | 'info' = 'error';
	export let dismissible = false;

	const dispatch = createEventDispatcher<{ dismiss: void }>();

	const toneClasses: Record<typeof tone, string> = {
		error: 'text-red-300 border-red-900 bg-red-950/30',
		warning: 'text-yellow-300 border-yellow-900 bg-yellow-950/30',
		info: 'text-cyan-300 border-cyan-900 bg-cyan-950/30',
	};

	$: classes = toneClasses[tone] ?? toneClasses.error;
</script>

{#if message}
	<div class={`text-xs border px-3 py-2 rounded ${classes}`} role="alert">
		<div class="flex items-center gap-2">
			<span class="flex-1">{message}</span>
			{#if dismissible}
				<button
					type="button"
					class="text-[10px] uppercase tracking-wider opacity-80 hover:opacity-100"
					on:click={() => dispatch('dismiss')}
				>
					Dismiss
				</button>
			{/if}
		</div>
	</div>
{/if}
