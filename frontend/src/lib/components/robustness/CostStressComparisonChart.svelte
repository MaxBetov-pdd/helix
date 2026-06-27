<script lang="ts">
	import type { CostStressSnapshot } from '$lib/api/backtesting';

	export let original: CostStressSnapshot | null | undefined = null;
	export let stressed: CostStressSnapshot | null | undefined = null;
	export let width = 500;
	export let height = 220;

	let canvas: HTMLCanvasElement | null = null;

	function draw() {
		if (!canvas || !original || !stressed) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const w = canvas.width, h = canvas.height;
		ctx.clearRect(0, 0, w, h);

		const metrics = [
			{ label: 'Sharpe', orig: Number(original.sharpe || 0), stress: Number(stressed.sharpe || 0) },
			{ label: 'Return', orig: Number(original.total_return || 0) * 100, stress: Number(stressed.total_return || 0) * 100 },
			{ label: 'Max DD', orig: Number(original.max_drawdown || 0) * 100, stress: Number(stressed.max_drawdown || 0) * 100 },
			{ label: 'Win Rate', orig: Number(original.win_rate || 0) * 100, stress: Number(stressed.win_rate || 0) * 100 },
		];

		const pad = { top: 30, right: 20, bottom: 40, left: 50 };
		const chartW = w - pad.left - pad.right;
		const chartH = h - pad.top - pad.bottom;
		const groupW = chartW / metrics.length;
		const barW = groupW * 0.3;
		const maxVal = Math.max(...metrics.map(m => Math.max(Math.abs(m.orig), Math.abs(m.stress))), 0.01);

		ctx.fillStyle = '#fff';
		ctx.font = 'bold 11px monospace';
		ctx.textAlign = 'center';
		ctx.fillText('Original vs Stressed', w / 2, 16);

		const zeroY = pad.top + chartH / 2;
		ctx.strokeStyle = '#333';
		ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(pad.left, zeroY); ctx.lineTo(w - pad.right, zeroY); ctx.stroke();

		metrics.forEach((m, i) => {
			const cx = pad.left + i * groupW + groupW / 2;
			const scaleY = (val: number) => zeroY - (val / maxVal) * (chartH / 2);
			const oy = scaleY(m.orig);
			ctx.fillStyle = 'rgba(34,197,94,0.7)';
			ctx.fillRect(cx - barW - 1, Math.min(oy, zeroY), barW, Math.abs(oy - zeroY));
			const sy = scaleY(m.stress);
			ctx.fillStyle = 'rgba(239,68,68,0.7)';
			ctx.fillRect(cx + 1, Math.min(sy, zeroY), barW, Math.abs(sy - zeroY));
			ctx.fillStyle = '#9ca3af';
			ctx.font = '10px monospace';
			ctx.textAlign = 'center';
			ctx.fillText(m.label, cx, h - pad.bottom + 14);
			ctx.font = '9px monospace';
			ctx.fillStyle = '#4ade80';
			ctx.fillText(m.orig.toFixed(1), cx - barW / 2 - 1, Math.min(oy, zeroY) - 3);
			ctx.fillStyle = '#f87171';
			ctx.fillText(m.stress.toFixed(1), cx + barW / 2 + 1, Math.min(sy, zeroY) - 3);
		});

		ctx.font = '9px monospace';
		ctx.fillStyle = '#4ade80'; ctx.fillRect(w - 130, 8, 8, 8);
		ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'left'; ctx.fillText('Original', w - 118, 16);
		ctx.fillStyle = '#f87171'; ctx.fillRect(w - 65, 8, 8, 8);
		ctx.fillStyle = '#9ca3af'; ctx.fillText('Stressed', w - 53, 16);
	}

	// Redraw whenever the canvas mounts or the snapshots change.
	$: if (canvas && original && stressed) {
		void [original, stressed, width, height];
		draw();
	}
</script>

<canvas bind:this={canvas} {width} {height} class="cursor-crosshair"></canvas>
