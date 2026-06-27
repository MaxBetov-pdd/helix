import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import RuleBuilder from '../lib/components/backtest/RuleBuilder.svelte';

// These mount the real component in jsdom and click the actual controls, so they
// guard the reactivity bugs that were fixed: dropdowns not updating, renames
// orphaning conditions, and "+ Condition" not rendering a new row.

describe('RuleBuilder', () => {
	it('renders the default builder (1 indicator, 2 params, entry+exit conditions)', () => {
		render(RuleBuilder);
		expect(screen.getAllByLabelText('indicator id')).toHaveLength(1);
		expect(screen.getAllByLabelText('parameter name')).toHaveLength(2);
		// Entry Long + Exit Long each seed one condition -> two operator selects.
		expect(screen.getAllByLabelText('operator')).toHaveLength(2);
	});

	it('+ Condition adds a condition row (regression: used to be a no-op)', async () => {
		render(RuleBuilder);
		const before = screen.getAllByLabelText('operator').length;
		const addButtons = screen.getAllByRole('button', { name: /\+ Condition/ });
		await fireEvent.click(addButtons[0]); // Entry Long
		expect(screen.getAllByLabelText('operator').length).toBe(before + 1);
	});

	it('+ Add indicator and + Add parameter add rows', async () => {
		render(RuleBuilder);
		await fireEvent.click(screen.getByRole('button', { name: /\+ Add indicator/ }));
		expect(screen.getAllByLabelText('indicator id')).toHaveLength(2);
		await fireEvent.click(screen.getByRole('button', { name: /\+ Add parameter/ }));
		expect(screen.getAllByLabelText('parameter name')).toHaveLength(3);
	});

	it('a newly added parameter becomes selectable (live dropdown update)', async () => {
		render(RuleBuilder);
		await fireEvent.click(screen.getByRole('button', { name: /\+ Add parameter/ }));
		const names = screen.getAllByLabelText('parameter name') as HTMLInputElement[];
		await fireEvent.input(names[2], { target: { value: 'my_thresh' } });
		// Param operand <option>s are rebuilt from the param list; the new name must appear.
		const options = Array.from(document.querySelectorAll('option')).map((o) => o.textContent);
		expect(options).toContain('my_thresh');
	});

	it('renaming a parameter propagates to the conditions that use it (no orphan)', async () => {
		render(RuleBuilder);
		const names = screen.getAllByLabelText('parameter name') as HTMLInputElement[];
		expect(names[0].value).toBe('oversold');
		await fireEvent.input(names[0], { target: { value: 'rsi_lo' } });
		// If propagation failed, the Entry Long operand would still point at the
		// gone "oversold" -> a "— missing" option + an "unknown parameter" error.
		expect(screen.queryByText(/— missing/)).toBeNull();
		expect(screen.queryByText(/unknown parameter/i)).toBeNull();
	});

	it('flags validation when the only entry condition is removed', async () => {
		render(RuleBuilder);
		// Remove Entry Long's single condition; with no short side, no entry remains.
		const removeButtons = screen.getAllByRole('button', { name: /remove condition/i });
		await fireEvent.click(removeButtons[0]);
		expect(screen.getByText(/at least one entry condition/i)).toBeInTheDocument();
	});
});
