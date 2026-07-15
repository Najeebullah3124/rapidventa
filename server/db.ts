import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLog,
  auctions,
  bids,
  categories,
  lots,
  notifications,
  orders,
  packageFunctions,
  packages,
  platformConfig,
  users,
  watchlist,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Helpers internos ────────────────────────────────────────────────────────

async function logAudit(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number,
  oldValues?: object,
  newValues?: object
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values({
    userId,
    action,
    entityType,
    entityId,
    oldValues: oldValues ? JSON.stringify(oldValues) : null,
    newValues: newValues ? JSON.stringify(newValues) : null,
  });
}

async function createNotification(
  userId: number,
  type: typeof notifications.$inferInsert["type"],
  title: string,
  message: string,
  relatedLotId?: number,
  relatedOrderId?: number
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, type, title, message, relatedLotId, relatedOrderId });
}

async function getConfig(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ value: platformConfig.value }).from(platformConfig).where(eq(platformConfig.key, key)).limit(1);
  return row?.value ?? null;
}

// ─── PKG_AUTH ────────────────────────────────────────────────────────────────

export async function submitKyc(userId: number, documentType: string, documentUrl: string, selfieUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [user] = await db.select({ kycStatus: users.kycStatus }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("Usuario no encontrado");
  if (!["pending", "rejected"].includes(user.kycStatus)) throw new Error("KYC ya fue enviado o aprobado");
  await db.update(users).set({ kycStatus: "submitted", kycDocumentType: documentType, kycDocumentUrl: documentUrl, kycSelfieUrl: selfieUrl }).where(eq(users.id, userId));
  await createNotification(userId, "system", "KYC Recibido", "Tus documentos han sido recibidos y están en revisión.");
  return { success: true };
}

export async function reviewKyc(adminId: number, targetUserId: number, decision: "approved" | "rejected", notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ kycStatus: decision, kycReviewedAt: new Date(), kycReviewedBy: adminId }).where(eq(users.id, targetUserId));
  const notifType = decision === "approved" ? "kyc_approved" : "kyc_rejected";
  const title = decision === "approved" ? "KYC Aprobado" : "KYC Rechazado";
  const msg = decision === "approved" ? "Tu identidad ha sido verificada. Ya puedes participar en subastas." : `Tu verificación fue rechazada. ${notes ?? "Contacta soporte."}`;
  await createNotification(targetUserId, notifType, title, msg);
  await logAudit(adminId, "kyc_review", "users", targetUserId, {}, { decision, notes });
  return { success: true, decision };
}

// ─── PKG_AUCTION ─────────────────────────────────────────────────────────────

