import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmount } from 'svelte';

const apiMock = vi.hoisted(() => ({
  getDashboardLeaderboard: vi.fn(),
}));

vi.mock('$lib/api', () => apiMock);
vi.mock('$lib/utils/strategyDetail', () => ({
  openStrategyDetail: vi.fn(),
}));

import StrategyLeaderboard from '../lib/components/dashboard/StrategyLeaderboard.svelte';

let target: HTMLElement;
let instance: any;

afterEach(() => {
  if (instance) unmount(instance);
  target?.remove();
  apiMock.getDashboardLeaderboard.mockReset();
});

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  await Promise.resolve();
}

function makeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: 's1',
    strategy_name: 'Alpha',
    symbol: 'BTC-USD',
    timeframe: '1h',
    sharpe_ratio: 1.8,
    total_return: 12,
    max_drawdown: 5,
    win_rate: 55,
    total_trades: 120,
    profit_factor: 1.4,
    sortino_ratio: 2.1,
    calmar_ratio: 1.1,
    source: 'manual',
    tier: 'strong',
  };
  // Allow explicit id: undefined / id: '' to pass through (override wins).
  return { ...base, ...overrides };
}

describe('StrategyLeaderboard with winners', () => {
  it('renders a winner badge only on matching rows', async () => {
    apiMock.getDashboardLeaderboard.mockResolvedValue([
      makeRow({ id: 's1', strategy_name: 'Alpha', sharpe_ratio: 1.8, total_trades: 120 }),
      makeRow({ id: 's2', strategy_name: 'Beta', symbol: 'ETH-USD', sharpe_ratio: 1.2, total_trades: 90, tier: 'strong' }),
    ]);
    target = document.createElement('div');
    document.body.appendChild(target);
    instance = mount(StrategyLeaderboard, {
      target,
      props: {
        winners: [
          {
            id: 's1',
            strategy_name: 'Alpha',
            symbol: 'BTC-USD',
            timeframe: '1h',
            deflated_sharpe: 1.8,
            total_return: 12,
            max_drawdown: 5,
            total_trades: 120,
            tier: 'strong',
            created_at: '2026-04-17T00:00:00Z',
            scan_id: '',
          },
        ],
      },
    });
    await flush();
    expect(target.querySelector('[data-testid="winner-badge-s1"]')).toBeTruthy();
    expect(target.querySelector('[data-testid="winner-badge-s2"]')).toBeNull();
    expect(target.querySelectorAll('[data-testid^="winner-badge-"]').length).toBe(1);
  });

  it('renders no badges when winners array is empty', async () => {
    apiMock.getDashboardLeaderboard.mockResolvedValue([
      makeRow({ id: 's1', strategy_name: 'Alpha' }),
      makeRow({ id: 's2', strategy_name: 'Beta' }),
    ]);
    target = document.createElement('div');
    document.body.appendChild(target);
    instance = mount(StrategyLeaderboard, { target, props: { winners: [] } });
    await flush();
    expect(target.querySelectorAll('[data-testid^="winner-badge-"]').length).toBe(0);
  });

  it('renders testid keyed on strategy_name when row id is absent', async () => {
    apiMock.getDashboardLeaderboard.mockResolvedValue([
      makeRow({ id: '', strategy_name: 'NoIdAlpha' }),
    ]);
    target = document.createElement('div');
    document.body.appendChild(target);
    instance = mount(StrategyLeaderboard, {
      target,
      props: {
        winners: [
          {
            id: '',
            strategy_name: 'NoIdAlpha',
            symbol: 'BTC-USD',
            timeframe: '1h',
            deflated_sharpe: 1.8,
            total_return: 12,
            max_drawdown: 5,
            total_trades: 120,
            tier: 'strong',
            created_at: '2026-04-17T00:00:00Z',
            scan_id: '',
          },
        ],
      },
    });
    await flush();
    expect(target.querySelector('[data-testid="winner-badge-NoIdAlpha"]')).toBeTruthy();
  });

  it('matches winner by strategy name when id differs', async () => {
    apiMock.getDashboardLeaderboard.mockResolvedValue([
      makeRow({ id: 's1', strategy_name: 'Alpha' }),
    ]);
    target = document.createElement('div');
    document.body.appendChild(target);
    instance = mount(StrategyLeaderboard, {
      target,
      props: {
        winners: [
          {
            id: 'different-id',
            strategy_name: 'Alpha',
            symbol: 'BTC-USD',
            timeframe: '1h',
            deflated_sharpe: 1.8,
            total_return: 12,
            max_drawdown: 5,
            total_trades: 120,
            tier: 'strong',
            created_at: '2026-04-17T00:00:00Z',
            scan_id: '',
          },
        ],
      },
    });
    await flush();
    expect(target.querySelector('[data-testid="winner-badge-s1"]')).toBeTruthy();
  });
});
