import { describe, expect, it } from 'vitest';

import {
	buildLifecycleStageDescriptors,
	lifecycleActorLabel,
	lifecycleStageLabel,
	normalizeLifecycleStage,
	sortLifecycleEventsDescending,
	summarizeLifecycleEvent,
} from '../lib/utils/lifecyclePresentation';

describe('lifecyclePresentation', () => {
	it('normalizes lifecycle aliases to canonical stages', () => {
		expect(normalizeLifecycleStage('paper_trading')).toBe('paper');
		expect(normalizeLifecycleStage('deployed')).toBe('live_graduated');
		expect(normalizeLifecycleStage('research-only')).toBe('research_only');
		expect(lifecycleStageLabel('quick_screen')).toBe('Quick Screen');
		expect(lifecycleStageLabel('research_only')).toBe('Research Only');
	});

	it('builds stage descriptors around the current stage', () => {
		const descriptors = buildLifecycleStageDescriptors('gauntlet', [
			{ key: 'quick_screen', label: 'Quick Screen' },
			{ key: 'gauntlet', label: 'Gauntlet' },
			{ key: 'paper', label: 'Paper' },
		]);
		expect(descriptors.map((entry) => entry.kind)).toEqual(['past', 'current', 'future']);
	});

	it('sorts and summarizes lifecycle events for timeline display', () => {
		const events = sortLifecycleEventsDescending([
			{
				id: '1',
				strategy_id: 'S1',
				from_state: 'quick_screen',
				to_state: 'gauntlet',
				actor: 'quant_researcher',
				reason: 'Passed gate',
				idempotency_key: null,
				created_at: '2026-03-01T10:00:00Z',
				owner_from: null,
				owner_to: null,
				details_json: null,
			},
			{
				id: '2',
				strategy_id: 'S1',
				from_state: 'gauntlet',
				to_state: 'paper',
				actor: 'system',
				reason: 'Promotion approved',
				idempotency_key: null,
				created_at: '2026-03-02T10:00:00Z',
				owner_from: null,
				owner_to: null,
				details_json: null,
			},
		]);

		expect(events[0].id).toBe('2');
		expect(summarizeLifecycleEvent(events[0])).toMatch(/Gauntlet -> Paper/);
		expect(lifecycleActorLabel(events[0].actor)).toBe('system');
	});
});
