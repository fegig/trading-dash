ALTER TABLE `platform_settings`
  ADD COLUMN `og_title` varchar(255) NOT NULL DEFAULT '' AFTER `email_logo_r2_key`,
  ADD COLUMN `og_description` varchar(512) NOT NULL DEFAULT '' AFTER `og_title`,
  ADD COLUMN `favicon_r2_key` varchar(512) NULL AFTER `og_description`;
