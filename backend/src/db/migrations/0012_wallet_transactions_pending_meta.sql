ALTER TABLE `wallet_transactions`
  ADD COLUMN `expires_at` bigint NULL DEFAULT NULL,
  ADD COLUMN `counterparty_address` varchar(512) NULL DEFAULT NULL,
  ADD COLUMN `wallet_asset_id` int NULL DEFAULT NULL,
  ADD KEY `wt_wallet_asset_idx` (`wallet_asset_id`),
  ADD KEY `wt_expires_idx` (`expires_at`),
  ADD CONSTRAINT `wallet_transactions_wallet_asset_fk` FOREIGN KEY (`wallet_asset_id`) REFERENCES `wallet_assets` (`id`) ON DELETE SET NULL;
