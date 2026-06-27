<script lang="ts">
	export let message = 'Loading...';
	export let compact = true;
</script>

<div class={`text-xs text-gray-500 ${compact ? '' : 'py-6'}`} role="status" aria-live="polite">
	<span class="inline-flex items-center gap-2">
		<span class="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse"></span>
		{message}
	</span>
</div>
