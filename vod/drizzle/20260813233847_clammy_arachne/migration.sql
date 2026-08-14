-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `vod_index` (
	`inventory_path` text NOT NULL UNIQUE,
	`date` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventories` (
	`id` integer AUTOINCREMENT,
	`inventory_path` text NOT NULL UNIQUE,
	`date` text NOT NULL,
	`updated_at` integer NOT NULL,
	`speech_total` integer DEFAULT 0,
	CONSTRAINT `inventories_pk` PRIMARY KEY(`id`)
);

*/
