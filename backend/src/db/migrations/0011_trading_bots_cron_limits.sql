ALTER TABLE `trading_bots`
  ADD COLUMN `max_trades_per_day` int NOT NULL DEFAULT 4,
  ADD COLUMN `trade_size_pct_of_fiat_balance` decimal(10,6) NOT NULL DEFAULT 0.050000,
  ADD COLUMN `min_trade_size_usd` decimal(12,2) NOT NULL DEFAULT 10.00,
  ADD COLUMN `max_trade_size_usd` decimal(12,2) NOT NULL DEFAULT 500.00;
