-- Optional reference data after migrations. Run against your MySQL database.
INSERT IGNORE INTO `fiat_currencies` (`id`, `name`, `symbol`) VALUES
  (1, 'US Dollar', '$USD'),
  (2, 'Euro', '€EUR');

INSERT IGNORE INTO `faq_categories` (`id`, `name`, `sort_order`) VALUES
  (1, 'Getting started', 0),
  (2, 'Trading', 1);

INSERT IGNORE INTO `faq_items` (`id`, `category_id`, `question`, `answer`, `sort_order`) VALUES
  (1, 1, 'How do I verify my account?', 'Complete profile and upload documents in Verification.', 0),
  (2, 2, 'What pairs are supported?', 'Major crypto pairs; live book updates via WebSocket.', 0);

INSERT IGNORE INTO `trading_bots` (`id`, `name`, `strapline`, `description`, `strategy`, `price_usd`, `monthly_target`, `win_rate`, `max_drawdown`, `markets`, `cadence`, `guardrails`, `subscription_days`) VALUES
  ('bot-momentum', 'Momentum Scout', 'Trend-aware automation', 'Rules-based momentum entries with stops.', 'Momentum', 49.00, '6–12%', 58, 12, '["BTC","ETH"]', '15m', '["max_daily_loss_2pct"]', 30);

INSERT IGNORE INTO `copy_traders` (`id`, `name`, `handle`, `specialty`, `followers`, `win_rate`, `max_drawdown`, `min_allocation`, `fee_pct`, `monthly_return`, `bio`, `focus_pairs`, `capacity`) VALUES
  ('trader-1', 'Alex Rivera', '@arivera', 'BTC / ETH swing', 1200, 61, 14, 500, 15, '4–9%', 'Focus on liquid majors.', '["BTC-USDT","ETH-USDT"]', 'Open');

INSERT IGNORE INTO `investment_products` (`id`, `name`, `subtitle`, `category`, `vehicle`, `apy`, `term_days`, `min_amount`, `liquidity`, `distribution`, `funded_pct`, `risk`, `focus`, `objective`, `suitable_for`, `description`) VALUES
  ('inv-yield', 'Stable Yield Note', 'Short-term cash', 'Short Term', 'Note', 5.5000, 90, 1000, 'Monthly', 'Monthly', 72, 'Moderate', '["USDC","USD"]', 'Income', 'Balanced investors', 'Illustrative product for the dashboard.');
