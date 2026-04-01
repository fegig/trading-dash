-- Profile / onboarding JSON moves from `users.bios` to `user_bios.data` (one row per user).
CREATE TABLE IF NOT EXISTS `user_bios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`data` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_bios_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_bios_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `user_bios_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
INSERT INTO `user_bios` (`user_id`, `data`, `created_at`, `updated_at`)
SELECT `id`, `bios`, NOW(), NOW() FROM `users` WHERE `bios` IS NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `bios`;
