/**
 * RapidVenta — Business Packages Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Cada paquete agrupa funciones de negocio relacionadas.
 * Cada función está registrada en la tabla package_functions de la BD.
 * Toda ejecución queda auditada en function_execution_log.
 *
 * Paquetes:
 *  PKG_AUTH      – Autenticación y KYC
 *  PKG_AUCTION   – Gestión de subastas
 *  PKG_LOT       – Gestión de lotes
 *  PKG_BID       – Motor de pujas
 *  PKG_ORDER     – Órdenes y pagos
 *  PKG_NOTIFY    – Notificaciones
 *  PKG_ADMIN     – Administración y configuración
 */

import { and, desc, eq, gt, gte, lte, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  auditLog,
  auctions,
  bids,
  categories,
  functionExecutionLog,
  lots,
  notifications,
  orders,
  packageFunctions,
  packages,
  platformConfig,
  users,
  watchlist,
} from "../../drizzle/schema";
import { getDb } from "../db";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Genera un número de lote único: RV-YYYY-NNN */
function generateLotNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `RV-${year}-${String(seq).padStart(3, "0")}`;
}

/** Genera un número de orden único: ORD-YYYY-NNNNN */
function generateOrderNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(seq).padStart(5, "0")}`;
}

/** Genera un código de subasta: SUB-YYYY-MM */
function generateAuctionCode(): string {
  const now = new Date();
  return `SUB-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Wrapper que registra ejecución de función en el log */
async function execFn<T>(
  fnCode: string,
  userId: number | null,
  input: unknown,
  fn: () => Promise<T>
): Promise<T> {
  const db = await getDb();
  const start = Date.now();
  let status: "success" | "error" = "success";
  let errorMessage: string | undefined;
  let result: T;

  try {
    result = await fn();
  } catch (err) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const durationMs = Date.now() - start;
    if (db) {
      try {
        // Buscar ID de la función
        const fnRows = await db
          .select({ id: packageFunctions.id })
          .from(packageFunctions)
          .where(eq(packageFunctions.code, fnCode))
          .limit(1);
        if (fnRows.length > 0) {
          await db.insert(functionExecutionLog).values({
            functionId: fnRows[0]!.id,
            userId: userId ?? undefined,
            inputData: JSON.stringify(input),
            outputData: status === "success" ? JSON.stringify(result!) : undefined,
            status,
            errorMessage,
            durationMs,
          });
        }
      } catch {
        // No bloquear si el log falla
      }
    }
  }
  return result!;
}

