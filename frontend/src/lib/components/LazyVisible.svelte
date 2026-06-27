<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	/** Extra margin around the viewport to trigger early (default 200px). */
	export let rootMargin: string = '200px';

	let visible = false;
	let sentinel: HTMLDivElement;
	let observer: IntersectionObserver | null = null;

	onMount(() => {
		if (!sentinel) return;
		observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					visible = true;
					observer?.disconnect();
					observer = null;
				}
			},
			{ rootMargin },
		);
		observer.observe(sentinel);
	});

	onDestroy(() => {
		observer?.disconnect();
		observer = null;
	});
</script>

<div bind:this={sentinel} class="contents">
	{#if visible}
		<slot />
	{/if}
</div>
