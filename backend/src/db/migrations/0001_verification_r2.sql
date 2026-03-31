ALTER TABLE `verification_documents` ADD `r2_key` varchar(512);--> statement-breakpoint
ALTER TABLE `verification_documents` ADD `original_filename` varchar(512);--> statement-breakpoint
ALTER TABLE `verification_documents` ADD `mime_type` varchar(128);--> statement-breakpoint
ALTER TABLE `verification_documents` ADD `file_size` int;