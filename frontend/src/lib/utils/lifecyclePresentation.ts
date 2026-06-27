import type { LifecycleEvent } from '$lib/api';

export interface LifecycleStageDescriptor {
	key: string;
	label: string;
	kind: 'past' | 'current' | 'future' | 'terminal';
	tooltip?: string;
}

const STAGE_ALIASES: Record<string, string> = {
	researching: 'quick_screen',
	developing: 'quick_screen',
	ideation: 'quick_screen',
	candidate: 'quick_screen',
	generated: 'quick_screen',
	research_only: 'research_only',
	'research-only': 'research_only',
	backtesting: 'gauntlet',
	testing: 'gauntlet',
	validation: 'gauntlet',
	ranked: 'gauntlet',
	paper_trading: 'paper',
	papertrading: 'paper',
	'paper-trading': 'paper',
	paper_queued: 'paper',
	paper_running: 'paper',
	paper_evaluated: 'paper',
	paper_staging: 'paper',
	deployed: 'live_graduated',
	live: 'live_graduated',
	execution: 'live_graduated',
	review: 'live_graduated',
	promoted: 'live_graduated',
	retired: 'archived',
	trash: 'archived',
	killed: 'archived',
	deprecated: 'archived',
	failed: 'rejected',
};

const STAGE_LABELS: Record<string, string> = {
	quick_screen: 'Quick Screen',
	research_only: 'Research Only',
	gauntlet: 'Gauntlet',
	paper: 'Paper',
	live_graduated: 'Live',
	rejected: 'Rejected',
	archived: 'Archived',
};

export function normalizeLifecycleStage(value: string | null | undefined): string {
	const normalized = String(value ?? '').trim().toLowerCase();
	if (!normalized) return '';
	return STAGE_ALIASES[normalized] ?? normalized;
}

export function lifecycleStageLabel(value: string | null | undefined): string {
	const normalized = normalizeLifecycleStage(value);
	if (!normalized) return '--';
	return STAGE_LABELS[normalized] ?? normalized.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export function buildLifecycleStageDescriptors(
	currentState: string | null | undefined,
	stages: ReadonlyArray<{ key: string; label: string; tooltip?: string }>,
): LifecycleStageDescriptor[] {
	const normalizedCurrent = normalizeLifecycleStage(currentState);
	const currentIndex = stages.findIndex((stage) => stage.key === normalizedCurrent);

	return stages.map((stage, index) => ({
		key: stage.key,
		label: stage.label,
		tooltip: stage.tooltip,
		kind:
			normalizedCurrent === 'rejected' || normalizedCurrent === 'archived'
				? 'future'
				: currentIndex === index
					? 'current'
					: currentIndex > index
						? 'past'
						: 'future',
	}));
}

export function summarizeLifecycleEvent(event: LifecycleEvent): string {
	const fromLabel = lifecycleStageLabel(event.from_state);
	const toLabel = lifecycleStageLabel(event.to_state);
	if (event.reason && event.reason.trim()) {
		return `${fromLabel} -> ${toLabel}: ${event.reason.trim()}`;
	}
	return `${fromLabel} -> ${toLabel}`;
}

export function lifecycleActorLabel(actor: string | null | undefined): string {
	const normalized = String(actor ?? '').trim();
	if (!normalized) return 'system';
	return normalized.replace(/[_-]+/g, ' ');
}

export function sortLifecycleEventsDescending(events: LifecycleEvent[]): LifecycleEvent[] {
	return [...events].sort((left, right) => {
		const leftTs = Date.parse(left.created_at || '');
		const rightTs = Date.parse(right.created_at || '');
		return rightTs - leftTs;
	});
}