export async function createAuction(adminId: number, titleEs: string, startTime: Date, endTime: Date, opts?: { titleEn?: string; auctionType?: "live" | "timed" | "sealed"; buyerPremiumPct?: number; vatPct?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (endTime <= startTime) throw new Error("endTime debe ser posterior a startTime");
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const [countRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(auctions);
  const seq = String((countRow?.count ?? 0) + 1).padStart(4, "0");
  const code = `SUB-${year}-${month}-${seq}`;
  const [result] = await db.insert(auctions).values({ code, titleEs, titleEn: opts?.titleEn, status: "draft", auctionType: opts?.auctionType ?? "timed", startTime, endTime, buyerPremiumPct: String(opts?.buyerPremiumPct ?? 20), vatPct: String(opts?.vatPct ?? 16), createdBy: adminId });
  await logAudit(adminId, "auction_create", "auctions", (result as any).insertId, {}, { code, titleEs });
  return { success: true, code, id: (result as any).insertId as number };
}

export async function changeAuctionStatus(adminId: number, auctionId: number, newStatus: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const validTransitions: Record<string, string[]> = { draft: ["upcoming", "cancelled"], upcoming: ["live", "cancelled"], live: ["ended"], ended: [], cancelled: [] };
  const [auction] = await db.select({ status: auctions.status }).from(auctions).where(eq(auctions.id, auctionId)).limit(1);
  if (!auction) throw new Error("Subasta no encontrada");
  if (!validTransitions[auction.status]?.includes(newStatus)) throw new Error(`Transición inválida: ${auction.status} → ${newStatus}`);
  await db.update(auctions).set({ status: newStatus as any }).where(eq(auctions.id, auctionId));
  if (newStatus === "ended") await db.update(lots).set({ status: "unsold" }).where(and(eq(lots.auctionId, auctionId), eq(lots.status, "live"), eq(lots.bidCount, 0)));
  await logAudit(adminId, "auction_status_change", "auctions", auctionId, { status: auction.status }, { status: newStatus });
  return { success: true };
}

export async function listAuctions(filters?: { status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(auctions).orderBy(desc(auctions.startTime));
  if (filters?.status) q.where(eq(auctions.status, filters.status as any));
  if (filters?.limit) q.limit(filters.limit);
  if (filters?.offset) q.offset(filters.offset);
  return q;
}

// ─── PKG_LOT ─────────────────────────────────────────────────────────────────

export async function consignLot(sellerId: number, categoryId: number, titleEs: string, startingBid: number, opts?: { titleEn?: string; descriptionEs?: string; estimateLow?: number; estimateHigh?: number; condition?: string; reservePrice?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [seller] = await db.select({ kycStatus: users.kycStatus, role: users.role }).from(users).where(eq(users.id, sellerId)).limit(1);
  if (!seller) throw new Error("Vendedor no encontrado");
  if (seller.kycStatus !== "approved") throw new Error("Se requiere KYC aprobado para consignar lotes");
  if (!["seller", "admin"].includes(seller.role)) throw new Error("Se requiere rol seller o admin");
  const year = new Date().getFullYear();
  const [countRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(lots);
  const seq = String((countRow?.count ?? 0) + 1).padStart(3, "0");
  const lotNumber = `RV-${year}-${seq}`;
  const [result] = await db.insert(lots).values({ lotNumber, categoryId, sellerId, titleEs, titleEn: opts?.titleEn, descriptionEs: opts?.descriptionEs, startingBid: String(startingBid), estimateLow: opts?.estimateLow ? String(opts.estimateLow) : null, estimateHigh: opts?.estimateHigh ? String(opts.estimateHigh) : null, condition: opts?.condition as any, reservePrice: opts?.reservePrice ? String(opts.reservePrice) : null, status: "pending_review" });
  await createNotification(sellerId, "system", "Lote Recibido", `Tu lote "${titleEs}" (${lotNumber}) está en revisión.`);
  return { success: true, lotNumber, id: (result as any).insertId as number };
}

export async function reviewLot(expertId: number, lotId: number, decision: "approved" | "rejected", notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [lot] = await db.select({ status: lots.status, sellerId: lots.sellerId, titleEs: lots.titleEs }).from(lots).where(eq(lots.id, lotId)).limit(1);
  if (!lot) throw new Error("Lote no encontrado");
  if (!["pending_review", "in_review"].includes(lot.status)) throw new Error("El lote no está en estado de revisión");
  const newStatus = decision === "approved" ? "approved" : "rejected";
  await db.update(lots).set({ status: newStatus as any, expertId, expertNotes: notes, expertReviewedAt: new Date(), isCertified: decision === "approved" }).where(eq(lots.id, lotId));
  const notifType = decision === "approved" ? "lot_approved" : "lot_rejected";
  await createNotification(lot.sellerId, notifType, decision === "approved" ? "Lote Aprobado" : "Lote Rechazado", decision === "approved" ? `Tu lote "${lot.titleEs}" fue aprobado.` : `Tu lote "${lot.titleEs}" fue rechazado. ${notes ?? ""}`, lotId);
  await logAudit(expertId, "lot_review", "lots", lotId, { status: lot.status }, { status: newStatus, notes });
  return { success: true, decision };
}

export async function assignLotToAuction(adminId: number, lotId: number, auctionId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [lot] = await db.select({ status: lots.status }).from(lots).where(eq(lots.id, lotId)).limit(1);
  if (!lot) throw new Error("Lote no encontrado");
  if (lot.status !== "approved") throw new Error("Solo lotes aprobados pueden asignarse");
  const [auction] = await db.select({ status: auctions.status }).from(auctions).where(eq(auctions.id, auctionId)).limit(1);
  if (!auction) throw new Error("Subasta no encontrada");
  if (["ended", "cancelled"].includes(auction.status)) throw new Error("No se puede asignar a una subasta finalizada");
  await db.update(lots).set({ auctionId, status: "upcoming" }).where(eq(lots.id, lotId));
  await logAudit(adminId, "lot_assign_auction", "lots", lotId, {}, { auctionId });
  return { success: true };
}

export async function listLots(filters?: { status?: string; categoryId?: number; auctionId?: number; sellerId?: number; isFeatured?: boolean; search?: string; sort?: string; certified?: boolean; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.status) conditions.push(eq(lots.status, filters.status as any));
  if (filters?.categoryId) conditions.push(eq(lots.categoryId, filters.categoryId));
  if (filters?.auctionId) conditions.push(eq(lots.auctionId, filters.auctionId));
  if (filters?.sellerId) conditions.push(eq(lots.sellerId, filters.sellerId));
  if (filters?.isFeatured !== undefined) conditions.push(eq(lots.isFeatured, filters.isFeatured));
  if (filters?.certified !== undefined) conditions.push(eq(lots.isCertified, filters.certified));
  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(like(lots.titleEs, term), like(lots.titleEn, term), like(lots.lotNumber, term), like(lots.descriptionEs, term)));
  }
  const q = db.select({ lot: lots, category: { nameEs: categories.nameEs }, seller: { name: users.name } }).from(lots).leftJoin(categories, eq(lots.categoryId, categories.id)).leftJoin(users, eq(lots.sellerId, users.id));
  if (conditions.length > 0) q.where(and(...conditions));
  if (filters?.sort === "price_asc") q.orderBy(asc(lots.currentBid));
  else if (filters?.sort === "price_desc") q.orderBy(desc(lots.currentBid));
  else q.orderBy(desc(lots.createdAt));
  if (filters?.limit) q.limit(filters.limit);
  if (filters?.offset) q.offset(filters.offset);
  return q;
}

export async function getLot(lotId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.select({ lot: lots, category: { nameEs: categories.nameEs } }).from(lots).leftJoin(categories, eq(lots.categoryId, categories.id)).where(eq(lots.id, lotId)).limit(1);
  if (!row) throw new Error("Lote no encontrado");
  db.update(lots).set({ viewCount: sql`${lots.viewCount} + 1` }).where(eq(lots.id, lotId)).catch(() => {});
  return row;
}

// ─── PKG_BID ─────────────────────────────────────────────────────────────────

export async function placeBid(bidderId: number, lotId: number, amount: number, opts?: { maxAutoBid?: number; ipAddress?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [bidder] = await db.select({ kycStatus: users.kycStatus }).from(users).where(eq(users.id, bidderId)).limit(1);
  if (!bidder) throw new Error("Usuario no encontrado");
  const kycRequired = (await getConfig("kyc_required")) === "true";
  if (kycRequired && bidder.kycStatus !== "approved") throw new Error("Se requiere verificación KYC para pujar");
  const [lot] = await db.select({ status: lots.status, sellerId: lots.sellerId, currentBid: lots.currentBid, startingBid: lots.startingBid, bidIncrement: lots.bidIncrement, titleEs: lots.titleEs }).from(lots).where(eq(lots.id, lotId)).limit(1);
  if (!lot) throw new Error("Lote no encontrado");
  if (lot.status !== "live") throw new Error("El lote no está en subasta activa");
  if (lot.sellerId === bidderId) throw new Error("El vendedor no puede pujar en su propio lote");
  const minBid = Number(lot.currentBid ?? lot.startingBid);
  const increment = Number(lot.bidIncrement ?? 100);
  const minRequired = lot.currentBid ? minBid + increment : minBid;
  if (amount < minRequired) throw new Error(`La puja mínima es ${minRequired}`);
  await db.update(bids).set({ status: "outbid" }).where(and(eq(bids.lotId, lotId), eq(bids.status, "active")));
  const [prevBid] = await db.select({ bidderId: bids.bidderId }).from(bids).where(and(eq(bids.lotId, lotId), eq(bids.status, "outbid"))).orderBy(desc(bids.placedAt)).limit(1);
  if (prevBid && prevBid.bidderId !== bidderId) await createNotification(prevBid.bidderId, "outbid", "Superado en puja", `Alguien superó tu puja en "${lot.titleEs}". Nueva puja: $${amount.toLocaleString()}`, lotId);
  const [result] = await db.insert(bids).values({ lotId, bidderId, amount: String(amount), maxAutoBid: opts?.maxAutoBid ? String(opts.maxAutoBid) : null, status: "active", ipAddress: opts?.ipAddress });
  await db.update(lots).set({ currentBid: String(amount), bidCount: sql`${lots.bidCount} + 1` }).where(eq(lots.id, lotId));
  await createNotification(bidderId, "bid_placed", "Puja Registrada", `Tu puja de $${amount.toLocaleString()} en "${lot.titleEs}" fue registrada.`, lotId);
  return { success: true, bidId: (result as any).insertId as number, amount };
}

export async function closeLot(adminId: number, lotId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [lot] = await db.select().from(lots).where(eq(lots.id, lotId)).limit(1);
  if (!lot) throw new Error("Lote no encontrado");
  const [winningBid] = await db.select().from(bids).where(and(eq(bids.lotId, lotId), eq(bids.status, "active"))).orderBy(desc(bids.amount)).limit(1);
  if (!winningBid) { await db.update(lots).set({ status: "unsold" }).where(eq(lots.id, lotId)); return { success: true, sold: false, hammerPrice: null, orderId: null }; }
  const hammerPrice = Number(winningBid.amount);
  const reservePrice = lot.reservePrice ? Number(lot.reservePrice) : 0;
  if (reservePrice > 0 && hammerPrice < reservePrice) { await db.update(lots).set({ status: "unsold", hammerPrice: String(hammerPrice) }).where(eq(lots.id, lotId)); await db.update(bids).set({ status: "outbid" }).where(eq(bids.lotId, lotId)); return { success: true, sold: false, hammerPrice, orderId: null }; }
  await db.update(bids).set({ status: "won" }).where(eq(bids.id, winningBid.id));
  await db.update(lots).set({ status: "sold", hammerPrice: String(hammerPrice) }).where(eq(lots.id, lotId));
  const order = await createOrder(lot.sellerId, winningBid.bidderId, lotId, hammerPrice);
  await createNotification(winningBid.bidderId, "auction_won", "¡Ganaste el lote!", `Ganaste "${lot.titleEs}" por $${hammerPrice.toLocaleString()}. Tienes 5 días para pagar.`, lotId, order.orderId);
  await logAudit(adminId, "lot_close", "lots", lotId, {}, { hammerPrice, winnerId: winningBid.bidderId });
  return { success: true, sold: true, hammerPrice, orderId: order.orderId };
}

export async function getBidHistory(lotId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: bids.id, amount: bids.amount, status: bids.status, placedAt: bids.placedAt, bidderName: users.name }).from(bids).leftJoin(users, eq(bids.bidderId, users.id)).where(eq(bids.lotId, lotId)).orderBy(desc(bids.amount)).limit(limit);
}

// ─── PKG_ORDER ───────────────────────────────────────────────────────────────

export async function createOrder(sellerId: number, buyerId: number, lotId: number, hammerPrice: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [auctionRow] = await db.select({ buyerPremiumPct: auctions.buyerPremiumPct, vatPct: auctions.vatPct }).from(lots).leftJoin(auctions, eq(lots.auctionId, auctions.id)).where(eq(lots.id, lotId)).limit(1);
  const buyerPremiumPct = Number(auctionRow?.buyerPremiumPct ?? 20);
  const vatPct = Number(auctionRow?.vatPct ?? 16);
  const sellerCommissionPct = Number((await getConfig("seller_commission_pct")) ?? "15");
  const buyerPremiumAmount = hammerPrice * (buyerPremiumPct / 100);
  const vatAmount = (hammerPrice + buyerPremiumAmount) * (vatPct / 100);
  const totalAmount = hammerPrice + buyerPremiumAmount + vatAmount;
  const sellerCommissionAmount = hammerPrice * (sellerCommissionPct / 100);
  const sellerPayoutAmount = hammerPrice - sellerCommissionAmount;
  const year = new Date().getFullYear();
  const [countRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(orders);
  const seq = String((countRow?.count ?? 0) + 1).padStart(5, "0");
  const orderNumber = `ORD-${year}-${seq}`;
  const paymentDueDays = Number((await getConfig("payment_due_days")) ?? "5");
  const paymentDueAt = new Date(); paymentDueAt.setDate(paymentDueAt.getDate() + paymentDueDays);
  const [result] = await db.insert(orders).values({ orderNumber, lotId, buyerId, sellerId, hammerPrice: String(hammerPrice), buyerPremiumPct: String(buyerPremiumPct), buyerPremiumAmount: String(buyerPremiumAmount), vatPct: String(vatPct), vatAmount: String(vatAmount), totalAmount: String(totalAmount), sellerCommissionPct: String(sellerCommissionPct), sellerCommissionAmount: String(sellerCommissionAmount), sellerPayoutAmount: String(sellerPayoutAmount), paymentDueAt, status: "pending_payment" });
  return { success: true, orderNumber, orderId: (result as any).insertId as number, totalAmount };
}

export async function confirmPayment(adminId: number, orderId: number, paymentMethod: string, paymentReference: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [order] = await db.select({ status: orders.status, buyerId: orders.buyerId, orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Orden no encontrada");
  if (!["pending_payment", "payment_processing"].includes(order.status)) throw new Error("Estado de orden inválido");
  await db.update(orders).set({ status: "paid", paymentMethod: paymentMethod as any, paymentReference, paidAt: new Date() }).where(eq(orders.id, orderId));
  await createNotification(order.buyerId, "payment_confirmed", "Pago Confirmado", `Tu pago de la orden ${order.orderNumber} fue confirmado.`, undefined, orderId);
  await logAudit(adminId, "payment_confirm", "orders", orderId, { status: order.status }, { status: "paid", paymentMethod });
  return { success: true };
}

export async function listOrders(userId: number, role: "buyer" | "seller", limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const condition = role === "buyer" ? eq(orders.buyerId, userId) : eq(orders.sellerId, userId);
  return db.select({ order: orders, lot: { lotNumber: lots.lotNumber, titleEs: lots.titleEs } }).from(orders).leftJoin(lots, eq(orders.lotId, lots.id)).where(condition).orderBy(desc(orders.createdAt)).limit(limit);
}

// ─── PKG_NOTIFY ──────────────────────────────────────────────────────────────

export async function listNotifications(userId: number, unreadOnly = false, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  return db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationsRead(userId: number, notificationIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const condition = notificationIds?.length ? and(eq(notifications.userId, userId), inArray(notifications.id, notificationIds)) : eq(notifications.userId, userId);
  await db.update(notifications).set({ isRead: true }).where(condition);
  return { success: true };
}

// ─── PKG_WATCHLIST ───────────────────────────────────────────────────────────

export async function toggleWatchlist(userId: number, lotId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [existing] = await db.select({ id: watchlist.id }).from(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.lotId, lotId))).limit(1);
  if (existing) { await db.delete(watchlist).where(eq(watchlist.id, existing.id)); await db.update(lots).set({ watchCount: sql`GREATEST(0, ${lots.watchCount} - 1)` }).where(eq(lots.id, lotId)); return { action: "removed" as const }; }
  await db.insert(watchlist).values({ userId, lotId });
  await db.update(lots).set({ watchCount: sql`${lots.watchCount} + 1` }).where(eq(lots.id, lotId));
  return { action: "added" as const };
}

export async function listWatchlist(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ watchlistId: watchlist.id, createdAt: watchlist.createdAt, lot: lots, category: { nameEs: categories.nameEs } }).from(watchlist).leftJoin(lots, eq(watchlist.lotId, lots.id)).leftJoin(categories, eq(lots.categoryId, categories.id)).where(eq(watchlist.userId, userId)).orderBy(desc(watchlist.createdAt));
}

// ─── PKG_ADMIN ───────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [[totalUsers], [totalLots], [activeLots], [totalBids], [totalOrders], [gmvRow], [pendingKyc], [pendingLots]] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
    db.select({ count: sql<number>`COUNT(*)` }).from(lots),
    db.select({ count: sql<number>`COUNT(*)` }).from(lots).where(eq(lots.status, "live")),
    db.select({ count: sql<number>`COUNT(*)` }).from(bids),
    db.select({ count: sql<number>`COUNT(*)` }).from(orders),
    db.select({ gmv: sql<number>`COALESCE(SUM(hammerPrice), 0)` }).from(orders).where(eq(orders.status, "paid")),
    db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.kycStatus, "submitted")),
    db.select({ count: sql<number>`COUNT(*)` }).from(lots).where(eq(lots.status, "pending_review")),
  ]);
  return { totalUsers: totalUsers.count, totalLots: totalLots.count, activeLots: activeLots.count, totalBids: totalBids.count, totalOrders: totalOrders.count, gmv: Number(gmvRow.gmv), pendingKyc: pendingKyc.count, pendingLots: pendingLots.count };
}

