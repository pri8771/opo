CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`event` text NOT NULL,
	`channel` text NOT NULL,
	`count` integer NOT NULL
);
