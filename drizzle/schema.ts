import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// 1. USERS
// ─────────────────────────────────────────────────────────────────────────────
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["buyer", "seller", "expert", "admin"]).default("buyer").notNull(),
    kycStatus: mysqlEnum("kycStatus", ["pending", "submitted", "approved", "rejected"]).default("pending").notNull(),
    kycDocumentType: varchar("kycDocumentType", { length: 64 }),
    kycDocumentUrl: text("kycDocumentUrl"),
    kycSelfieUrl: text("kycSelfieUrl"),
    kycReviewedAt: timestamp("kycReviewedAt"),
    kycReviewedBy: int("kycReviewedBy"),
    phone: varchar("phone", { length: 32 }),
    country: varchar("country", { length: 64 }),
    city: varchar("city", { length: 128 }),
    taxId: varchar("taxId", { length: 64 }),
    bio: text("bio"),
    avatarUrl: text("avatarUrl"),
    companyName: varchar("companyName", { length: 255 }),
    certifications: text("certifications"),
    sellerRating: decimal("sellerRating", { precision: 3, scale: 2 }),
    totalSales: int("totalSales").default(0),
    isVerifiedSeller: boolean("isVerifiedSeller").default(false),
    isVerifiedExpert: boolean("isVerifiedExpert").default(false),
    notifyBid: boolean("notifyBid").default(true),
    notifyOutbid: boolean("notifyOutbid").default(true),
    notifyWon: boolean("notifyWon").default(true),
    notifyKyc: boolean("notifyKyc").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (t) => [
    index("idx_users_role").on(t.role),
    index("idx_users_kycStatus").on(t.kycStatus),
    index("idx_users_email").on(t.email),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. PACKAGE INVENTORY
// ─────────────────────────────────────────────────────────────────────────────
export const packages = mysqlTable(
  "packages",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    version: varchar("version", { length: 32 }).notNull().default("1.0.0"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("idx_packages_code").on(t.code),
  ]
);

export const packageFunctions = mysqlTable(
  "package_functions",
  {
    id: int("id").autoincrement().primaryKey(),
    packageId: int("packageId").notNull().references(() => packages.id),
    code: varchar("code", { length: 128 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    businessRule: text("businessRule"),
    inputSchema: text("inputSchema"),
    outputSchema: text("outputSchema"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("idx_pkgfn_packageId").on(t.packageId),
    uniqueIndex("idx_pkgfn_code").on(t.code),
  ]
);

export const functionExecutionLog = mysqlTable(
  "function_execution_log",
  {
    id: int("id").autoincrement().primaryKey(),
    functionId: int("functionId").notNull().references(() => packageFunctions.id),
    userId: int("userId").references(() => users.id),
    inputData: text("inputData"),
    outputData: text("outputData"),
    status: mysqlEnum("status", ["success", "error", "warning"]).notNull(),
    errorMessage: text("errorMessage"),
    executedAt: timestamp("executedAt").defaultNow().notNull(),
    durationMs: int("durationMs"),
  },
  (t) => [
    index("idx_fnlog_functionId").on(t.functionId),
    index("idx_fnlog_userId").on(t.userId),
    index("idx_fnlog_executedAt").on(t.executedAt),
    index("idx_fnlog_status").on(t.status),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    nameEs: varchar("nameEs", { length: 128 }).notNull(),
    nameEn: varchar("nameEn", { length: 128 }).notNull(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    isActive: boolean("isActive").default(true).notNull(),
    sortOrder: int("sortOrder").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("idx_categories_slug").on(t.slug),
    index("idx_categories_isActive").on(t.isActive),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. AUCTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const auctions = mysqlTable(
  "auctions",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    titleEs: varchar("titleEs", { length: 255 }).notNull(),
    titleEn: varchar("titleEn", { length: 255 }),
    descriptionEs: text("descriptionEs"),
    descriptionEn: text("descriptionEn"),
    status: mysqlEnum("status", ["draft", "upcoming", "live", "ended", "cancelled"]).default("draft").notNull(),
    auctionType: mysqlEnum("auctionType", ["live", "timed", "sealed"]).default("timed").notNull(),
    startTime: timestamp("startTime").notNull(),
    endTime: timestamp("endTime").notNull(),
    previewStartTime: timestamp("previewStartTime"),
    coverImageUrl: text("coverImageUrl"),
    buyerPremiumPct: decimal("buyerPremiumPct", { precision: 5, scale: 2 }).default("20.00").notNull(),
    vatPct: decimal("vatPct", { precision: 5, scale: 2 }).default("16.00").notNull(),
    antiSnipingMinutes: int("antiSnipingMinutes").default(3),
    currency: varchar("currency", { length: 8 }).default("USD").notNull(),
    createdBy: int("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("idx_auctions_code").on(t.code),
    index("idx_auctions_status").on(t.status),
    index("idx_auctions_startTime").on(t.startTime),
    index("idx_auctions_endTime").on(t.endTime),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. LOTS
// ─────────────────────────────────────────────────────────────────────────────
export const lots = mysqlTable(
  "lots",
  {
    id: int("id").autoincrement().primaryKey(),
    lotNumber: varchar("lotNumber", { length: 32 }).notNull().unique(),
    auctionId: int("auctionId").references(() => auctions.id),
    categoryId: int("categoryId").references(() => categories.id),
    sellerId: int("sellerId").notNull().references(() => users.id),
    expertId: int("expertId").references(() => users.id),
    titleEs: varchar("titleEs", { length: 255 }).notNull(),
    titleEn: varchar("titleEn", { length: 255 }),
    descriptionEs: text("descriptionEs"),
    descriptionEn: text("descriptionEn"),
    condition: mysqlEnum("condition", ["mint", "excellent", "good", "fair", "poor"]),
    provenance: text("provenance"),
    primaryImageUrl: text("primaryImageUrl"),
    imageUrls: text("imageUrls"),
    estimateLow: decimal("estimateLow", { precision: 14, scale: 2 }),
    estimateHigh: decimal("estimateHigh", { precision: 14, scale: 2 }),
    startingBid: decimal("startingBid", { precision: 14, scale: 2 }).notNull(),
    reservePrice: decimal("reservePrice", { precision: 14, scale: 2 }),
    currentBid: decimal("currentBid", { precision: 14, scale: 2 }),
    hammerPrice: decimal("hammerPrice", { precision: 14, scale: 2 }),
    currency: varchar("currency", { length: 8 }).default("USD").notNull(),
    bidIncrement: decimal("bidIncrement", { precision: 10, scale: 2 }).default("100.00"),
    status: mysqlEnum("status", [
      "draft", "pending_review", "in_review", "approved", "rejected",
      "upcoming", "live", "sold", "unsold", "withdrawn"
    ]).default("draft").notNull(),
    isFeatured: boolean("isFeatured").default(false),
    isCertified: boolean("isCertified").default(false),
    viewCount: int("viewCount").default(0),
    watchCount: int("watchCount").default(0),
    bidCount: int("bidCount").default(0),
    expertNotes: text("expertNotes"),
    expertReviewedAt: timestamp("expertReviewedAt"),
    weightKg: decimal("weightKg", { precision: 8, scale: 3 }),
    dimensionsCm: varchar("dimensionsCm", { length: 64 }),
    shippingNotes: text("shippingNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("idx_lots_lotNumber").on(t.lotNumber),
    index("idx_lots_auctionId").on(t.auctionId),
    index("idx_lots_categoryId").on(t.categoryId),
    index("idx_lots_sellerId").on(t.sellerId),
    index("idx_lots_expertId").on(t.expertId),
    index("idx_lots_status").on(t.status),
    index("idx_lots_isFeatured").on(t.isFeatured),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. BIDS
// ─────────────────────────────────────────────────────────────────────────────
export const bids = mysqlTable(
  "bids",
  {
    id: int("id").autoincrement().primaryKey(),
    lotId: int("lotId").notNull().references(() => lots.id),
    bidderId: int("bidderId").notNull().references(() => users.id),
    amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
    maxAutoBid: decimal("maxAutoBid", { precision: 14, scale: 2 }),
    currency: varchar("currency", { length: 8 }).default("USD").notNull(),
    status: mysqlEnum("status", ["active", "outbid", "won", "cancelled", "invalid"]).default("active").notNull(),
    isAutoBid: boolean("isAutoBid").default(false),
    ipAddress: varchar("ipAddress", { length: 64 }),
    userAgent: text("userAgent"),
    placedAt: timestamp("placedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("idx_bids_lotId").on(t.lotId),
    index("idx_bids_bidderId").on(t.bidderId),
    index("idx_bids_status").on(t.status),
    index("idx_bids_placedAt").on(t.placedAt),
    index("idx_bids_amount").on(t.amount),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. WATCHLIST
// ─────────────────────────────────────────────────────────────────────────────
export const watchlist = mysqlTable(
  "watchlist",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    lotId: int("lotId").notNull().references(() => lots.id),
    alertOnBid: boolean("alertOnBid").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("idx_watchlist_user_lot").on(t.userId, t.lotId),
    index("idx_watchlist_userId").on(t.userId),
    index("idx_watchlist_lotId").on(t.lotId),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. ORDERS
// ─────────────────────────────────────────────────────────────────────────────
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
    lotId: int("lotId").notNull().references(() => lots.id),
    buyerId: int("buyerId").notNull().references(() => users.id),
    sellerId: int("sellerId").notNull().references(() => users.id),
    hammerPrice: decimal("hammerPrice", { precision: 14, scale: 2 }).notNull(),
    buyerPremiumPct: decimal("buyerPremiumPct", { precision: 5, scale: 2 }).notNull(),
    buyerPremiumAmount: decimal("buyerPremiumAmount", { precision: 14, scale: 2 }).notNull(),
    vatPct: decimal("vatPct", { precision: 5, scale: 2 }).notNull(),
    vatAmount: decimal("vatAmount", { precision: 14, scale: 2 }).notNull(),
    totalAmount: decimal("totalAmount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 8 }).default("USD").notNull(),
    sellerCommissionPct: decimal("sellerCommissionPct", { precision: 5, scale: 2 }).default("15.00"),
    sellerCommissionAmount: decimal("sellerCommissionAmount", { precision: 14, scale: 2 }),
    sellerPayoutAmount: decimal("sellerPayoutAmount", { precision: 14, scale: 2 }),
    status: mysqlEnum("status", [
      "pending_payment", "payment_processing", "paid",
      "preparing_shipment", "shipped", "delivered", "disputed", "refunded", "cancelled"
    ]).default("pending_payment").notNull(),
    paymentMethod: mysqlEnum("paymentMethod", ["card", "wire", "crypto"]),
    paymentReference: varchar("paymentReference", { length: 255 }),
    paidAt: timestamp("paidAt"),
    paymentDueAt: timestamp("paymentDueAt"),
    trackingNumber: varchar("trackingNumber", { length: 128 }),
    carrier: varchar("carrier", { length: 64 }),
    shippedAt: timestamp("shippedAt"),
    deliveredAt: timestamp("deliveredAt"),
    buyerName: varchar("buyerName", { length: 255 }),
    buyerEmail: varchar("buyerEmail", { length: 320 }),
    buyerCountry: varchar("buyerCountry", { length: 64 }),
    buyerTaxId: varchar("buyerTaxId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("idx_orders_orderNumber").on(t.orderNumber),
    index("idx_orders_lotId").on(t.lotId),
    index("idx_orders_buyerId").on(t.buyerId),
    index("idx_orders_sellerId").on(t.sellerId),
    index("idx_orders_status").on(t.status),
    index("idx_orders_createdAt").on(t.createdAt),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    type: mysqlEnum("type", [
      "bid_placed", "outbid", "auction_won", "auction_lost",
      "lot_approved", "lot_rejected", "kyc_approved", "kyc_rejected",
      "payment_due", "payment_confirmed", "shipment_update", "system"
    ]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    relatedLotId: int("relatedLotId").references(() => lots.id),
    relatedOrderId: int("relatedOrderId").references(() => orders.id),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("idx_notifications_userId").on(t.userId),
    index("idx_notifications_isRead").on(t.isRead),
    index("idx_notifications_type").on(t.type),
    index("idx_notifications_createdAt").on(t.createdAt),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. PLATFORM CONFIG
// ─────────────────────────────────────────────────────────────────────────────
export const platformConfig = mysqlTable(
  "platform_config",
  {
    id: int("id").autoincrement().primaryKey(),
    key: varchar("key", { length: 128 }).notNull().unique(),
    value: text("value").notNull(),
    dataType: mysqlEnum("dataType", ["string", "number", "boolean", "json"]).default("string").notNull(),
    description: text("description"),
    updatedBy: int("updatedBy").references(() => users.id),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("idx_config_key").on(t.key),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────
export const auditLog = mysqlTable(
  "audit_log",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").references(() => users.id),
    action: varchar("action", { length: 128 }).notNull(),
    entityType: varchar("entityType", { length: 64 }),
    entityId: int("entityId"),
    oldValues: text("oldValues"),
    newValues: text("newValues"),
    ipAddress: varchar("ipAddress", { length: 64 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("idx_audit_userId").on(t.userId),
    index("idx_audit_action").on(t.action),
    index("idx_audit_entityType").on(t.entityType),
    index("idx_audit_createdAt").on(t.createdAt),
  ]
);

// ───────────────────────────────────────────────────────────────────────────────
// 12. KYC DOCUMENTS
// ───────────────────────────────────────────────────────────────────────────────
export const kycDocuments = mysqlTable(
  "kyc_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    documentType: mysqlEnum("documentType", ["passport", "national_id", "drivers_license", "residence_permit"]).notNull(),
    documentUrl: varchar("documentUrl", { length: 512 }).notNull(),
    selfieUrl: varchar("selfieUrl", { length: 512 }),
    status: mysqlEnum("status", ["pending", "submitted", "approved", "rejected"]).default("submitted").notNull(),
    reviewedBy: int("reviewedBy").references(() => users.id),
    reviewNotes: text("reviewNotes"),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
  },
  (t) => [
    index("idx_kyc_userId").on(t.userId),
    index("idx_kyc_status").on(t.status),
    index("idx_kyc_submittedAt").on(t.submittedAt),
  ]
);

export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = typeof kycDocuments.$inferInsert;

// ───────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ───────────────────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  lotsAsSeller: many(lots, { relationName: "seller" }),
  lotsAsExpert: many(lots, { relationName: "expert" }),
  bids: many(bids),
  watchlist: many(watchlist),
  ordersAsBuyer: many(orders, { relationName: "buyer" }),
  ordersAsSeller: many(orders, { relationName: "seller_orders" }),
  notifications: many(notifications),
}));

export const packagesRelations = relations(packages, ({ many }) => ({
  functions: many(packageFunctions),
}));

export const packageFunctionsRelations = relations(packageFunctions, ({ one, many }) => ({
  package: one(packages, { fields: [packageFunctions.packageId], references: [packages.id] }),
  executions: many(functionExecutionLog),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  lots: many(lots),
}));

export const auctionsRelations = relations(auctions, ({ many, one }) => ({
  lots: many(lots),
  creator: one(users, { fields: [auctions.createdBy], references: [users.id] }),
}));

export const lotsRelations = relations(lots, ({ one, many }) => ({
  auction: one(auctions, { fields: [lots.auctionId], references: [auctions.id] }),
  category: one(categories, { fields: [lots.categoryId], references: [categories.id] }),
  seller: one(users, { fields: [lots.sellerId], references: [users.id], relationName: "seller" }),
  expert: one(users, { fields: [lots.expertId], references: [users.id], relationName: "expert" }),
  bids: many(bids),
  watchlistEntries: many(watchlist),
  orders: many(orders),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  lot: one(lots, { fields: [bids.lotId], references: [lots.id] }),
  bidder: one(users, { fields: [bids.bidderId], references: [users.id] }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  lot: one(lots, { fields: [orders.lotId], references: [lots.id] }),
  buyer: one(users, { fields: [orders.buyerId], references: [users.id], relationName: "buyer" }),
  seller: one(users, { fields: [orders.sellerId], references: [users.id], relationName: "seller_orders" }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  lot: one(lots, { fields: [notifications.relatedLotId], references: [lots.id] }),
  order: one(orders, { fields: [notifications.relatedOrderId], references: [orders.id] }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Package = typeof packages.$inferSelect;
export type PackageFunction = typeof packageFunctions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Auction = typeof auctions.$inferSelect;
export type Lot = typeof lots.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
