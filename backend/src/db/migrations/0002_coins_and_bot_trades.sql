CREATE TABLE `coins` (
	`id` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`symbol` varchar(16) NOT NULL,
	`chain` varchar(32) NOT NULL,
	`confirm_level` int NOT NULL DEFAULT 0,
	`icon_url` varchar(512),
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `coins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bot_trade_runs` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`bot_id` varchar(64) NOT NULL,
	`subscription_row_id` int NOT NULL,
	`ran_at` bigint NOT NULL,
	`trades_created` int NOT NULL DEFAULT 0,
	`detail_json` text,
	CONSTRAINT `bot_trade_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bot_trade_runs` ADD CONSTRAINT `bot_trade_runs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `btr_user_idx` ON `bot_trade_runs` (`user_id`);--> statement-breakpoint
CREATE INDEX `btr_sub_idx` ON `bot_trade_runs` (`subscription_row_id`);--> statement-breakpoint
INSERT IGNORE INTO `coins` (`id`, `name`, `symbol`, `chain`, `confirm_level`, `icon_url`, `is_active`) VALUES
	('BTC', 'Bitcoin', 'BTC', 'Bitcoin', 0, NULL, true),
	('ETH', 'Ethereum', 'ETH', 'Ethereum', 0, NULL, true),
	('SOL', 'Solana', 'SOL', 'Solana', 0, NULL, true),
	('BNB', 'BNB', 'BNB', 'BNB Chain', 0, NULL, true),
	('XRP', 'XRP', 'XRP', 'XRP Ledger', 0, NULL, true),
	('ADA', 'Cardano', 'ADA', 'Cardano', 0, NULL, true),
	('DOGE', 'Dogecoin', 'DOGE', 'Dogecoin', 0, NULL, true),
	('DOT', 'Polkadot', 'DOT', 'Polkadot', 0, NULL, true),
	('MATIC', 'Polygon', 'MATIC', 'Polygon', 0, NULL, true),
	('LINK', 'Chainlink', 'LINK', 'Ethereum', 0, NULL, true),
	('AVAX', 'Avalanche', 'AVAX', 'Avalanche', 0, NULL, true),
	('UNI', 'Uniswap', 'UNI', 'Ethereum', 0, NULL, true),
	('USDT', 'Tether', 'USDT', 'Multi', 0, NULL, true),
	('USD', 'US Dollar', 'USD', 'Fiat', 0, NULL, true);
