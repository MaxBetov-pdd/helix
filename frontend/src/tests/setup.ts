import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock fetch for API tests
global.fetch = vi.fn();

// Keep route/component tests stable after `svelte-kit sync` or production builds.
vi.mock('$app/paths', () => ({
  base: '',
  assets: '',
  app_dir: '_app',
}));

// Mock lightweight-charts which has browser-only dependencies (used by legacy chart components)
vi.mock('lightweight-charts', () => ({
  ColorType: { Solid: 0 },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Solid: 0, Dotted: 1, Dashed: 2 },
  createChart: vi.fn(() => ({
    addAreaSeries: vi.fn(() => ({
      setData: vi.fn(),
      applyOptions: vi.fn(),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
    })),
    addCandlestickSeries: vi.fn(() => ({
      setData: vi.fn(),
      applyOptions: vi.fn(),
      setMarkers: vi.fn(),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
      coordinateToPrice: vi.fn(() => 100),
      createPriceLine: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
      removePriceLine: vi.fn(),
    })),
    addHistogramSeries: vi.fn(() => ({
      setData: vi.fn(),
      applyOptions: vi.fn(),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
    })),
    addLineSeries: vi.fn(() => ({
      setData: vi.fn(),
      applyOptions: vi.fn(),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
    })),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
      setVisibleRange: vi.fn(),
      coordinateToTime: vi.fn(() => 0),
      subscribeVisibleTimeRangeChange: vi.fn(),
      unsubscribeVisibleTimeRangeChange: vi.fn(),
    })),
    subscribeClick: vi.fn(),
    unsubscribeClick: vi.fn(),
    removeSeries: vi.fn(),
    applyOptions: vi.fn(),
    resize: vi.fn(),
    remove: vi.fn(),
  })),
}));

class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
  configurable: true,
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