export async function setConfig(adminId: number, key: string, value: string, dataType?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(platformConfig).values({ key, value, dataType: (dataType as any) ?? "string", updatedBy: adminId }).onDuplicateKeyUpdate({ set: { value, updatedBy: adminId } });
  await logAudit(adminId, "config_update", "platform_config", 0, {}, { key, value });
  return { success: true };
}

export async function changeUserRole(adminId: number, targetUserId: number, newRole: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!user) throw new Error("Usuario no encontrado");
  await db.update(users).set({ role: newRole as any }).where(eq(users.id, targetUserId));
  await logAudit(adminId, "user_role_change", "users", targetUserId, { role: user.role }, { role: newRole });
  return { success: true };
}

export async function listUsers(filters?: { role?: string; kycStatus?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: ReturnType<typeof eq>[] = [];
  if (filters?.role) conditions.push(eq(users.role, filters.role as any));
  if (filters?.kycStatus) conditions.push(eq(users.kycStatus, filters.kycStatus as any));
  const q = db.select().from(users);
  if (conditions.length > 0) q.where(and(...conditions));
  q.orderBy(desc(users.createdAt));
  if (filters?.limit) q.limit(filters.limit);
  return q;
}

export async function getAuditLog(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ log: auditLog, userName: users.name }).from(auditLog).leftJoin(users, eq(auditLog.userId, users.id)).orderBy(desc(auditLog.createdAt)).limit(limit);
}

