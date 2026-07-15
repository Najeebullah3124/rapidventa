CREATE TABLE `kyc_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('passport','national_id','drivers_license','residence_permit') NOT NULL,
	`documentUrl` varchar(512) NOT NULL,
	`selfieUrl` varchar(512),
	`status` enum('pending','submitted','approved','rejected') NOT NULL DEFAULT 'submitted',
	`reviewedBy` int,
	`reviewNotes` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `kyc_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_kyc_userId` ON `kyc_documents` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_kyc_status` ON `kyc_documents` (`status`);--> statement-breakpoint
CREATE INDEX `idx_kyc_submittedAt` ON `kyc_documents` (`submittedAt`);