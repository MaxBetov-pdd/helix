const fs = require('fs');

const path = 'frontend/src/routes/pipeline/+page.svelte';
let content = fs.readFileSync(path, 'utf8');

// 1. Add getApprovals, handoffApproval imports
content = content.replace(
    'handoffStrategy,',
    'handoffStrategy,\n\t\tgetApprovals,\n\t\thandoffApproval,'
);

// 2. Add 'issue' to PipelineCardKind
content = content.replace(
    "type PipelineCardKind = 'strategy' | 'backtest';",
    "type PipelineCardKind = 'strategy' | 'backtest' | 'issue';"
);

// 3. Update loadPipelineData Promise.allSettled
content = content.replace(
    'getResults(undefined, undefined, 200),',
    'getResults(undefined, undefined, 200),\n\t\t\tgetApprovals({ status: \'pending_approval\' }),'
);

content = content.replace(
    'const backtestData = resultDataResult.status === \'fulfilled\' ? asRecordList(resultDataResult.value) : [];',
    `const backtestData = resultDataResult.status === 'fulfilled' ? asRecordList(resultDataResult.value) : [];
\t\tconst approvalsData = approvalsResult.status === 'fulfilled' ? asRecordList(approvalsResult.value) : [];`
);

content = content.replace(
    /\] = await Promise\.allSettled\(\[/,
    `	approvalsResult,
		] = await Promise.allSettled([`
);

// 4. Map approvalsData to nextStrategies
const mapApprovals = `
		for (const raw of approvalsData) {
			const id = String(raw.id || '').trim();
			if (!id) continue;
			const owner = normalizeOwner((raw as { owner?: unknown }).owner || 'ceo');
			nextStrategies.push({
				id: \`approval-\${id}\`,
				name: String((raw as { reason?: string }).reason || (raw as { approval_type?: string }).approval_type || 'Action Required').trim(),
				kind: 'issue',
				symbol: '',
				timeframe: '',
				state: String((raw as { status?: string }).status || 'pending_approval'),
				bucket: owner,
				owner,
				source: 'CORE',
				metrics: { sharpe_ratio: null, win_rate: null, profit_factor: null },
			});
		}
`;
content = content.replace(
    'strategies = nextStrategies;',
    mapApprovals + '\n\t\tstrategies = nextStrategies;'
);

// 5. Add Drag and Drop handlers
const dndHandlers = `
	let draggedStrategy: PipelineCard | null = null;

	function handleDragStart(e: DragEvent, strategy: PipelineCard) {
		draggedStrategy = strategy;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', strategy.id);
		}
	}

	async function handleDrop(e: DragEvent, toOwner: PipelineOwner) {
		if (!draggedStrategy) return;
		const strategy = draggedStrategy;
		draggedStrategy = null;

		if (strategy.owner === toOwner) return;

		setStrategyBusy(strategy.id, true);
		error = '';

		try {
			if (strategy.kind === 'issue') {
				const approvalId = parseInt(strategy.id.replace('approval-', ''), 10);
				await handoffApproval(approvalId, {
					to_owner: toOwner,
					reason: \`Handoff to \${toOwner} via pipeline\`
				});
			} else if (strategy.kind === 'strategy') {
				// We can't easily handoff backtests unless they are promoted, so we only handle strategy kind.
				// Wait, the API supports handoffStrategy for strategies.
				const realId = strategy.id;
				await handoffStrategy(realId, {
					toOwner,
					toStatus: strategy.state,
					fromOwner: strategy.owner,
					reason: \`Handoff to \${toOwner} via pipeline drag-and-drop\`,
					append: true,
				});
			}
			await loadPipelineData();
		} catch (err) {
			error = err instanceof Error ? err.message : \`Failed to handoff to \${toOwner}\`;
		} finally {
			setStrategyBusy(strategy.id, false);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}
`;
content = content.replace(
    'function formatPct(value: number | null | undefined): string {',
    dndHandlers + '\n\tfunction formatPct(value: number | null | undefined): string {'
);

// 6. Update template for DnD
content = content.replace(
    '<div class="px-3 py-2 border-b border-[#222] flex items-center justify-between">',
    `<div class="border border-[#333] bg-[#0d0d0d] rounded flex flex-col min-h-[520px]"
					on:dragover={handleDragOver}
					on:drop={(e) => handleDrop(e, column.id)}
				>
					<div class="px-3 py-2 border-b border-[#222] flex items-center justify-between">`
);

// We need to remove the original opening div
content = content.replace(
    /<div class="border border-\[#333\] bg-\[#0d0d0d\] rounded flex flex-col min-h-\[520px\]">\s*<div class="border border-\[#333\] bg-\[#0d0d0d\] rounded flex flex-col min-h-\[520px\]"/,
    '<div class="border border-[#333] bg-[#0d0d0d] rounded flex flex-col min-h-[520px]"'
);

content = content.replace(
    '{@const perf = perfByName.get(strategy.name) || perfByName.get(strategy.id)}',
    `{@const perf = perfByName.get(strategy.name) || perfByName.get(strategy.id)}
							<div
								draggable="true"
								on:dragstart={(e) => handleDragStart(e, strategy)}
								class="border border-[#262626] bg-[#090909] rounded p-3 relative max-w-[360px] w-full mx-auto cursor-grab active:cursor-grabbing hover:border-[#555] transition-colors"
								class:opacity-50={isStrategyBusy(strategy.id)}
							>`
);

content = content.replace(
    '<div class="border border-[#262626] bg-[#090909] rounded p-3 relative max-w-[360px] w-full mx-auto">',
    ''
);

// Add styling for issue cards
content = content.replace(
    '{strategy.source === \'CORE\' ? \'bg-[#333] text-gray-300\' : \'bg-[#1a1a1a] text-gray-500\'}',
    '{strategy.kind === \'issue\' ? \'bg-orange-950/30 text-orange-400 border border-orange-800/50\' : (strategy.source === \'CORE\' ? \'bg-[#333] text-gray-300\' : \'bg-[#1a1a1a] text-gray-500\')}'
);
content = content.replace(
    '{strategy.source}',
    '{strategy.kind === \'issue\' ? \'ISSUE\' : strategy.source}'
);

fs.writeFileSync(path, content, 'utf8');
