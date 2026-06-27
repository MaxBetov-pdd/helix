<script lang="ts">
	export let tier: string = 'weak';

	function getConfig(t: string): { label: string; bg: string; text: string; border: string } {
		if (t === 'elite') return { label: 'E', bg: 'bg-emerald-900/60', text: 'text-emerald-300', border: 'border-emerald-600' };
		if (t === 'strong') return { label: 'S', bg: 'bg-blue-900/60', text: 'text-blue-300', border: 'border-blue-600' };
		if (t === 'marginal') return { label: 'M', bg: 'bg-yellow-900/60', text: 'text-yellow-300', border: 'border-yellow-600' };
		return { label: 'W', bg: 'bg-red-900/40', text: 'text-red-400', border: 'border-red-800' };
	}

	$: cfg = getConfig(tier);
</script>

<span
	class="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border {cfg.bg} {cfg.text} {cfg.border}"
	title="{tier.charAt(0).toUpperCase() + tier.slice(1)} tier"
>{cfg.label}</span>
