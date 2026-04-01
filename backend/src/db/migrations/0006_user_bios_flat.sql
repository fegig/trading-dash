-- Replace JSON `data` with typed columns (profile + flags).
ALTER TABLE `user_bios` ADD COLUMN `first_name` varchar(128) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `user_bios` ADD COLUMN `last_name` varchar(128) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `user_bios` ADD COLUMN `phone` varchar(64) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `user_bios` ADD COLUMN `country` varchar(128) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `user_bios` ADD COLUMN `login_otp_enabled` tinyint(1) NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `user_bios` ADD COLUMN `onboarding_welcome_sent` tinyint(1) NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `user_bios` SET
  `first_name` = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.firstName')), ''), ''),
  `last_name` = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.lastName')), ''), ''),
  `phone` = COALESCE(
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.phone')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.phoneNumber')), ''),
    ''
  ),
  `country` = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.country')), ''), ''),
  `login_otp_enabled` = IF(
    JSON_EXTRACT(`data`, '$.loginOtpEnabled') = true
    OR JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.loginOtpEnabled')) IN ('true', '1'),
    1,
    0
  ),
  `onboarding_welcome_sent` = IF(
    JSON_EXTRACT(`data`, '$.onboardingWelcomeSent') = true
    OR JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.onboardingWelcomeSent')) IN ('true', '1'),
    1,
    0
  )
WHERE JSON_TYPE(`data`) = 'OBJECT';
--> statement-breakpoint
ALTER TABLE `user_bios` DROP COLUMN `data`;
