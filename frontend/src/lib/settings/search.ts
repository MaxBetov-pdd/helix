import type { SettingsEntry } from './manifest';

export function searchSettings(entries: SettingsEntry[], query: string): SettingsEntry[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	return entries.filter(
		(e) =>
			e.id.toLowerCase().includes(q) ||
			e.label.toLowerCase().includes(q) ||
			(e.description ?? '').toLowerCase().includes(q),
	);
}
