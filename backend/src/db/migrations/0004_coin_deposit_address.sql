-- Catalog-level deposit addresses on `coins`; crypto rows in `wallet_assets` no longer store per-user addresses.
DROP PROCEDURE IF EXISTS `_add_coin_deposit_address`;
--> statement-breakpoint
CREATE PROCEDURE `_add_coin_deposit_address`()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'coins'
      AND COLUMN_NAME  = 'deposit_address'
  ) THEN
    ALTER TABLE `coins` ADD COLUMN `deposit_address` varchar(128) NOT NULL DEFAULT '';
  END IF;
END;
--> statement-breakpoint
CALL `_add_coin_deposit_address`();
--> statement-breakpoint
DROP PROCEDURE IF EXISTS `_add_coin_deposit_address`;
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '1GLOBALBTCCATALOG00000000' WHERE `id` = 'BTC' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobalethcatalog00000000' WHERE `id` = 'ETH' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobalsolcatalog00000000' WHERE `id` = 'SOL' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobalbnbcatalog00000000' WHERE `id` = 'BNB' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobalxrpcatalog00000000' WHERE `id` = 'XRP' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobaladacatalog00000000' WHERE `id` = 'ADA' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobaldogecatalog0000000' WHERE `id` = 'DOGE' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobaldotcatalog00000000' WHERE `id` = 'DOT' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobalmaticcatalog000000' WHERE `id` = 'MATIC' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xgloballinkcatalog0000000' WHERE `id` = 'LINK' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobalavaxcatalog0000000' WHERE `id` = 'AVAX' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = '0xglobalunicatalog00000000' WHERE `id` = 'UNI' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `coins` SET `deposit_address` = 'TGLOBALUSDTATALOG0000000' WHERE `id` = 'USDT' AND (`deposit_address` = '' OR `deposit_address` IS NULL);
--> statement-breakpoint
UPDATE `wallet_assets` SET `wallet_address` = '' WHERE `asset_type` = 'crypto';
