CREATE TABLE `global_notices` (
	`id` varchar(36) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`meta_json` text,
	`created_at` bigint NOT NULL,
	`expires_at` bigint,
	CONSTRAINT `global_notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `global_notices_created_idx` ON `global_notices` (`created_at`);--> statement-breakpoint
CREATE TABLE `user_notice_dismissals` (
	`user_id` int NOT NULL,
	`notice_id` varchar(36) NOT NULL,
	`dismissed_at` bigint NOT NULL,
	CONSTRAINT `user_notice_dismissals_pk` PRIMARY KEY(`user_id`,`notice_id`),
	CONSTRAINT `user_notice_dismissals_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
