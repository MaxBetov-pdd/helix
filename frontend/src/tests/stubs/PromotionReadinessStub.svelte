<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { QuickScreenEvidenceRow } from '$lib/utils/quickScreenReadiness';

	export let strategyId = '';
	export let quickScreenRows: QuickScreenEvidenceRow[] = [];

	const dispatch = createEventDispatcher<{ action: { action: string; strategyId: string } }>();

	function emit(action: string): void {
		dispatch('action', { action, strategyId });
	}
</script>

<div data-testid="promotion-readiness-stub">
	<div data-testid="stub-quick-screen-row-count">{quickScreenRows.length}</div>
	<div data-testid="stub-quick-screen-first-label">{quickScreenRows[0]?.label ?? 'none'}</div>
	<button type="button" data-testid="trigger-validation-suite" on:click={() => emit('run_validation_suite')}>
		Run Validation Suite
	</button>
	<button type="button" data-testid="trigger-confirmation-backtest" on:click={() => emit('run_confirmation_backtest')}>
		Run Confirmation Backtest
	</button>
</div>