export async function getPackageInventory() {
  const db = await getDb();
  if (!db) return [];
  const pkgs = await db.select().from(packages).where(eq(packages.isActive, true)).orderBy(packages.code);
  const fns = await db.select().from(packageFunctions).where(eq(packageFunctions.isActive, true)).orderBy(packageFunctions.code);
  return pkgs.map((pkg) => ({ ...pkg, functions: fns.filter((f) => f.packageId === pkg.id) }));
}

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
}

export async function getPlatformConfig() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(platformConfig).orderBy(platformConfig.key);
}

export async function getPackageFunctions(packageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(packageFunctions).where(and(eq(packageFunctions.packageId, packageId), eq(packageFunctions.isActive, true))).orderBy(packageFunctions.code);
}

// ─── PKG_AUCTION_REGISTRATION ────────────────────────────────────────────────

export async function registerForAuction(userId: number, auctionId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if auction exists and is registerable
  const [auction] = await db.select({ id: auctions.id, status: auctions.status }).from(auctions).where(eq(auctions.id, auctionId)).limit(1);
  if (!auction) throw new Error("Subasta no encontrada");
  if (!["upcoming", "live"].includes(auction.status)) throw new Error("La subasta no acepta registros en este momento");
  // Upsert registration (ignore duplicate)
  await db.execute(sql`INSERT IGNORE INTO auction_registrations (userId, auctionId, status) VALUES (${userId}, ${auctionId}, 'approved')`);
  await logAudit(userId, "auction_register", "auctions", auctionId, {}, { userId, auctionId });
  return { success: true, auctionId };
}

