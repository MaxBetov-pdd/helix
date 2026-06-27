<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { addToast } from '$lib/stores/processTracker';

	export let script: string;
	export let filename = '';
	export let warnings: string[] = [];
	/** Optional deep-link attached to copy toasts (e.g. the strategy detail route). */
	export let toastLink: string | undefined = undefined;

	const dispatch = createEventDispatcher<{ close: void }>();
	let copyStatus = '';

	function close(): void {
		dispatch('close');
	}

	async function copy(): Promise<void> {
		if (!script) return;
		try {
			if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(script);
			} else {
				const textarea = document.createElement('textarea');
				textarea.value = script;
				textarea.setAttribute('readonly', 'true');
				textarea.style.position = 'fixed';
				textarea.style.left = '-9999px';
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				textarea.remove();
			}
			copyStatus = 'Copied';
			addToast('TradingView Pine copied', 'success', toastLink);
		} catch (err) {
			copyStatus = 'Copy failed';
			addToast(err instanceof Error ? err.message : 'Copy failed', 'error', toastLink);
		}
	}

	// Focus the Close button on open so keyboard users land inside the modal and Escape
	// works without first tabbing in.
	function autofocusClose(node: HTMLElement) {
		node.focus();
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
	data-testid="tradingview-export-dialog"
	role="presentation"
	on:click={(e) => { if (e.target === e.currentTarget) close(); }}
	on:keydown={(e) => { if (e.key === 'Escape') close(); }}
>
	<div
		class="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[#2b2b2b] bg-[#080808] shadow-2xl"
		role="dialog"
		aria-modal="true"
		aria-labelledby="tv-export-title"
	>
		<div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f1f1f] px-4 py-3">
			<div>
				<div id="tv-export-title" class="text-[10px] uppercase tracking-[0.22em] text-sky-300">TradingView Pine Strategy</div>
				<div class="mt-1 font-mono text-xs text-gray-500">{filename}</div>
			</div>
			<div class="flex items-center gap-2">
				{#if copyStatus}
					<span class="text-[11px] uppercase tracking-wide text-emerald-300">{copyStatus}</span>
				{/if}
				<button
					type="button"
					data-testid="copy-tradingview-script"
					class="rounded border border-emerald-700 bg-emerald-950/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200 transition hover:bg-emerald-900/40"
					on:click={() => void copy()}
				>
					Copy
				</button>
				<button
					type="button"
					data-testid="close-tradingview-export"
					class="rounded border border-[#2b2b2b] bg-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 transition hover:text-white"
					use:autofocusClose
					on:click={close}
				>
					Close
				</button>
			</div>
		</div>
		{#if warnings.length > 0}
			<div class="border-b border-amber-900/30 bg-amber-950/15 px-4 py-2 text-xs text-amber-200">
				{warnings[0]}
			</div>
		{/if}
		<textarea
			data-testid="tradingview-export-script"
			class="min-h-[520px] flex-1 resize-none overflow-auto bg-black p-4 font-mono text-xs leading-relaxed text-gray-200 outline-none"
			readonly
			spellcheck="false"
			value={script}
		></textarea>
	</div>
</div>
