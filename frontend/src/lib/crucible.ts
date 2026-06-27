// Shared crucible presentation helpers. Kept in one place so the list table and
// the detail page can't drift (they used to disagree on manager-state labels).

function titleCase(value: string | undefined | null): string {
	return String(value ?? '')
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Primary user-facing state = the crucible lifecycle (proof axis stays internal). */
export function crucibleStatusLabel(s: string | undefined | null): string {
	switch (s) {
		case 'proposed':
			return 'Proposed';
		case 'testing':
			return 'Testing';
		case 'viable':
			return 'Viable';
		case 'expanded':
			return 'Expanded';
		case 'failed':
			return 'Failed';
		default:
			return titleCase(s) || 'Proposed';
	}
}

export function crucibleStatusClasses(s: string | undefined | null): string {
	switch (s) {
		case 'viable':
			return 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200';
		case 'expanded':
			return 'border-emerald-300/70 bg-emerald-500/25 text-emerald-100';
		case 'failed':
			return 'border-slate-500/50 bg-slate-700/20 text-slate-400 line-through';
		case 'testing':
			return 'border-sky-400/60 bg-sky-500/15 text-sky-200';
		case 'proposed':
			return 'border-amber-400/60 bg-amber-500/15 text-amber-200';
		default:
			return 'border-[#444] bg-[#111] text-gray-300';
	}
}

export function originLabel(o: string | undefined | null): string {
	switch (o) {
		case 'agent':
			return 'Agent';
		case 'harvested':
			return 'Harvested';
		case 'operator':
			return 'Operator';
		default:
			return o || '—';
	}
}

export function originClasses(o: string | undefined | null): string {
	switch (o) {
		case 'agent':
			return 'border-violet-500/50 bg-violet-950/40 text-violet-100';
		case 'harvested':
			return 'border-cyan-500/50 bg-cyan-950/40 text-cyan-100';
		case 'operator':
			return 'border-emerald-600/50 bg-emerald-950/40 text-emerald-100';
		default:
			return 'border-[#2d2d2d] bg-[#0b0b0b] text-gray-400';
	}
}

export function protectionBadge(
	s: string | undefined | null,
): { label: string; classes: string } | null {
	if (s === 'protected')
		return { label: 'Protected', classes: 'border-amber-400/50 bg-amber-500/10 text-amber-200' };
	if (s === 'contested')
		return { label: 'Contested', classes: 'border-rose-500/60 bg-rose-500/15 text-rose-200' };
	return null;
}

export function managerStateLabel(state: string | undefined | null): string {
	switch (state) {
		case 'archived':
			return 'Archived';
		case 'trash':
			return 'Trash';
		case 'graduated':
			return 'Graduated';
		default:
			return 'Active';
	}
}

/** Proof outcome of a candidate's gauntlet (forge) workflow. */
export function forgeStatusLabel(status: string | undefined | null): string {
	switch (status) {
		case 'passed':
			return 'Passed';
		case 'failed_gate':
			return 'Failed';
		case 'running':
			return 'Running';
		case 'pending':
			return 'Pending';
		case 'cancelled':
			return 'Cancelled';
		case 'blocked_data':
		case 'blocked_runtime':
		case 'blocked_operator':
			return 'Blocked';
		default:
			return '';
	}
}

export function forgeStatusClasses(status: string | undefined | null): string {
	switch (status) {
		case 'passed':
			return 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200';
		case 'failed_gate':
			return 'border-rose-500/60 bg-rose-500/15 text-rose-200';
		case 'running':
			return 'border-sky-400/60 bg-sky-500/15 text-sky-200';
		case 'blocked_data':
		case 'blocked_runtime':
		case 'blocked_operator':
			return 'border-amber-400/60 bg-amber-500/15 text-amber-200';
		default:
			return 'border-[#2d2d2d] bg-[#0b0b0b] text-slate-400';
	}
}

/** Where a candidate sits in the Forge (the gauntlet pipeline). */
export function forgeStageLabel(stage: string | undefined | null): string {
	switch (stage) {
		case 'quick_screen':
			return 'Quick Screen';
		case 'gauntlet':
			return 'Gauntlet';
		case 'paper':
		case 'paper_trading':
			return 'Paper';
		case 'live_graduated':
		case 'deployed':
			return 'Live';
		case 'archived':
			return 'Archived';
		case 'rejected':
			return 'Rejected';
		default:
			return titleCase(stage);
	}
}