export async function getAuctionRegistration(userId: number, auctionId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.execute(sql`SELECT * FROM auction_registrations WHERE userId = ${userId} AND auctionId = ${auctionId} LIMIT 1`) as any;
  return row?.[0] ?? null;
}

export async function listAuctionRegistrations(auctionId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`SELECT ar.*, u.name, u.email FROM auction_registrations ar LEFT JOIN users u ON ar.userId = u.id WHERE ar.auctionId = ${auctionId} ORDER BY ar.registeredAt DESC`) as any;
  return rows[0] ?? [];
}

// ─── PKG_PRICE_ALERTS ────────────────────────────────────────────────────────

export async function setPriceAlert(userId: number, lotId: number, targetPrice: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Deactivate any existing alert for this lot by this user
  await db.execute(sql`UPDATE price_alerts SET isActive = FALSE WHERE userId = ${userId} AND lotId = ${lotId}`);
  // Insert new alert
  await db.execute(sql`INSERT INTO price_alerts (userId, lotId, targetPrice, isActive) VALUES (${userId}, ${lotId}, ${targetPrice}, TRUE)`);
  return { success: true };
}

export async function deletePriceAlert(userId: number, alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.execute(sql`DELETE FROM price_alerts WHERE id = ${alertId} AND userId = ${userId}`);
  return { success: true };
}

