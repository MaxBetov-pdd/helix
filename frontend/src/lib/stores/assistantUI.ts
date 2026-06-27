/**
 * Global open/prefill state for the single in-app assistant panel.
 *
 * One panel is mounted in the layout; any page can open it (or open it with a
 * prefilled / auto-sent prompt) through these helpers — replacing the old
 * pattern where pages mounted their own AIChatPanel instance.
 */
import { writable } from 'svelte/store';

export interface AssistantUIState {
	open: boolean;
	prefill: string;
	sendKey: number; // bump to request an auto-send of the current prefill
}

export const assistantUI = writable<AssistantUIState>({ open: false, prefill: '', sendKey: 0 });

/** Open the panel. Optionally prefill the input, and optionally auto-send it. */
export function openAssistant(prefill?: string, autoSend = false): void {
	assistantUI.update((s) => ({
		open: true,
		prefill: prefill ?? '',
		sendKey: autoSend ? s.sendKey + 1 : s.sendKey,
	}));
}

export function closeAssistant(): void {
	assistantUI.update((s) => ({ ...s, open: false }));
}

export function toggleAssistant(): void {
	assistantUI.update((s) => ({ ...s, open: !s.open }));
}
