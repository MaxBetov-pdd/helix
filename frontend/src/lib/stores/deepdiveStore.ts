import { writable } from 'svelte/store';
import { openAssistant } from './assistantUI';
import { setPageContext } from './pageContext';

export type DeepdiveTarget = {
	open: boolean;
	strategyId: string;
	strategyName: string;
};

// Retained for backward compatibility with any legacy reader. The unified
// assistant now drives strategy "deepdive" via page context + the global panel.
export const deepdiveTarget = writable<DeepdiveTarget>({
	open: false,
	strategyId: '',
	strategyName: '',
});

/**
 * Focus the unified assistant on a strategy and open it. The strategy becomes
 * the page-context entity so "this strategy" / "it" resolve to it, and the
 * assistant's strategy-scoped tools (detail, backtest, improve) apply.
 */
export function openDeepdive(strategyId: string, strategyName: string = ''): void {
	deepdiveTarget.set({ open: true, strategyId, strategyName });
	setPageContext({
		page_kind: 'strategy_detail',
		entity: { type: 'strategy', id: strategyId, label: strategyName || strategyId },
	});
	openAssistant();
}

export function closeDeepdive(): void {
	deepdiveTarget.update((s) => ({ ...s, open: false }));
}