export async function listPriceAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT pa.*, l.titleEs, l.currentBid, l.status as lotStatus, l.lotNumber
    FROM price_alerts pa
    LEFT JOIN lots l ON pa.lotId = l.id
    WHERE pa.userId = ${userId} AND pa.isActive = TRUE
    ORDER BY pa.createdAt DESC
  `) as any;
  return rows[0] ?? [];
}

// ─── PKG_ORDERS (buyer confirm payment) ─────────────────────────────────────

export async function buyerConfirmPayment(buyerId: number, orderId: number, paymentMethod: string, paymentReference: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [order] = await db.select({ id: orders.id, buyerId: orders.buyerId, status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Orden no encontrada");
  if (order.buyerId !== buyerId) throw new Error("No tienes permiso para confirmar este pago");
  if (order.status !== "pending_payment") throw new Error("La orden no está en estado de pago pendiente");
  await db.update(orders).set({ paymentMethod: paymentMethod as any, paymentReference, status: "payment_submitted" as any, paidAt: new Date() }).where(eq(orders.id, orderId));
  await logAudit(buyerId, "payment_submitted", "orders", orderId, { status: "pending_payment" }, { status: "payment_submitted", paymentMethod, paymentReference });
  // Notify seller
  const [fullOrder] = await db.select({ sellerId: orders.sellerId, lotId: orders.lotId }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (fullOrder?.sellerId) {
    await db.insert(notifications).values({ userId: fullOrder.sellerId, type: "payment_confirmed", title: "Pago recibido", message: `El comprador ha enviado el comprobante de pago para la orden #${orderId}`, relatedOrderId: orderId });
  }
  return { success: true };
}

