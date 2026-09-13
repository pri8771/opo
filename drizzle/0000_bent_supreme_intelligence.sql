CREATE TABLE `experiments` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`hypothesis` text NOT NULL,
	`metric` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`actor_type` text NOT NULL,
	`role` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`idempotency_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_idempotency_hash_unique` ON `messages` (`idempotency_hash`);--> statement-breakpoint
CREATE INDEX `messages_created_idx` ON `messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `messages_parent_idx` ON `messages` (`parent_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`model` text NOT NULL,
	`summary` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer
);
