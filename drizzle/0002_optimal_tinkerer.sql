CREATE TABLE `network_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`project_id` text,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`idempotency_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `network_posts_idempotency_hash_unique` ON `network_posts` (`idempotency_hash`);--> statement-breakpoint
CREATE INDEX `network_created_idx` ON `network_posts` (`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `network_project_idx` ON `network_posts` (`project_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `network_parent_idx` ON `network_posts` (`parent_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `network_kind_idx` ON `network_posts` (`kind`,`created_at`,`id`);