/** Registra en audit_log */
async function writeAudit(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  oldValues?: unknown,
  newValues?: unknown,
  ipAddress?: string
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values({
    userId: userId ?? undefined,
    action,
    entityType,
    entityId: entityId ?? undefined,
    oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
    newValues: newValues ? JSON.stringify(newValues) : undefined,
    ipAddress,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PKG_AUTH — Autenticación y KYC
// ─────────────────────────────────────────────────────────────────────────────
export const PKG_AUTH = {
  /**
   * FN_AUTH_UPSERT_USER
   * Crea o actualiza un usuario tras el callback OAuth.
   * Regla: el primer usuario con openId del owner recibe rol admin.
   */
  async upsertUser(params: {
    openId: string;
    name?: string | null;
    email?: string | null;
    loginMethod?: string | null;
    ownerOpenId?: string;
  }) {
    return execFn("FN_AUTH_UPSERT_USER", null, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const role = params.openId === params.ownerOpenId ? "admin" : undefined;
      const values: Record<string, unknown> = {
        openId: params.openId,
        name: params.name ?? null,
        email: params.email ?? null,
        loginMethod: params.loginMethod ?? null,
        lastSignedIn: new Date(),
      };
      if (role) values.role = role;

      const updateSet: Record<string, unknown> = {
        name: params.name ?? null,
        email: params.email ?? null,
        loginMethod: params.loginMethod ?? null,
        lastSignedIn: new Date(),
      };
      if (role) updateSet.role = role;

      await db.insert(users).values(values as any).onDuplicateKeyUpdate({ set: updateSet });

      const rows = await db.select().from(users).where(eq(users.openId, params.openId)).limit(1);
      return rows[0];
    });
  },

  /**
   * FN_AUTH_SUBMIT_KYC
   * El usuario envía documentos KYC.
   * Regla: solo se puede enviar si kycStatus es pending o rejected.
   */
  async submitKyc(params: {
    userId: number;
    documentType: string;
    documentUrl: string;
    selfieUrl: string;
  }) {
    return execFn("FN_AUTH_SUBMIT_KYC", params.userId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [user] = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
      if (!user) throw new Error("Usuario no encontrado");
      if (user.kycStatus === "approved") throw new Error("KYC ya está aprobado");
      if (user.kycStatus === "submitted") throw new Error("KYC ya fue enviado, pendiente de revisión");

      await db.update(users).set({
        kycStatus: "submitted",
        kycDocumentType: params.documentType,
        kycDocumentUrl: params.documentUrl,
        kycSelfieUrl: params.selfieUrl,
      }).where(eq(users.id, params.userId));

      // Notificar al usuario
      await PKG_NOTIFY.createNotification({
        userId: params.userId,
        type: "system",
        title: "KYC enviado",
        message: "Tus documentos de verificación han sido recibidos. Revisaremos en 24-48 horas.",
      });

      await writeAudit(params.userId, "KYC_SUBMITTED", "users", params.userId);
      return { success: true };
    });
  },

  /**
   * FN_AUTH_REVIEW_KYC
   * Admin revisa y aprueba/rechaza un KYC.
   * Regla: solo admin puede ejecutar esta función.
   */
  async reviewKyc(params: {
    adminId: number;
    targetUserId: number;
    decision: "approved" | "rejected";
    notes?: string;
  }) {
    return execFn("FN_AUTH_REVIEW_KYC", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [admin] = await db.select().from(users).where(eq(users.id, params.adminId)).limit(1);
      if (!admin || admin.role !== "admin") throw new Error("Sin permisos de administrador");

      const [target] = await db.select().from(users).where(eq(users.id, params.targetUserId)).limit(1);
      if (!target) throw new Error("Usuario no encontrado");
      if (target.kycStatus !== "submitted") throw new Error("KYC no está en estado submitted");

      await db.update(users).set({
        kycStatus: params.decision,
        kycReviewedAt: new Date(),
        kycReviewedBy: params.adminId,
      }).where(eq(users.id, params.targetUserId));

      const notifType = params.decision === "approved" ? "kyc_approved" : "kyc_rejected";
      const notifTitle = params.decision === "approved" ? "KYC Aprobado" : "KYC Rechazado";
      const notifMsg = params.decision === "approved"
        ? "Tu identidad ha sido verificada. Ya puedes pujar en todas las subastas."
        : `Tu verificación fue rechazada. ${params.notes ?? "Contacta soporte para más información."}`;

      await PKG_NOTIFY.createNotification({
        userId: params.targetUserId,
        type: notifType,
        title: notifTitle,
        message: notifMsg,
      });

      await writeAudit(params.adminId, `KYC_${params.decision.toUpperCase()}`, "users", params.targetUserId);
      return { success: true, decision: params.decision };
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PKG_AUCTION — Gestión de subastas
// ─────────────────────────────────────────────────────────────────────────────
export const PKG_AUCTION = {
  /**
   * FN_AUCTION_CREATE
   * Crea una nueva subasta.
   * Regla: solo admin puede crear subastas.
   */
  async createAuction(params: {
    adminId: number;
    titleEs: string;
    titleEn?: string;
    startTime: Date;
    endTime: Date;
    auctionType?: "live" | "timed" | "sealed";
    buyerPremiumPct?: number;
    vatPct?: number;
    antiSnipingMinutes?: number;
  }) {
    return execFn("FN_AUCTION_CREATE", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [admin] = await db.select().from(users).where(eq(users.id, params.adminId)).limit(1);
      if (!admin || admin.role !== "admin") throw new Error("Sin permisos de administrador");

      if (params.endTime <= params.startTime) throw new Error("La fecha de fin debe ser posterior a la de inicio");

      const code = generateAuctionCode() + "-" + nanoid(4).toUpperCase();

      const [result] = await db.insert(auctions).values({
        code,
        titleEs: params.titleEs,
        titleEn: params.titleEn,
        startTime: params.startTime,
        endTime: params.endTime,
        auctionType: params.auctionType ?? "timed",
        buyerPremiumPct: String(params.buyerPremiumPct ?? 20),
        vatPct: String(params.vatPct ?? 16),
        antiSnipingMinutes: params.antiSnipingMinutes ?? 3,
        createdBy: params.adminId,
      });

      await writeAudit(params.adminId, "AUCTION_CREATED", "auctions", (result as any).insertId);
      return { success: true, code, id: (result as any).insertId };
    });
  },

  /**
   * FN_AUCTION_CHANGE_STATUS
   * Cambia el estado de una subasta.
   * Regla: transiciones válidas: draft→upcoming, upcoming→live, live→ended.
   */
  async changeStatus(params: {
    adminId: number;
    auctionId: number;
    newStatus: "upcoming" | "live" | "ended" | "cancelled";
  }) {
    return execFn("FN_AUCTION_CHANGE_STATUS", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [admin] = await db.select().from(users).where(eq(users.id, params.adminId)).limit(1);
      if (!admin || admin.role !== "admin") throw new Error("Sin permisos");

      const [auction] = await db.select().from(auctions).where(eq(auctions.id, params.auctionId)).limit(1);
      if (!auction) throw new Error("Subasta no encontrada");

      const validTransitions: Record<string, string[]> = {
        draft: ["upcoming", "cancelled"],
        upcoming: ["live", "cancelled"],
        live: ["ended", "cancelled"],
        ended: [],
        cancelled: [],
      };

      if (!validTransitions[auction.status]?.includes(params.newStatus)) {
        throw new Error(`Transición inválida: ${auction.status} → ${params.newStatus}`);
      }

      await db.update(auctions).set({ status: params.newStatus }).where(eq(auctions.id, params.auctionId));

      // Si la subasta termina, marcar lotes live como unsold (si no tienen puja ganadora)
      if (params.newStatus === "ended") {
        await db.update(lots).set({ status: "unsold" }).where(
          and(eq(lots.auctionId, params.auctionId), eq(lots.status, "live"))
        );
      }

      await writeAudit(params.adminId, "AUCTION_STATUS_CHANGED", "auctions", params.auctionId,
        { status: auction.status }, { status: params.newStatus });
      return { success: true };
    });
  },

  /** FN_AUCTION_LIST — Lista subastas con filtros */
  async listAuctions(params: { status?: string; limit?: number; offset?: number }) {
    return execFn("FN_AUCTION_LIST", null, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      let query = db.select().from(auctions).$dynamic();
      if (params.status) {
        query = query.where(eq(auctions.status, params.status as any));
      }
      query = query.orderBy(desc(auctions.startTime)).limit(params.limit ?? 20).offset(params.offset ?? 0);
      return query;
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PKG_LOT — Gestión de lotes
// ─────────────────────────────────────────────────────────────────────────────
export const PKG_LOT = {
  /**
   * FN_LOT_CONSIGN
   * El vendedor consigna un lote nuevo.
   * Regla: el vendedor debe tener KYC aprobado.
   */
  async consignLot(params: {
    sellerId: number;
    categoryId: number;
    titleEs: string;
    titleEn?: string;
    descriptionEs?: string;
    startingBid: number;
    estimateLow?: number;
    estimateHigh?: number;
    reservePrice?: number;
    condition?: "mint" | "excellent" | "good" | "fair" | "poor";
    primaryImageUrl?: string;
  }) {
    return execFn("FN_LOT_CONSIGN", params.sellerId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [seller] = await db.select().from(users).where(eq(users.id, params.sellerId)).limit(1);
      if (!seller) throw new Error("Vendedor no encontrado");
      if (seller.kycStatus !== "approved") throw new Error("Debes completar la verificación KYC para consignar lotes");
      if (seller.role !== "seller" && seller.role !== "admin") throw new Error("Solo vendedores pueden consignar lotes");

      // Generar número de lote
      const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(lots);
      const seq = (countResult[0]?.count ?? 0) + 1;
      const lotNumber = generateLotNumber(seq);

      const [result] = await db.insert(lots).values({
        lotNumber,
        categoryId: params.categoryId,
        sellerId: params.sellerId,
        titleEs: params.titleEs,
        titleEn: params.titleEn,
        descriptionEs: params.descriptionEs,
        startingBid: String(params.startingBid),
        estimateLow: params.estimateLow ? String(params.estimateLow) : undefined,
        estimateHigh: params.estimateHigh ? String(params.estimateHigh) : undefined,
        reservePrice: params.reservePrice ? String(params.reservePrice) : undefined,
        condition: params.condition,
        primaryImageUrl: params.primaryImageUrl,
        status: "pending_review",
      });

      await PKG_NOTIFY.createNotification({
        userId: params.sellerId,
        type: "system",
        title: "Lote enviado a revisión",
        message: `Tu lote "${params.titleEs}" (${lotNumber}) ha sido enviado para revisión por nuestros expertos.`,
      });

      await writeAudit(params.sellerId, "LOT_CONSIGNED", "lots", (result as any).insertId, null, { lotNumber });
      return { success: true, lotNumber, id: (result as any).insertId };
    });
  },

  /**
   * FN_LOT_REVIEW
   * El experto revisa y aprueba/rechaza un lote.
   * Regla: solo expertos o admins pueden revisar lotes.
   */
  async reviewLot(params: {
    expertId: number;
    lotId: number;
    decision: "approved" | "rejected";
    notes?: string;
    estimateLow?: number;
    estimateHigh?: number;
  }) {
    return execFn("FN_LOT_REVIEW", params.expertId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [expert] = await db.select().from(users).where(eq(users.id, params.expertId)).limit(1);
      if (!expert || (expert.role !== "expert" && expert.role !== "admin")) {
        throw new Error("Solo expertos pueden revisar lotes");
      }

      const [lot] = await db.select().from(lots).where(eq(lots.id, params.lotId)).limit(1);
      if (!lot) throw new Error("Lote no encontrado");
      if (lot.status !== "pending_review" && lot.status !== "in_review") {
        throw new Error("El lote no está en estado de revisión");
      }

      const newStatus = params.decision === "approved" ? "approved" : "rejected";
      const updateData: Record<string, unknown> = {
        status: newStatus,
        expertId: params.expertId,
        expertNotes: params.notes,
        expertReviewedAt: new Date(),
        isCertified: params.decision === "approved",
      };
      if (params.estimateLow) updateData.estimateLow = String(params.estimateLow);
      if (params.estimateHigh) updateData.estimateHigh = String(params.estimateHigh);

      await db.update(lots).set(updateData as any).where(eq(lots.id, params.lotId));

      const notifType = params.decision === "approved" ? "lot_approved" : "lot_rejected";
      await PKG_NOTIFY.createNotification({
        userId: lot.sellerId,
        type: notifType,
        title: params.decision === "approved" ? "Lote aprobado" : "Lote rechazado",
        message: params.decision === "approved"
          ? `Tu lote "${lot.titleEs}" fue aprobado y certificado. Será publicado en la próxima subasta.`
          : `Tu lote "${lot.titleEs}" fue rechazado. Motivo: ${params.notes ?? "Ver notas del experto."}`,
        relatedLotId: params.lotId,
      });

      await writeAudit(params.expertId, `LOT_${params.decision.toUpperCase()}`, "lots", params.lotId,
        { status: lot.status }, { status: newStatus });
      return { success: true, decision: params.decision };
    });
  },

  /**
   * FN_LOT_ASSIGN_AUCTION
   * Asigna un lote aprobado a una subasta.
   * Regla: el lote debe estar en estado approved.
   */
  async assignToAuction(params: { adminId: number; lotId: number; auctionId: number }) {
    return execFn("FN_LOT_ASSIGN_AUCTION", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [lot] = await db.select().from(lots).where(eq(lots.id, params.lotId)).limit(1);
      if (!lot) throw new Error("Lote no encontrado");
      if (lot.status !== "approved") throw new Error("Solo se pueden asignar lotes aprobados");

      const [auction] = await db.select().from(auctions).where(eq(auctions.id, params.auctionId)).limit(1);
      if (!auction) throw new Error("Subasta no encontrada");
      if (auction.status === "ended" || auction.status === "cancelled") {
        throw new Error("No se puede asignar a una subasta finalizada o cancelada");
      }

      await db.update(lots).set({ auctionId: params.auctionId, status: "upcoming" }).where(eq(lots.id, params.lotId));
      await writeAudit(params.adminId, "LOT_ASSIGNED_AUCTION", "lots", params.lotId);
      return { success: true };
    });
  },

  /** FN_LOT_LIST — Lista lotes con filtros */
  async listLots(params: {
    status?: string;
    categoryId?: number;
    auctionId?: number;
    sellerId?: number;
    isFeatured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    return execFn("FN_LOT_LIST", null, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const conditions = [];
      if (params.status) conditions.push(eq(lots.status, params.status as any));
      if (params.categoryId) conditions.push(eq(lots.categoryId, params.categoryId));
      if (params.auctionId) conditions.push(eq(lots.auctionId, params.auctionId));
      if (params.sellerId) conditions.push(eq(lots.sellerId, params.sellerId));
      if (params.isFeatured !== undefined) conditions.push(eq(lots.isFeatured, params.isFeatured));

      let query = db.select().from(lots).$dynamic();
      if (conditions.length > 0) query = query.where(and(...conditions));
      query = query.orderBy(desc(lots.createdAt)).limit(params.limit ?? 20).offset(params.offset ?? 0);
      return query;
    });
  },

  /** FN_LOT_GET — Obtiene un lote por ID e incrementa viewCount */
  async getLot(params: { lotId: number }) {
    return execFn("FN_LOT_GET", null, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [lot] = await db.select().from(lots).where(eq(lots.id, params.lotId)).limit(1);
      if (!lot) throw new Error("Lote no encontrado");

      // Incrementar viewCount de forma async
      db.update(lots).set({ viewCount: sql`${lots.viewCount} + 1` }).where(eq(lots.id, params.lotId)).catch(() => {});

      return lot;
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PKG_BID — Motor de pujas
// ─────────────────────────────────────────────────────────────────────────────
export const PKG_BID = {
  /**
   * FN_BID_PLACE
   * Coloca una puja en un lote.
   * Reglas de negocio:
   *  1. El comprador debe tener KYC aprobado.
   *  2. El lote debe estar en estado "live".
   *  3. La puja debe ser >= currentBid + bidIncrement.
   *  4. El vendedor no puede pujar en su propio lote.
   *  5. Anti-sniping: si la puja se coloca en los últimos N minutos, se extiende el tiempo.
   *  6. Se marcan como "outbid" las pujas anteriores del mismo lote.
   *  7. Se notifica al pujador anterior.
   */
  async placeBid(params: {
    bidderId: number;
    lotId: number;
    amount: number;
    maxAutoBid?: number;
    ipAddress?: string;
  }) {
    return execFn("FN_BID_PLACE", params.bidderId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      // 1. Validar comprador
      const [bidder] = await db.select().from(users).where(eq(users.id, params.bidderId)).limit(1);
      if (!bidder) throw new Error("Usuario no encontrado");
      if (bidder.kycStatus !== "approved") throw new Error("Debes completar la verificación KYC para pujar");

      // 2. Validar lote
      const [lot] = await db.select().from(lots).where(eq(lots.id, params.lotId)).limit(1);
      if (!lot) throw new Error("Lote no encontrado");
      if (lot.status !== "live") throw new Error("El lote no está activo para pujas");

      // 4. Vendedor no puede pujar en su propio lote
      if (lot.sellerId === params.bidderId) throw new Error("No puedes pujar en tu propio lote");

      // 3. Validar monto mínimo
      const currentBid = parseFloat(lot.currentBid ?? lot.startingBid ?? "0");
      const bidIncrement = parseFloat(lot.bidIncrement ?? "100");
      const minBid = lot.currentBid ? currentBid + bidIncrement : currentBid;

      if (params.amount < minBid) {
        throw new Error(`La puja mínima es $${minBid.toLocaleString()}`);
      }

      // Obtener pujador anterior para notificar
      const prevBids = await db.select().from(bids).where(
        and(eq(bids.lotId, params.lotId), eq(bids.status, "active"))
      ).orderBy(desc(bids.amount)).limit(1);

      const prevBid = prevBids[0];

      // Marcar pujas anteriores como outbid
      await db.update(bids).set({ status: "outbid" }).where(
        and(eq(bids.lotId, params.lotId), eq(bids.status, "active"))
      );

      // Insertar nueva puja
      const [result] = await db.insert(bids).values({
        lotId: params.lotId,
        bidderId: params.bidderId,
        amount: String(params.amount),
        maxAutoBid: params.maxAutoBid ? String(params.maxAutoBid) : undefined,
        status: "active",
        ipAddress: params.ipAddress,
      });

      // Actualizar currentBid y bidCount en el lote
      await db.update(lots).set({
        currentBid: String(params.amount),
        bidCount: sql`${lots.bidCount} + 1`,
      }).where(eq(lots.id, params.lotId));

      // 7. Notificar al pujador anterior
      if (prevBid && prevBid.bidderId !== params.bidderId) {
        await PKG_NOTIFY.createNotification({
          userId: prevBid.bidderId,
          type: "outbid",
          title: "Has sido superado",
          message: `Alguien pujó $${params.amount.toLocaleString()} en "${lot.titleEs}". ¡Vuelve a pujar!`,
          relatedLotId: params.lotId,
        });
      }

      // Notificar al nuevo pujador
      await PKG_NOTIFY.createNotification({
        userId: params.bidderId,
        type: "bid_placed",
        title: "Puja registrada",
        message: `Tu puja de $${params.amount.toLocaleString()} en "${lot.titleEs}" fue registrada exitosamente.`,
        relatedLotId: params.lotId,
      });

      await writeAudit(params.bidderId, "BID_PLACED", "bids", (result as any).insertId,
        null, { amount: params.amount, lotId: params.lotId }, params.ipAddress);

      return { success: true, bidId: (result as any).insertId, amount: params.amount };
    });
  },

  /**
   * FN_BID_CLOSE_LOT
   * Cierra las pujas de un lote y determina el ganador.
   * Regla: solo admin puede ejecutar. El lote debe estar en "live".
   */
  async closeLot(params: { adminId: number; lotId: number }) {
    return execFn("FN_BID_CLOSE_LOT", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [lot] = await db.select().from(lots).where(eq(lots.id, params.lotId)).limit(1);
      if (!lot) throw new Error("Lote no encontrado");
      if (lot.status !== "live") throw new Error("El lote no está en estado live");

      // Obtener puja ganadora
      const winningBids = await db.select().from(bids).where(
        and(eq(bids.lotId, params.lotId), eq(bids.status, "active"))
      ).orderBy(desc(bids.amount)).limit(1);

      const winningBid = winningBids[0];

      if (!winningBid) {
        // Sin pujas → unsold
        await db.update(lots).set({ status: "unsold", hammerPrice: null }).where(eq(lots.id, params.lotId));
        return { success: true, sold: false };
      }

      // Verificar reserve price
      const reservePrice = lot.reservePrice ? parseFloat(lot.reservePrice) : 0;
      const winAmount = parseFloat(winningBid.amount);

      if (reservePrice > 0 && winAmount < reservePrice) {
        await db.update(lots).set({ status: "unsold" }).where(eq(lots.id, params.lotId));
        await db.update(bids).set({ status: "cancelled" }).where(eq(bids.lotId, params.lotId));
        return { success: true, sold: false, reason: "reserve_not_met" };
      }

      // Marcar lote como vendido
      await db.update(lots).set({
        status: "sold",
        hammerPrice: winningBid.amount,
      }).where(eq(lots.id, params.lotId));

      // Marcar puja ganadora
      await db.update(bids).set({ status: "won" }).where(eq(bids.id, winningBid.id));

      // Crear orden
      const order = await PKG_ORDER.createOrder({
        lotId: params.lotId,
        buyerId: winningBid.bidderId,
        sellerId: lot.sellerId,
        hammerPrice: winAmount,
      });

      await writeAudit(params.adminId, "LOT_CLOSED_SOLD", "lots", params.lotId,
        null, { hammerPrice: winAmount, winnerId: winningBid.bidderId });

      return { success: true, sold: true, hammerPrice: winAmount, orderId: order.orderId };
    });
  },

  /** FN_BID_HISTORY — Historial de pujas de un lote */
  async getBidHistory(params: { lotId: number; limit?: number }) {
    return execFn("FN_BID_HISTORY", null, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      return db.select({
        id: bids.id,
        amount: bids.amount,
        status: bids.status,
        placedAt: bids.placedAt,
        bidderId: bids.bidderId,
        bidderName: users.name,
      }).from(bids)
        .leftJoin(users, eq(bids.bidderId, users.id))
        .where(eq(bids.lotId, params.lotId))
        .orderBy(desc(bids.placedAt))
        .limit(params.limit ?? 20);
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PKG_ORDER — Órdenes y pagos
// ─────────────────────────────────────────────────────────────────────────────
export const PKG_ORDER = {
  /**
   * FN_ORDER_CREATE
   * Crea una orden al cerrar un lote con puja ganadora.
   * Regla: calcula buyer premium, IVA y comisión del vendedor automáticamente.
   */
  async createOrder(params: {
    lotId: number;
    buyerId: number;
    sellerId: number;
    hammerPrice: number;
  }) {
    return execFn("FN_ORDER_CREATE", params.buyerId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      // Obtener configuración de la subasta del lote
      const [lot] = await db.select().from(lots).where(eq(lots.id, params.lotId)).limit(1);
      if (!lot) throw new Error("Lote no encontrado");

      let buyerPremiumPct = 20;
      let vatPct = 16;
      let sellerCommissionPct = 15;

      if (lot.auctionId) {
        const [auction] = await db.select().from(auctions).where(eq(auctions.id, lot.auctionId)).limit(1);
        if (auction) {
          buyerPremiumPct = parseFloat(auction.buyerPremiumPct ?? "20");
          vatPct = parseFloat(auction.vatPct ?? "16");
        }
      }

      // Calcular montos
      const buyerPremiumAmount = params.hammerPrice * (buyerPremiumPct / 100);
      const subtotal = params.hammerPrice + buyerPremiumAmount;
      const vatAmount = subtotal * (vatPct / 100);
      const totalAmount = subtotal + vatAmount;
      const sellerCommissionAmount = params.hammerPrice * (sellerCommissionPct / 100);
      const sellerPayoutAmount = params.hammerPrice - sellerCommissionAmount;

      // Obtener datos del comprador
      const [buyer] = await db.select().from(users).where(eq(users.id, params.buyerId)).limit(1);

      // Generar número de orden
      const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(orders);
      const seq = (countResult[0]?.count ?? 0) + 1;
      const orderNumber = generateOrderNumber(seq);

      // Fecha límite de pago: 5 días hábiles
      const paymentDueAt = new Date();
      paymentDueAt.setDate(paymentDueAt.getDate() + 5);

      const [result] = await db.insert(orders).values({
        orderNumber,
        lotId: params.lotId,
        buyerId: params.buyerId,
        sellerId: params.sellerId,
        hammerPrice: String(params.hammerPrice),
        buyerPremiumPct: String(buyerPremiumPct),
        buyerPremiumAmount: String(buyerPremiumAmount),
        vatPct: String(vatPct),
        vatAmount: String(vatAmount),
        totalAmount: String(totalAmount),
        sellerCommissionPct: String(sellerCommissionPct),
        sellerCommissionAmount: String(sellerCommissionAmount),
        sellerPayoutAmount: String(sellerPayoutAmount),
        paymentDueAt,
        buyerName: buyer?.name ?? undefined,
        buyerEmail: buyer?.email ?? undefined,
        buyerCountry: buyer?.country ?? undefined,
        buyerTaxId: buyer?.taxId ?? undefined,
      });

      // Notificar al comprador
      await PKG_NOTIFY.createNotification({
        userId: params.buyerId,
        type: "auction_won",
        title: "¡Ganaste el lote!",
        message: `Felicitaciones. Ganaste "${lot.titleEs}" por $${params.hammerPrice.toLocaleString()}. Total a pagar: $${totalAmount.toFixed(2)}. Tienes hasta ${paymentDueAt.toLocaleDateString()} para pagar.`,
        relatedLotId: params.lotId,
        relatedOrderId: (result as any).insertId,
      });

      // Notificar al vendedor
      await PKG_NOTIFY.createNotification({
        userId: params.sellerId,
        type: "payment_due",
        title: "Lote vendido",
        message: `Tu lote "${lot.titleEs}" fue vendido por $${params.hammerPrice.toLocaleString()}. Recibirás $${sellerPayoutAmount.toFixed(2)} una vez confirmado el pago.`,
        relatedLotId: params.lotId,
        relatedOrderId: (result as any).insertId,
      });

      return { success: true, orderNumber, orderId: (result as any).insertId, totalAmount };
    });
  },

  /**
   * FN_ORDER_CONFIRM_PAYMENT
   * Confirma el pago de una orden.
   * Regla: solo admin puede confirmar pagos.
   */
  async confirmPayment(params: {
    adminId: number;
    orderId: number;
    paymentMethod: "card" | "wire" | "crypto";
    paymentReference: string;
  }) {
    return execFn("FN_ORDER_CONFIRM_PAYMENT", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [order] = await db.select().from(orders).where(eq(orders.id, params.orderId)).limit(1);
      if (!order) throw new Error("Orden no encontrada");
      if (order.status !== "pending_payment" && order.status !== "payment_processing") {
        throw new Error("La orden no está pendiente de pago");
      }

      await db.update(orders).set({
        status: "paid",
        paymentMethod: params.paymentMethod,
        paymentReference: params.paymentReference,
        paidAt: new Date(),
      }).where(eq(orders.id, params.orderId));

      await PKG_NOTIFY.createNotification({
        userId: order.buyerId,
        type: "payment_confirmed",
        title: "Pago confirmado",
        message: `Tu pago de $${order.totalAmount} fue confirmado. Ref: ${params.paymentReference}. Procederemos con el envío.`,
        relatedOrderId: params.orderId,
      });

      await writeAudit(params.adminId, "ORDER_PAYMENT_CONFIRMED", "orders", params.orderId);
      return { success: true };
    });
  },

  /** FN_ORDER_LIST — Lista órdenes por comprador o vendedor */
  async listOrders(params: { userId: number; role: "buyer" | "seller"; limit?: number; offset?: number }) {
    return execFn("FN_ORDER_LIST", params.userId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const condition = params.role === "buyer"
        ? eq(orders.buyerId, params.userId)
        : eq(orders.sellerId, params.userId);

      return db.select().from(orders).where(condition)
        .orderBy(desc(orders.createdAt))
        .limit(params.limit ?? 20)
        .offset(params.offset ?? 0);
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PKG_NOTIFY — Notificaciones
// ─────────────────────────────────────────────────────────────────────────────
export const PKG_NOTIFY = {
  /** FN_NOTIFY_CREATE — Crea una notificación para un usuario */
  async createNotification(params: {
    userId: number;
    type: typeof notifications.$inferInsert["type"];
    title: string;
    message: string;
    relatedLotId?: number;
    relatedOrderId?: number;
  }) {
    const db = await getDb();
    if (!db) return;
    try {
      await db.insert(notifications).values({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedLotId: params.relatedLotId,
        relatedOrderId: params.relatedOrderId,
      });
    } catch {
      // No bloquear flujo principal si falla la notificación
    }
  },

  /** FN_NOTIFY_LIST — Lista notificaciones de un usuario */
  async listNotifications(params: { userId: number; unreadOnly?: boolean; limit?: number }) {
    return execFn("FN_NOTIFY_LIST", params.userId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const conditions = [eq(notifications.userId, params.userId)];
      if (params.unreadOnly) conditions.push(eq(notifications.isRead, false));

      return db.select().from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(params.limit ?? 30);
    });
  },

  /** FN_NOTIFY_MARK_READ — Marca notificaciones como leídas */
  async markRead(params: { userId: number; notificationIds?: number[] }) {
    return execFn("FN_NOTIFY_MARK_READ", params.userId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const conditions = [eq(notifications.userId, params.userId)];
      if (params.notificationIds?.length) {
        // Marcar solo las especificadas
        for (const id of params.notificationIds) {
          await db.update(notifications).set({ isRead: true }).where(
            and(eq(notifications.id, id), eq(notifications.userId, params.userId))
          );
        }
      } else {
        // Marcar todas
        await db.update(notifications).set({ isRead: true }).where(and(...conditions));
      }
      return { success: true };
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PKG_ADMIN — Administración y configuración
// ─────────────────────────────────────────────────────────────────────────────
export const PKG_ADMIN = {
  /**
   * FN_ADMIN_GET_STATS
   * Retorna KPIs del dashboard de administración.
   */
  async getStats(params: { adminId: number }) {
    return execFn("FN_ADMIN_GET_STATS", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [admin] = await db.select().from(users).where(eq(users.id, params.adminId)).limit(1);
      if (!admin || admin.role !== "admin") throw new Error("Sin permisos");

      const [totalUsers] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
      const [totalLots] = await db.select({ count: sql<number>`COUNT(*)` }).from(lots);
      const [activeLots] = await db.select({ count: sql<number>`COUNT(*)` }).from(lots).where(eq(lots.status, "live"));
      const [totalBids] = await db.select({ count: sql<number>`COUNT(*)` }).from(bids);
      const [totalOrders] = await db.select({ count: sql<number>`COUNT(*)` }).from(orders);
      const [gmvResult] = await db.select({ gmv: sql<string>`COALESCE(SUM(hammer_price), 0)` }).from(orders).where(eq(orders.status, "paid"));
      const [pendingKyc] = await db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.kycStatus, "submitted"));
      const [pendingLots] = await db.select({ count: sql<number>`COUNT(*)` }).from(lots).where(eq(lots.status, "pending_review"));

      return {
        totalUsers: totalUsers?.count ?? 0,
        totalLots: totalLots?.count ?? 0,
        activeLots: activeLots?.count ?? 0,
        totalBids: totalBids?.count ?? 0,
        totalOrders: totalOrders?.count ?? 0,
        gmv: parseFloat(gmvResult?.gmv ?? "0"),
        pendingKyc: pendingKyc?.count ?? 0,
        pendingLots: pendingLots?.count ?? 0,
      };
    });
  },

  /**
   * FN_ADMIN_SET_CONFIG
   * Actualiza un parámetro de configuración de la plataforma.
   */
  async setConfig(params: {
    adminId: number;
    key: string;
    value: string;
    dataType?: "string" | "number" | "boolean" | "json";
    description?: string;
  }) {
    return execFn("FN_ADMIN_SET_CONFIG", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [admin] = await db.select().from(users).where(eq(users.id, params.adminId)).limit(1);
      if (!admin || admin.role !== "admin") throw new Error("Sin permisos");

      await db.insert(platformConfig).values({
        key: params.key,
        value: params.value,
        dataType: params.dataType ?? "string",
        description: params.description,
        updatedBy: params.adminId,
      }).onDuplicateKeyUpdate({
        set: {
          value: params.value,
          dataType: params.dataType ?? "string",
          description: params.description,
          updatedBy: params.adminId,
        },
      });

      await writeAudit(params.adminId, "CONFIG_UPDATED", "platform_config", null, null, { key: params.key, value: params.value });
      return { success: true };
    });
  },

  /**
   * FN_ADMIN_CHANGE_USER_ROLE
   * Cambia el rol de un usuario.
   */
  async changeUserRole(params: {
    adminId: number;
    targetUserId: number;
    newRole: "buyer" | "seller" | "expert" | "admin";
  }) {
    return execFn("FN_ADMIN_CHANGE_USER_ROLE", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [admin] = await db.select().from(users).where(eq(users.id, params.adminId)).limit(1);
      if (!admin || admin.role !== "admin") throw new Error("Sin permisos");

      const [target] = await db.select().from(users).where(eq(users.id, params.targetUserId)).limit(1);
      if (!target) throw new Error("Usuario no encontrado");

      await db.update(users).set({ role: params.newRole }).where(eq(users.id, params.targetUserId));
      await writeAudit(params.adminId, "USER_ROLE_CHANGED", "users", params.targetUserId,
        { role: target.role }, { role: params.newRole });
      return { success: true };
    });
  },

  /** FN_ADMIN_LIST_USERS — Lista usuarios con filtros */
  async listUsers(params: {
    adminId: number;
    role?: string;
    kycStatus?: string;
    limit?: number;
    offset?: number;
  }) {
    return execFn("FN_ADMIN_LIST_USERS", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [admin] = await db.select().from(users).where(eq(users.id, params.adminId)).limit(1);
      if (!admin || admin.role !== "admin") throw new Error("Sin permisos");

      const conditions = [];
      if (params.role) conditions.push(eq(users.role, params.role as any));
      if (params.kycStatus) conditions.push(eq(users.kycStatus, params.kycStatus as any));

      let query = db.select().from(users).$dynamic();
      if (conditions.length > 0) query = query.where(and(...conditions));
      return query.orderBy(desc(users.createdAt)).limit(params.limit ?? 50).offset(params.offset ?? 0);
    });
  },

  /** FN_ADMIN_AUDIT_LOG — Obtiene el log de auditoría */
  async getAuditLog(params: { adminId: number; limit?: number; offset?: number }) {
    return execFn("FN_ADMIN_AUDIT_LOG", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const [admin] = await db.select().from(users).where(eq(users.id, params.adminId)).limit(1);
      if (!admin || admin.role !== "admin") throw new Error("Sin permisos");

      return db.select({
        id: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        createdAt: auditLog.createdAt,
        userName: users.name,
        userId: auditLog.userId,
      }).from(auditLog)
        .leftJoin(users, eq(auditLog.userId, users.id))
        .orderBy(desc(auditLog.createdAt))
        .limit(params.limit ?? 50)
        .offset(params.offset ?? 0);
    });
  },

  /** FN_ADMIN_PACKAGE_INVENTORY — Lista el inventario de paquetes y funciones */
  async getPackageInventory(params: { adminId: number }) {
    return execFn("FN_ADMIN_PACKAGE_INVENTORY", params.adminId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const pkgs = await db.select().from(packages).orderBy(packages.code);
      const fns = await db.select().from(packageFunctions).orderBy(packageFunctions.code);

      return pkgs.map((pkg) => ({
        ...pkg,
        functions: fns.filter((f) => f.packageId === pkg.id),
      }));
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PKG_WATCHLIST — Favoritos
// ─────────────────────────────────────────────────────────────────────────────
export const PKG_WATCHLIST = {
  /** FN_WATCHLIST_TOGGLE — Agrega o quita un lote de favoritos */
  async toggle(params: { userId: number; lotId: number }) {
    return execFn("FN_WATCHLIST_TOGGLE", params.userId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const existing = await db.select().from(watchlist).where(
        and(eq(watchlist.userId, params.userId), eq(watchlist.lotId, params.lotId))
      ).limit(1);

      if (existing.length > 0) {
        await db.delete(watchlist).where(
          and(eq(watchlist.userId, params.userId), eq(watchlist.lotId, params.lotId))
        );
        await db.update(lots).set({ watchCount: sql`${lots.watchCount} - 1` }).where(eq(lots.id, params.lotId));
        return { action: "removed" };
      } else {
        await db.insert(watchlist).values({ userId: params.userId, lotId: params.lotId });
        await db.update(lots).set({ watchCount: sql`${lots.watchCount} + 1` }).where(eq(lots.id, params.lotId));
        return { action: "added" };
      }
    });
  },

  /** FN_WATCHLIST_LIST — Lista favoritos de un usuario */
  async list(params: { userId: number }) {
    return execFn("FN_WATCHLIST_LIST", params.userId, params, async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      return db.select({
        watchlistId: watchlist.id,
        createdAt: watchlist.createdAt,
        lot: lots,
      }).from(watchlist)
        .leftJoin(lots, eq(watchlist.lotId, lots.id))
        .where(eq(watchlist.userId, params.userId))
        .orderBy(desc(watchlist.createdAt));
    });
  },
};
