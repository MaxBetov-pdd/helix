import { derived } from 'svelte/store';
import { helixDashboard } from './helix';

export const simulationActive = derived(helixDashboard, ($d) =>
	Boolean($d?.simulation_active)
);

export const simulationPhase = derived(helixDashboard, ($d) =>
	$d?.simulation_phase || 'idle'
);

export const simulationTime = derived(helixDashboard, ($d) =>
	$d?.simulation_time || ''
);

export const simulationProgress = derived(helixDashboard, ($d) =>
	$d?.simulation_progress || 0
);

export const simulationPrices = derived(helixDashboard, ($d) =>
	$d?.simulation_prices || {}
);
