-- Fix setting_toggles: recreate with composite PK (user_id, toggle_id)
DROP TABLE IF EXISTS `setting_toggles`;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `setting_toggles` (
  `user_id` int NOT NULL,
  `toggle_id` varchar(64) NOT NULL,
  `section` enum('security','trading','notifications','privacy') NOT NULL,
  `title` varchar(256) NOT NULL,
  `description` text NOT NULL,
  `enabled` boolean NOT NULL DEFAULT false,
  `icon` varchar(64) NOT NULL,
  `tone` enum('green','sky','amber','rose') NOT NULL,
  PRIMARY KEY (`user_id`, `toggle_id`),
  CONSTRAINT `st_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `st_user_idx` (`user_id`)
);
--> statement-breakpoint
-- Add ISO code column to fiat_currencies (idempotent via stored procedure)
DROP PROCEDURE IF EXISTS `_add_fiat_code`;
--> statement-breakpoint
CREATE PROCEDURE `_add_fiat_code`()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'fiat_currencies'
      AND COLUMN_NAME  = 'code'
  ) THEN
    ALTER TABLE `fiat_currencies` ADD COLUMN `code` varchar(8) NOT NULL DEFAULT '';
  END IF;
END;
--> statement-breakpoint
CALL `_add_fiat_code`();
--> statement-breakpoint
DROP PROCEDURE IF EXISTS `_add_fiat_code`;
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'USD' WHERE `code` = '' AND (`name` LIKE '%US Dollar%' OR `name` LIKE '%United States%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'EUR' WHERE `code` = '' AND `name` LIKE '%Euro%';
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'GBP' WHERE `code` = '' AND (`name` LIKE '%British%' OR `name` LIKE '%Pound%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'NGN' WHERE `code` = '' AND (`name` LIKE '%Nigerian%' OR `name` LIKE '%Naira%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'JPY' WHERE `code` = '' AND (`name` LIKE '%Japanese%' OR `name` LIKE '%Yen%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'CAD' WHERE `code` = '' AND `name` LIKE '%Canadian%';
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'AUD' WHERE `code` = '' AND `name` LIKE '%Australian%';
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'CHF' WHERE `code` = '' AND `name` LIKE '%Swiss%';
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'CNY' WHERE `code` = '' AND (`name` LIKE '%Chinese%' OR `name` LIKE '%Yuan%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'ZAR' WHERE `code` = '' AND (`name` LIKE '%South African%' OR `name` LIKE '%Rand%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'INR' WHERE `code` = '' AND (`name` LIKE '%Indian%' OR `name` LIKE '%Rupee%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'BRL' WHERE `code` = '' AND (`name` LIKE '%Brazilian%' OR `name` LIKE '%Real%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'KES' WHERE `code` = '' AND `name` LIKE '%Kenyan%';
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = 'GHS' WHERE `code` = '' AND (`name` LIKE '%Ghanaian%' OR `name` LIKE '%Cedi%');
--> statement-breakpoint
UPDATE `fiat_currencies` SET `code` = UPPER(LEFT(`name`, 3)) WHERE `code` = '';
