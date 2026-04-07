-- Slot ids (doc-passport, etc.) are reused for every user; PK on `id` alone caused duplicate-key 500s
-- on /verification/steps and /verification/documents for the second user onward.
ALTER TABLE `verification_documents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `verification_documents` ADD PRIMARY KEY (`user_id`, `id`);
