<script lang="ts">
	import type { RegimeSplitEntry } from '$lib/api/backtesting';

	export let regimes: RegimeSplitEntry[] = [];
	export let width = 600;
	export let height = 220;

	let canvas: HTMLCanvasElement | null = null;

	function draw() {
		if (!canvas || !regimes?.length) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const w = canvas.width, h = canvas.height;
		ctx.clearRect(0, 0, w, h);

		const pad = { top: 30, right: 20, bottom: 45, left: 55 };
		const chartW = w - pad.left - pad.right;
		const chartH = h - pad.top - pad.bottom;
		const barW = Math.min(60, chartW / regimes.length - 10);
		const maxPnl = Math.max(...regimes.map((r) => Math.abs(Number(r.total_pnl || 0))), 1);

		ctx.fillStyle = '#fff';
		ctx.font = 'bold 11px monospace';
		ctx.textAlign = 'center';
		ctx.fillText('PnL & Win Rate by Regime', w / 2, 16);

		const zeroY = pad.top + chartH / 2;
		ctx.strokeStyle = '#333';
		ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(pad.left, zeroY); ctx.lineTo(w - pad.right, zeroY); ctx.stroke();

		const groupW = chartW / regimes.length;
		regimes.forEach((r, i: number) => {
			const cx = pad.left + i * groupW + groupW / 2;
			const pnl = Number(r.total_pnl || 0);
			const winRate = Number(r.win_rate || 0);
			const scaleY = (val: number) => zeroY - (val / maxPnl) * (chartH / 2);
			const by = scaleY(pnl);
			ctx.fillStyle = pnl >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)';
			ctx.fillRect(cx - barW / 2, Math.min(by, zeroY), barW, Math.abs(by - zeroY));
			ctx.beginPath();
			ctx.arc(cx, pad.top + chartH - (winRate / 100) * chartH, 4, 0, Math.PI * 2);
			ctx.fillStyle = '#fbbf24';
			ctx.fill();
			ctx.fillStyle = '#9ca3af';
			ctx.font = '9px monospace';
			ctx.textAlign = 'center';
			const shortName = String(r.name || '').replace('TREND_', '').replace('RANGE_', 'RNG_').replace('HIGH_', 'H_');
			ctx.fillText(shortName, cx, h - pad.bottom + 12);
			ctx.fillText(`${r.trade_count}t`, cx, h - pad.bottom + 24);
			ctx.fillStyle = pnl >= 0 ? '#4ade80' : '#f87171';
			ctx.fillText(`$${pnl.toFixed(0)}`, cx, Math.min(by, zeroY) - 4);
		});

		ctx.font = '9px monospace';
		ctx.fillStyle = '#4ade80'; ctx.fillRect(w - 150, 8, 8, 8);
		ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'left'; ctx.fillText('Total PnL', w - 138, 16);
		ctx.fillStyle = '#fbbf24';
		ctx.beginPath(); ctx.arc(w - 65, 12, 3, 0, Math.PI * 2); ctx.fill();
		ctx.fillStyle = '#9ca3af'; ctx.fillText('Win Rate', w - 58, 16);
	}

	// Redraw whenever the canvas mounts or the regimes change.
	$: if (canvas && regimes?.length) {
		void [regimes, width, height];
		draw();
	}
</script>

<canvas bind:this={canvas} {width} {height} class="cursor-crosshair"></canvas>
