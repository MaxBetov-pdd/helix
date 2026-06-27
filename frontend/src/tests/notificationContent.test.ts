import { describe, expect, it } from 'vitest';

import { formatNotificationContent } from '$lib/utils/notificationContent';

describe('formatNotificationContent', () => {
	it('dedupes repeated paragraphs and extracts structured post-mortem content', () => {
		const formatted = formatNotificationContent({
			summary: 'Now let me provide the final post-mortem output:',
			body: `
Now let me provide the final post-mortem output:

### POST-MORTEM: Strategy Container S100218

**Primary Failure Cause**: The strategy suffered a catastrophic 2.11-point Sharpe collapse from in-sample (1.25) to out-of-sample (-0.86), revealing severe overfitting.

**Supporting Evidence**: IS Sharpe: 1.247 -> OOS Sharpe: -0.857 (164% degradation) | Robustness: 68.7/100 | Return: -24.72% | MaxDD: 43.92% | PF: 0.83 | WinRate: 62.90% | Trades: 62

**Corrective Action**: ARCHIVE PERMANENTLY. This strategy represents a fundamentally broken approach.

**Preventive Guardrails**: Reject strategies with OOS Sharpe <0.5 before gauntlet entry.

**Preventive Guardrails**: Reject strategies with OOS Sharpe <0.5 before gauntlet entry.
			`,
		});

		expect(formatted.summary).toContain('Primary Failure Cause');
		expect(formatted.sections).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ label: 'Primary Failure Cause' }),
				expect.objectContaining({ label: 'Corrective Action' }),
			]),
		);
		expect(formatted.metricChips).toEqual(
			expect.arrayContaining([
				expect.stringContaining('Robustness'),
				expect.stringContaining('WinRate'),
			]),
		);
		expect(formatted.fullText?.match(/Preventive Guardrails/g)?.length).toBe(1);
	});
});
