CREATE TABLE `auctions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`titleEs` varchar(255) NOT NULL,
	`titleEn` varchar(255),
	`descriptionEs` text,
	`descriptionEn` text,
	`status` enum('draft','upcoming','live','ended','cancelled') NOT NULL DEFAULT 'draft',
	`auctionType` enum('live','timed','sealed') NOT NULL DEFAULT 'timed',
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`previewStartTime` timestamp,
	`coverImageUrl` text,
	`buyerPremiumPct` decimal(5,2) NOT NULL DEFAULT '20.00',
	`vatPct` decimal(5,2) NOT NULL DEFAULT '16.00',
	`antiSnipingMinutes` int DEFAULT 3,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auctions_id` PRIMARY KEY(`id`),
	CONSTRAINT `auctions_code_unique` UNIQUE(`code`),
	CONSTRAINT `idx_auctions_code` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`oldValues` text,
	`newValues` text,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lotId` int NOT NULL,
	`bidderId` int NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`maxAutoBid` decimal(14,2),
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`status` enum('active','outbid','won','cancelled','invalid') NOT NULL DEFAULT 'active',
	`isAutoBid` boolean DEFAULT false,
	`ipAddress` varchar(64),
	`userAgent` text,
	`placedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nameEs` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`description` text,
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `idx_categories_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `function_execution_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`functionId` int NOT NULL,
	`userId` int,
	`inputData` text,
	`outputData` text,
	`status` enum('success','error','warning') NOT NULL,
	`errorMessage` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`durationMs` int,
	CONSTRAINT `function_execution_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lotNumber` varchar(32) NOT NULL,
	`auctionId` int,
	`categoryId` int,
	`sellerId` int NOT NULL,
	`expertId` int,
	`titleEs` varchar(255) NOT NULL,
	`titleEn` varchar(255),
	`descriptionEs` text,
	`descriptionEn` text,
	`condition` enum('mint','excellent','good','fair','poor'),
	`provenance` text,
	`primaryImageUrl` text,
	`imageUrls` text,
	`estimateLow` decimal(14,2),
	`estimateHigh` decimal(14,2),
	`startingBid` decimal(14,2) NOT NULL,
	`reservePrice` decimal(14,2),
	`currentBid` decimal(14,2),
	`hammerPrice` decimal(14,2),
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`bidIncrement` decimal(10,2) DEFAULT '100.00',
	`status` enum('draft','pending_review','in_review','approved','rejected','upcoming','live','sold','unsold','withdrawn') NOT NULL DEFAULT 'draft',
	`isFeatured` boolean DEFAULT false,
	`isCertified` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`watchCount` int DEFAULT 0,
	`bidCount` int DEFAULT 0,
	`expertNotes` text,
	`expertReviewedAt` timestamp,
	`weightKg` decimal(8,3),
	`dimensionsCm` varchar(64),
	`shippingNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lots_id` PRIMARY KEY(`id`),
	CONSTRAINT `lots_lotNumber_unique` UNIQUE(`lotNumber`),
	CONSTRAINT `idx_lots_lotNumber` UNIQUE(`lotNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('bid_placed','outbid','auction_won','auction_lost','lot_approved','lot_rejected','kyc_approved','kyc_rejected','payment_due','payment_confirmed','shipment_update','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedLotId` int,
	`relatedOrderId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`lotId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`hammerPrice` decimal(14,2) NOT NULL,
	`buyerPremiumPct` decimal(5,2) NOT NULL,
	`buyerPremiumAmount` decimal(14,2) NOT NULL,
	`vatPct` decimal(5,2) NOT NULL,
	`vatAmount` decimal(14,2) NOT NULL,
	`totalAmount` decimal(14,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`sellerCommissionPct` decimal(5,2) DEFAULT '15.00',
	`sellerCommissionAmount` decimal(14,2),
	`sellerPayoutAmount` decimal(14,2),
	`status` enum('pending_payment','payment_processing','paid','preparing_shipment','shipped','delivered','disputed','refunded','cancelled') NOT NULL DEFAULT 'pending_payment',
	`paymentMethod` enum('card','wire','crypto'),
	`paymentReference` varchar(255),
	`paidAt` timestamp,
	`paymentDueAt` timestamp,
	`trackingNumber` varchar(128),
	`carrier` varchar(64),
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`buyerName` varchar(255),
	`buyerEmail` varchar(320),
	`buyerCountry` varchar(64),
	`buyerTaxId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`),
	CONSTRAINT `idx_orders_orderNumber` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `package_functions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`code` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`businessRule` text,
	`inputSchema` text,
	`outputSchema` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `package_functions_id` PRIMARY KEY(`id`),
	CONSTRAINT `package_functions_code_unique` UNIQUE(`code`),
	CONSTRAINT `idx_pkgfn_code` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`version` varchar(32) NOT NULL DEFAULT '1.0.0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `packages_code_unique` UNIQUE(`code`),
	CONSTRAINT `idx_packages_code` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `platform_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text NOT NULL,
	`dataType` enum('string','number','boolean','json') NOT NULL DEFAULT 'string',
	`description` text,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_config_key_unique` UNIQUE(`key`),
	CONSTRAINT `idx_config_key` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('buyer','seller','expert','admin') NOT NULL DEFAULT 'buyer',
	`kycStatus` enum('pending','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
	`kycDocumentType` varchar(64),
	`kycDocumentUrl` text,
	`kycSelfieUrl` text,
	`kycReviewedAt` timestamp,
	`kycReviewedBy` int,
	`phone` varchar(32),
	`country` varchar(64),
	`city` varchar(128),
	`taxId` varchar(64),
	`bio` text,
	`avatarUrl` text,
	`companyName` varchar(255),
	`certifications` text,
	`sellerRating` decimal(3,2),
	`totalSales` int DEFAULT 0,
	`isVerifiedSeller` boolean DEFAULT false,
	`isVerifiedExpert` boolean DEFAULT false,
	`notifyBid` boolean DEFAULT true,
	`notifyOutbid` boolean DEFAULT true,
	`notifyWon` boolean DEFAULT true,
	`notifyKyc` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lotId` int NOT NULL,
	`alertOnBid` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_watchlist_user_lot` UNIQUE(`userId`,`lotId`)
);
--> statement-breakpoint
ALTER TABLE `auctions` ADD CONSTRAINT `auctions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bids` ADD CONSTRAINT `bids_lotId_lots_id_fk` FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bids` ADD CONSTRAINT `bids_bidderId_users_id_fk` FOREIGN KEY (`bidderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `function_execution_log` ADD CONSTRAINT `function_execution_log_functionId_package_functions_id_fk` FOREIGN KEY (`functionId`) REFERENCES `package_functions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `function_execution_log` ADD CONSTRAINT `function_execution_log_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lots` ADD CONSTRAINT `lots_auctionId_auctions_id_fk` FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lots` ADD CONSTRAINT `lots_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lots` ADD CONSTRAINT `lots_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lots` ADD CONSTRAINT `lots_expertId_users_id_fk` FOREIGN KEY (`expertId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedLotId_lots_id_fk` FOREIGN KEY (`relatedLotId`) REFERENCES `lots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedOrderId_orders_id_fk` FOREIGN KEY (`relatedOrderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_lotId_lots_id_fk` FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `package_functions` ADD CONSTRAINT `package_functions_packageId_packages_id_fk` FOREIGN KEY (`packageId`) REFERENCES `packages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platform_config` ADD CONSTRAINT `platform_config_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist` ADD CONSTRAINT `watchlist_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist` ADD CONSTRAINT `watchlist_lotId_lots_id_fk` FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_auctions_status` ON `auctions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_auctions_startTime` ON `auctions` (`startTime`);--> statement-breakpoint
CREATE INDEX `idx_auctions_endTime` ON `auctions` (`endTime`);--> statement-breakpoint
CREATE INDEX `idx_audit_userId` ON `audit_log` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_entityType` ON `audit_log` (`entityType`);--> statement-breakpoint
CREATE INDEX `idx_audit_createdAt` ON `audit_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_bids_lotId` ON `bids` (`lotId`);--> statement-breakpoint
CREATE INDEX `idx_bids_bidderId` ON `bids` (`bidderId`);--> statement-breakpoint
CREATE INDEX `idx_bids_status` ON `bids` (`status`);--> statement-breakpoint
CREATE INDEX `idx_bids_placedAt` ON `bids` (`placedAt`);--> statement-breakpoint
CREATE INDEX `idx_bids_amount` ON `bids` (`amount`);--> statement-breakpoint
CREATE INDEX `idx_categories_isActive` ON `categories` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_fnlog_functionId` ON `function_execution_log` (`functionId`);--> statement-breakpoint
CREATE INDEX `idx_fnlog_userId` ON `function_execution_log` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_fnlog_executedAt` ON `function_execution_log` (`executedAt`);--> statement-breakpoint
CREATE INDEX `idx_fnlog_status` ON `function_execution_log` (`status`);--> statement-breakpoint
CREATE INDEX `idx_lots_auctionId` ON `lots` (`auctionId`);--> statement-breakpoint
CREATE INDEX `idx_lots_categoryId` ON `lots` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_lots_sellerId` ON `lots` (`sellerId`);--> statement-breakpoint
CREATE INDEX `idx_lots_expertId` ON `lots` (`expertId`);--> statement-breakpoint
CREATE INDEX `idx_lots_status` ON `lots` (`status`);--> statement-breakpoint
CREATE INDEX `idx_lots_isFeatured` ON `lots` (`isFeatured`);--> statement-breakpoint
CREATE INDEX `idx_notifications_userId` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_notifications_isRead` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `idx_notifications_type` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `idx_notifications_createdAt` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_orders_lotId` ON `orders` (`lotId`);--> statement-breakpoint
CREATE INDEX `idx_orders_buyerId` ON `orders` (`buyerId`);--> statement-breakpoint
CREATE INDEX `idx_orders_sellerId` ON `orders` (`sellerId`);--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_orders_createdAt` ON `orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_pkgfn_packageId` ON `package_functions` (`packageId`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `idx_users_kycStatus` ON `users` (`kycStatus`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_watchlist_userId` ON `watchlist` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_watchlist_lotId` ON `watchlist` (`lotId`);