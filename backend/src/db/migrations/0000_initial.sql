CREATE TABLE `activity_logs` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`time` bigint NOT NULL,
	`ip_address` varchar(64) NOT NULL,
	`location` varchar(128) NOT NULL,
	`device` varchar(256) NOT NULL,
	`status` enum('success','review','blocked') NOT NULL,
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrer_user_id` int NOT NULL,
	`referred_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(512) NOT NULL,
	`token_type` varchar(32) NOT NULL DEFAULT 'session',
	`expires_at` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `copy_traders` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`handle` varchar(64) NOT NULL,
	`specialty` varchar(128) NOT NULL,
	`followers` int NOT NULL,
	`win_rate` int NOT NULL,
	`max_drawdown` int NOT NULL,
	`min_allocation` int NOT NULL,
	`fee_pct` int NOT NULL,
	`monthly_return` varchar(32) NOT NULL,
	`bio` text NOT NULL,
	`focus_pairs` json NOT NULL,
	`capacity` enum('Open','Limited') NOT NULL,
	CONSTRAINT `copy_traders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faq_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `faq_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faq_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `faq_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fiat_currencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`symbol` varchar(8) NOT NULL,
	CONSTRAINT `fiat_currencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investment_products` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`subtitle` varchar(256) NOT NULL,
	`category` enum('Short Term','Long Term','Retirement') NOT NULL,
	`vehicle` varchar(128) NOT NULL,
	`apy` decimal(8,4) NOT NULL,
	`term_days` int NOT NULL,
	`min_amount` int NOT NULL,
	`liquidity` varchar(64) NOT NULL,
	`distribution` varchar(64) NOT NULL,
	`funded_pct` int NOT NULL,
	`risk` enum('Low','Moderate','High') NOT NULL,
	`focus` json NOT NULL,
	`objective` text NOT NULL,
	`suitable_for` text NOT NULL,
	`description` text NOT NULL,
	CONSTRAINT `investment_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_orders` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`pair` varchar(32) NOT NULL,
	`side` enum('buy','sell') NOT NULL,
	`order_type` enum('market','limit','stop') NOT NULL,
	`amount` decimal(24,8) NOT NULL,
	`leverage` int NOT NULL,
	`price` decimal(24,8),
	`margin_type` enum('isolated','cross') NOT NULL,
	`status` enum('open','filled','cancelled') NOT NULL DEFAULT 'open',
	`created_at` bigint NOT NULL,
	CONSTRAINT `live_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`message_id` varchar(64) NOT NULL,
	`code_hash` varchar(128) NOT NULL,
	`expires_at` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `setting_toggles` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`section` enum('security','trading','notifications','privacy') NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`enabled` boolean NOT NULL,
	`icon` varchar(64) NOT NULL,
	`tone` enum('green','sky','amber','rose') NOT NULL,
	CONSTRAINT `setting_toggles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`pair` varchar(32) NOT NULL,
	`base` varchar(16) NOT NULL,
	`quote` varchar(16) NOT NULL,
	`option` enum('buy','sell') NOT NULL,
	`direction` enum('long','short') NOT NULL,
	`entry_time` bigint NOT NULL,
	`entry_price` decimal(24,8) NOT NULL,
	`invested` decimal(24,8) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`closing_time` bigint,
	`closing_price` decimal(24,8),
	`status` enum('open','completed','pending','canceled','failed') NOT NULL,
	`roi` decimal(24,8),
	`leverage` int NOT NULL DEFAULT 1,
	`size` decimal(24,8) NOT NULL,
	`margin` decimal(24,8) NOT NULL,
	`margin_percentage` decimal(8,4) NOT NULL,
	`margin_type` enum('isolated','cross') NOT NULL,
	`pnl` decimal(24,8) NOT NULL,
	`sl` decimal(24,8) NOT NULL,
	`tp` decimal(24,8) NOT NULL,
	`fees` decimal(24,8) NOT NULL,
	`liquidation_price` decimal(24,8) NOT NULL,
	`market_price` decimal(24,8) NOT NULL,
	`strategy` varchar(128) NOT NULL,
	`confidence` int NOT NULL,
	`risk_reward` varchar(32) NOT NULL,
	`note` text NOT NULL,
	`setup` varchar(256) NOT NULL,
	`funded_with` varchar(64) NOT NULL,
	`execution_venue` varchar(64) NOT NULL,
	`tags` json NOT NULL,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_bots` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`strapline` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`strategy` varchar(128) NOT NULL,
	`price_usd` decimal(12,2) NOT NULL,
	`monthly_target` varchar(32) NOT NULL,
	`win_rate` int NOT NULL,
	`max_drawdown` int NOT NULL,
	`markets` json NOT NULL,
	`cadence` varchar(64) NOT NULL,
	`guardrails` json NOT NULL,
	`subscription_days` int DEFAULT 30,
	CONSTRAINT `trading_bots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_bot_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`bot_id` varchar(64) NOT NULL,
	`subscribed_at` bigint NOT NULL,
	`expires_at` bigint NOT NULL,
	`lifetime_pnl_usd` decimal(24,8) NOT NULL,
	CONSTRAINT `user_bot_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_copy_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`trader_id` varchar(64) NOT NULL,
	`amount` decimal(24,8) NOT NULL,
	`started_at` bigint NOT NULL,
	`expires_at` bigint NOT NULL,
	`lifetime_pnl_usd` decimal(24,8) NOT NULL,
	CONSTRAINT `user_copy_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_following_traders` (
	`user_id` int NOT NULL,
	`trader_id` varchar(64) NOT NULL,
	CONSTRAINT `user_following_traders_user_id_trader_id_pk` PRIMARY KEY(`user_id`,`trader_id`)
);
--> statement-breakpoint
CREATE TABLE `user_investment_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`amount` decimal(24,8) NOT NULL,
	`started_at` bigint NOT NULL,
	CONSTRAINT `user_investment_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`public_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`currency_id` int,
	`verification_status` int NOT NULL DEFAULT 0,
	`ref_by` varchar(36),
	`bios` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_public_id_unique` UNIQUE(`public_id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification_benefits` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`icon` varchar(64) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `verification_benefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_documents` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`subtitle` varchar(256) NOT NULL,
	`status` enum('approved','review','missing') NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `verification_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_overview` (
	`user_id` int NOT NULL,
	`tier` varchar(64) NOT NULL,
	`daily_limit` varchar(64) NOT NULL,
	`payout_speed` varchar(64) NOT NULL,
	`next_review` varchar(64) NOT NULL,
	CONSTRAINT `verification_overview_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `verification_steps` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`status` enum('complete','active','upcoming') NOT NULL,
	`eta` varchar(64) NOT NULL,
	`action` varchar(128) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `verification_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`coin_id` varchar(32) NOT NULL,
	`wallet_address` varchar(128) NOT NULL,
	`user_balance` decimal(24,8) NOT NULL,
	`coin_name` varchar(64) NOT NULL,
	`coin_short` varchar(16) NOT NULL,
	`coin_chain` varchar(32) NOT NULL,
	`wallet_id` varchar(64) NOT NULL,
	`price` varchar(32) NOT NULL,
	`change_24hrs` varchar(16) NOT NULL,
	`coin_color` varchar(16) NOT NULL,
	`asset_type` enum('crypto','fiat') NOT NULL,
	`funding_eligible` boolean NOT NULL DEFAULT true,
	`icon_url` varchar(512),
	`icon_class` varchar(64),
	`description` text,
	CONSTRAINT `wallet_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('buy','sell','transfer','withdrawal','deposit','fee','interest','dividend','tax','other') NOT NULL,
	`amount` decimal(24,8) NOT NULL,
	`eq_amount` decimal(24,8) NOT NULL,
	`status` enum('pending','completed','failed','cancelled') NOT NULL,
	`created_at` bigint NOT NULL,
	`method_type` enum('bank','card','crypto','fiat','other') NOT NULL,
	`method_name` varchar(128) NOT NULL,
	`method_symbol` varchar(16) NOT NULL,
	`method_icon` varchar(512),
	`method_icon_class` varchar(64),
	`note` text,
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_referrals` ADD CONSTRAINT `affiliate_referrals_referrer_user_id_users_id_fk` FOREIGN KEY (`referrer_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_referrals` ADD CONSTRAINT `affiliate_referrals_referred_user_id_users_id_fk` FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_tokens` ADD CONSTRAINT `auth_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `faq_items` ADD CONSTRAINT `faq_items_category_id_faq_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `faq_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_orders` ADD CONSTRAINT `live_orders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `otp_messages` ADD CONSTRAINT `otp_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `setting_toggles` ADD CONSTRAINT `setting_toggles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trades` ADD CONSTRAINT `trades_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bot_subscriptions` ADD CONSTRAINT `user_bot_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_copy_allocations` ADD CONSTRAINT `user_copy_allocations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_following_traders` ADD CONSTRAINT `user_following_traders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_investment_positions` ADD CONSTRAINT `user_investment_positions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_benefits` ADD CONSTRAINT `verification_benefits_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_documents` ADD CONSTRAINT `verification_documents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_overview` ADD CONSTRAINT `verification_overview_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_steps` ADD CONSTRAINT `verification_steps_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_assets` ADD CONSTRAINT `wallet_assets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `al_user_idx` ON `activity_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `ar_referrer_idx` ON `affiliate_referrals` (`referrer_user_id`);--> statement-breakpoint
CREATE INDEX `faq_cat_idx` ON `faq_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `lo_user_idx` ON `live_orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `lo_pair_idx` ON `live_orders` (`pair`);--> statement-breakpoint
CREATE INDEX `st_user_idx` ON `setting_toggles` (`user_id`);--> statement-breakpoint
CREATE INDEX `trades_user_idx` ON `trades` (`user_id`);--> statement-breakpoint
CREATE INDEX `trades_status_idx` ON `trades` (`status`);--> statement-breakpoint
CREATE INDEX `ubs_user_idx` ON `user_bot_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `uca_user_idx` ON `user_copy_allocations` (`user_id`);--> statement-breakpoint
CREATE INDEX `uft_user_idx` ON `user_following_traders` (`user_id`);--> statement-breakpoint
CREATE INDEX `uip_user_idx` ON `user_investment_positions` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `vb_user_idx` ON `verification_benefits` (`user_id`);--> statement-breakpoint
CREATE INDEX `vd_user_idx` ON `verification_documents` (`user_id`);--> statement-breakpoint
CREATE INDEX `vs_user_idx` ON `verification_steps` (`user_id`);--> statement-breakpoint
CREATE INDEX `wallet_user_idx` ON `wallet_assets` (`user_id`);--> statement-breakpoint
CREATE INDEX `wt_user_idx` ON `wallet_transactions` (`user_id`);