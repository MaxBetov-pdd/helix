# Data Schema

This documents the columns available on the backtest/scanner DataFrame so strategies reference real fields. It is injected into every worker agent's context.

## Core Columns (always present)

Every backtest DataFrame contains these OHLCV columns:

| Column      | Type    | Description                          |
|-------------|---------|--------------------------------------|
| timestamp   | int64   | Unix milliseconds (UTC)              |
| open        | float64 | Candle open price                    |
| high        | float64 | Candle high price                    |
| low         | float64 | Candle low price                     |
| close       | float64 | Candle close price                   |
| volume      | float64 | Volume in base currency              |

## Enrichment Columns (present when historical data collected)

These columns are joined onto OHLCV at read time via `DataManager.enrich()`. They are populated via Binance Vision bulk backfill and continuous collection.

| Column        | Type    | Granularity | Available From | Description                                               |
|---------------|---------|-------------|----------------|-----------------------------------------------------------|
| funding_rate  | float64 | 8h          | ~2020-11       | Binance Futures 8-hour funding rate. Positive = longs pay shorts. Negative = shorts pay longs. Useful as a sentiment/positioning signal. |
| open_interest | float64 | 1h, 4h      | ~2020-11       | Aggregated open interest in base currency (e.g. BTC). Rising OI with rising price = trend confirmation. Rising OI with falling price = bearish pressure. |

### Notes

- `funding_rate` is joined via `merge_asof` — each candle gets the most recent funding rate at or before its timestamp.
- `open_interest` is joined the same way. At 1h granularity, every candle has OI. At 4h, every candle gets the most recent 4h OI sample.
- Both enrichment columns are `NaN` for candles predating 2020-11 (before Binance Futures launched perpetuals at scale).
- Available for all 9 active symbols: BTC-USDT, ETH-USDT, BNB-USDT, SOL-USDT, XRP-USDT, DOGE-USDT, ADA-USDT, AVAX-USDT, MATIC-USDT.
- When writing strategies that use these signals, always guard against NaN: `df['funding_rate'].fillna(0)` or `df['funding_rate'].notna()`.