// ─── SEARCH (full-text) ───────────────────────────────────────────────────────

export async function searchLots(query: string, filters?: { categoryId?: number; status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;
  const searchTerm = `%${query}%`;

  let whereClause = sql`(l.titleEs LIKE ${searchTerm} OR l.titleEn LIKE ${searchTerm} OR l.descriptionEs LIKE ${searchTerm} OR l.lotNumber LIKE ${searchTerm})`;
  if (filters?.categoryId) whereClause = sql`${whereClause} AND l.categoryId = ${filters.categoryId}`;
  if (filters?.status) whereClause = sql`${whereClause} AND l.status = ${filters.status}`;

  const rows = await db.execute(sql`
    SELECT l.*, c.nameEs as categoryNameEs, u.name as sellerName
    FROM lots l
    LEFT JOIN categories c ON l.categoryId = c.id
    LEFT JOIN users u ON l.sellerId = u.id
    WHERE ${whereClause}
    ORDER BY l.createdAt DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as any;

  const countRows = await db.execute(sql`
    SELECT COUNT(*) as total FROM lots l WHERE ${whereClause}
  `) as any;

  return { items: rows[0] ?? [], total: Number(countRows[0]?.[0]?.total ?? 0) };
}

// ─── LOT REVIEW HISTORY ───────────────────────────────────────────────────────

export async function getLotReviewHistory(lotId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT al.*, u.name as reviewerName
    FROM audit_log al
    LEFT JOIN users u ON al.userId = u.id
    WHERE al.tableName = 'lots' AND al.recordId = ${lotId}
      AND al.action IN ('lot_approve', 'lot_reject', 'lot_request_changes')
    ORDER BY al.createdAt DESC
  `) as any;
  return rows[0] ?? [];
}

// ─── POLLING: lot status for real-time updates ───────────────────────────────

export async function getLotStatus(lotId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [lot] = await db.select({
    id: lots.id,
    status: lots.status,
    currentBid: lots.currentBid,
    bidCount: lots.bidCount,
    hammerPrice: lots.hammerPrice,
    updatedAt: lots.updatedAt,
  }).from(lots).where(eq(lots.id, lotId)).limit(1);
  if (!lot) throw new Error("Lote no encontrado");
  return lot;
}
