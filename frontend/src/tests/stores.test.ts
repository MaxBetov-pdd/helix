import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	strategies,
	datasets,
	selectedDataset,
	workflowState,
	jobs,
	backendConnected
} from '../lib/stores';

describe('Stores', () => {
	beforeEach(() => {
		// Reset stores to initial state
		strategies.set([]);
		datasets.set([]);
		selectedDataset.set(null);
		workflowState.set({
			dataReady: false,
			strategySelected: null,
			lastBacktestId: null
		});
		jobs.set([]);
		backendConnected.set(false);
	});

	describe('strategies store', () => {
		it('should start empty', () => {
			expect(get(strategies)).toEqual([]);
		});

		it('should update with strategies', () => {
			const mockStrategies = [
				{
					name: 'rsi_strategy',
					version: '1.0.0',
					description: 'RSI strategy',
					parameters: {}
				}
			];

			strategies.set(mockStrategies);

			expect(get(strategies)).toHaveLength(1);
			expect(get(strategies)[0].name).toBe('rsi_strategy');
		});
	});

	describe('datasets store', () => {
		it('should start empty', () => {
			expect(get(datasets)).toEqual([]);
		});

		it('should update with datasets', () => {
			const mockDatasets = [
				{
					symbol: 'BTC/USDT',
					timeframe: '1h',
					source: 'binance',
					start_ts: '2024-01-01T00:00:00Z',
					end_ts: '2024-06-01T00:00:00Z',
					row_count: 1000
				}
			];

			datasets.set(mockDatasets);

			expect(get(datasets)).toHaveLength(1);
		});
	});

	describe('selectedDataset store', () => {
		it('should start as null', () => {
			expect(get(selectedDataset)).toBeNull();
		});

		it('should update with selection', () => {
			const selection = {
				symbol: 'BTC/USDT',
				timeframe: '1h',
				source: 'binance'
			};

			selectedDataset.set(selection);

			expect(get(selectedDataset)).toEqual(selection);
		});
	});

	describe('workflowState store', () => {
		it('should have correct initial state', () => {
			expect(get(workflowState)).toEqual({
				dataReady: false,
				strategySelected: null,
				lastBacktestId: null
			});
		});

		it('should update workflow state', () => {
			workflowState.update((state) => ({
				...state,
				dataReady: true,
				strategySelected: 'rsi_strategy'
			}));

			const state = get(workflowState);
			expect(state.dataReady).toBe(true);
			expect(state.strategySelected).toBe('rsi_strategy');
		});
	});

	describe('jobs store', () => {
		it('should start empty', () => {
			expect(get(jobs)).toEqual([]);
		});

		it('should update with jobs', () => {
			const mockJobs = [
				{
					id: 'job-1',
					type: 'backtest',
					status: 'running',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z'
				}
			];

			jobs.set(mockJobs);

			expect(get(jobs)).toHaveLength(1);
		});
	});

	describe('UI state stores', () => {
		it('should track backend connection', () => {
			expect(get(backendConnected)).toBe(false);

			backendConnected.set(true);
			expect(get(backendConnected)).toBe(true);
		});
	});
});
