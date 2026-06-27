/**
 * Shared polling utility with visibility-awareness and overlap protection.
 *
 * Key features:
 *   - Pauses when the browser tab is hidden (document.hidden)
 *   - Prevents overlapping callbacks (in-flight guard)
 *   - Automatically cleans up on stop()
 *
 * Usage in Svelte components:
 *   import { createPoller } from '$lib/utils/polling';
 *   import { onDestroy } from 'svelte';
 *
 *   const poller = createPoller(async () => { ... }, 3000);
 *   poller.start();
 *   onDestroy(() => poller.stop());
 */

export interface Poller {
	/** Start polling. Safe to call multiple times (restarts). */
	start: () => void;
	/** Stop polling and clear the interval. */
	stop: () => void;
	/** Whether the poller is currently running. */
	readonly running: boolean;
}

/**
 * Create a poller that calls `callback` every `intervalMs` milliseconds.
 * - Skips a tick if the previous callback is still in-flight.
 * - Pauses automatically when the browser tab is hidden.
 * - Fires one immediate tick on start() and on tab re-focus.
 */
export function createPoller(
	callback: () => void | Promise<void>,
	intervalMs: number,
): Poller {
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let isRunning = false;
	let inFlight = false;

	async function tick() {
		if (inFlight) return;
		// Skip while tab is hidden to avoid bunching requests
		if (typeof document !== 'undefined' && document.hidden) return;
		inFlight = true;
		try {
			await callback();
		} catch (e) {
			console.error('[Poller] callback error:', e);
		} finally {
			inFlight = false;
		}
	}

	function onVisibilityChange() {
		if (!isRunning) return;
		if (document.hidden) {
			// Tab hidden: clear interval to stop ticks entirely
			if (intervalId !== null) {
				clearInterval(intervalId);
				intervalId = null;
			}
		} else {
			// Tab visible again: fire one immediate tick and restart interval
			if (intervalId === null) {
				void tick();
				intervalId = setInterval(tick, intervalMs);
			}
		}
	}

	function stop() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
		isRunning = false;
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', onVisibilityChange);
		}
	}

	function start() {
		stop(); // Clear any existing interval first
		isRunning = true;
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', onVisibilityChange);
		}
		// Fire one immediate tick, then start interval
		void tick();
		intervalId = setInterval(tick, intervalMs);
	}

	return {
		start,
		stop,
		get running() {
			return isRunning;
		},
	};
}
