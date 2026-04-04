CREATE TABLE `platform_settings` (
  `id` int NOT NULL PRIMARY KEY,
  `site_name` varchar(128) NOT NULL DEFAULT '',
  `support_email` varchar(255) NOT NULL DEFAULT '',
  `support_phone` varchar(64) NOT NULL DEFAULT '',
  `site_logo_r2_key` varchar(512),
  `email_logo_r2_key` varchar(512),
  `updated_at` bigint NOT NULL
);
--> statement-breakpoint
INSERT INTO `platform_settings` (`id`, `site_name`, `support_email`, `support_phone`, `site_logo_r2_key`, `email_logo_r2_key`, `updated_at`)
VALUES (1, '', '', '', NULL, NULL, UNIX_TIMESTAMP());