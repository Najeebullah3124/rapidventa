import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Middleware de roles ───────────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Se requiere rol administrador" });
  return next({ ctx });
});

const expertOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["expert", "admin"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Se requiere rol experto o administrador" });
  return next({ ctx });
});

const sellerOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["seller", "admin"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Se requiere rol vendedor o administrador" });
  return next({ ctx });
});

// ─── Router principal ─────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  kyc: router({
    submit: protectedProcedure
      .input(z.object({ documentType: z.string().min(1), documentUrl: z.string().url(), selfieUrl: z.string().url() }))
      .mutation(async ({ ctx, input }) => db.submitKyc(ctx.user.id, input.documentType, input.documentUrl, input.selfieUrl)),

    review: adminProcedure
      .input(z.object({ targetUserId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => db.reviewKyc(ctx.user.id, input.targetUserId, input.decision, input.notes)),

    listPending: adminProcedure.query(async () => db.listUsers({ kycStatus: "submitted" })),
  }),

  auctions: router({
    list: publicProcedure
      .input(z.object({ status: z.string().optional(), limit: z.number().int().positive().max(100).optional(), offset: z.number().int().min(0).optional() }).optional())
      .query(async ({ input }) => db.listAuctions(input ?? {})),

    create: adminProcedure
      .input(z.object({ titleEs: z.string().min(3), titleEn: z.string().optional(), startTime: z.date(), endTime: z.date(), auctionType: z.enum(["live", "timed", "sealed"]).optional(), buyerPremiumPct: z.number().min(0).max(50).optional(), vatPct: z.number().min(0).max(50).optional() }))
      .mutation(async ({ ctx, input }) => db.createAuction(ctx.user.id, input.titleEs, input.startTime, input.endTime, { titleEn: input.titleEn, auctionType: input.auctionType, buyerPremiumPct: input.buyerPremiumPct, vatPct: input.vatPct })),

    changeStatus: adminProcedure
      .input(z.object({ auctionId: z.number().int().positive(), status: z.string() }))
      .mutation(async ({ ctx, input }) => db.changeAuctionStatus(ctx.user.id, input.auctionId, input.status)),
  }),

  lots: router({
    list: publicProcedure
      .input(z.object({ status: z.string().optional(), categoryId: z.number().int().positive().optional(), auctionId: z.number().int().positive().optional(), sellerId: z.number().int().positive().optional(), isFeatured: z.boolean().optional(), search: z.string().optional(), sort: z.enum(["recent", "price_asc", "price_desc", "ending"]).optional(), certified: z.boolean().optional(), limit: z.number().int().positive().max(100).optional(), offset: z.number().int().min(0).optional() }).optional())
      .query(async ({ input }) => db.listLots(input ?? {})),

    get: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => db.getLot(input.id)),

    consign: sellerOrAdminProcedure
      .input(z.object({ categoryId: z.number().int().positive(), titleEs: z.string().min(3), titleEn: z.string().optional(), descriptionEs: z.string().optional(), startingBid: z.number().positive(), estimateLow: z.number().positive().optional(), estimateHigh: z.number().positive().optional(), condition: z.string().optional(), reservePrice: z.number().positive().optional() }))
      .mutation(async ({ ctx, input }) => db.consignLot(ctx.user.id, input.categoryId, input.titleEs, input.startingBid, { titleEn: input.titleEn, descriptionEs: input.descriptionEs, estimateLow: input.estimateLow, estimateHigh: input.estimateHigh, condition: input.condition, reservePrice: input.reservePrice })),

    review: expertOrAdminProcedure
      .input(z.object({ lotId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => db.reviewLot(ctx.user.id, input.lotId, input.decision, input.notes)),

    assignToAuction: adminProcedure
      .input(z.object({ lotId: z.number().int().positive(), auctionId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => db.assignLotToAuction(ctx.user.id, input.lotId, input.auctionId)),

    close: adminProcedure
      .input(z.object({ lotId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => db.closeLot(ctx.user.id, input.lotId)),

    myLots: sellerOrAdminProcedure.query(async ({ ctx }) => db.listLots({ sellerId: ctx.user.id })),

    pendingReview: expertOrAdminProcedure.query(async () => db.listLots({ status: "pending_review", limit: 50 })),
  }),

  bids: router({
    place: protectedProcedure
      .input(z.object({ lotId: z.number().int().positive(), amount: z.number().positive(), maxAutoBid: z.number().positive().optional() }))
      .mutation(async ({ ctx, input }) => {
        const ip = (ctx.req as any).ip ?? (ctx.req as any).socket?.remoteAddress;
        return db.placeBid(ctx.user.id, input.lotId, input.amount, { maxAutoBid: input.maxAutoBid, ipAddress: ip });
      }),

    history: publicProcedure
      .input(z.object({ lotId: z.number().int().positive(), limit: z.number().int().positive().max(50).optional() }))
      .query(async ({ input }) => db.getBidHistory(input.lotId, input.limit ?? 20)),

    myBids: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { bids, lots } = await import("../drizzle/schema");
      const { desc, eq } = await import("drizzle-orm");
      return drizzleDb.select({ bid: bids, lot: { lotNumber: lots.lotNumber, titleEs: lots.titleEs, status: lots.status, currentBid: lots.currentBid } })
        .from(bids).leftJoin(lots, eq(bids.lotId, lots.id))
        .where(eq(bids.bidderId, ctx.user.id)).orderBy(desc(bids.placedAt)).limit(50);
    }),
  }),

  orders: router({
    myOrders: protectedProcedure
      .input(z.object({ role: z.enum(["buyer", "seller"]).optional() }))
      .query(async ({ ctx, input }) => db.listOrders(ctx.user.id, input.role ?? "buyer")),

    confirmPayment: adminProcedure
      .input(z.object({ orderId: z.number().int().positive(), paymentMethod: z.string(), paymentReference: z.string() }))
      .mutation(async ({ ctx, input }) => db.confirmPayment(ctx.user.id, input.orderId, input.paymentMethod, input.paymentReference)),

    getOrder: protectedProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { orders, lots } = await import("../drizzle/schema");
        const { eq, and, or } = await import("drizzle-orm");
        const [row] = await drizzleDb.select({ order: orders, lot: { lotNumber: lots.lotNumber, titleEs: lots.titleEs } })
          .from(orders).leftJoin(lots, eq(orders.lotId, lots.id))
          .where(and(eq(orders.id, input.orderId), or(eq(orders.buyerId, ctx.user.id), eq(orders.sellerId, ctx.user.id)))).limit(1);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Orden no encontrada" });
        return row;
      }),

    allOrders: adminProcedure
      .input(z.object({ limit: z.number().int().positive().max(100).optional() }).optional())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { orders, lots, users } = await import("../drizzle/schema");
        const { desc, eq } = await import("drizzle-orm");
        return drizzleDb.select({ order: orders, lot: { lotNumber: lots.lotNumber, titleEs: lots.titleEs }, buyer: { name: users.name } })
          .from(orders).leftJoin(lots, eq(orders.lotId, lots.id)).leftJoin(users, eq(orders.buyerId, users.id))
          .orderBy(desc(orders.createdAt)).limit(input?.limit ?? 50);
      }),
  }),

  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional(), limit: z.number().int().positive().max(100).optional() }).optional())
      .query(async ({ ctx, input }) => db.listNotifications(ctx.user.id, input?.unreadOnly ?? false, input?.limit ?? 30)),

    markRead: protectedProcedure
      .input(z.object({ ids: z.array(z.number().int().positive()).optional() }))
      .mutation(async ({ ctx, input }) => db.markNotificationsRead(ctx.user.id, input.ids)),
  }),

  watchlist: router({
    toggle: protectedProcedure
      .input(z.object({ lotId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => db.toggleWatchlist(ctx.user.id, input.lotId)),

    list: protectedProcedure.query(async ({ ctx }) => db.listWatchlist(ctx.user.id)),
  }),

  catalog: router({
    categories: publicProcedure.query(async () => db.listCategories()),
    config: publicProcedure.query(async () => db.getPlatformConfig()),
  }),

  packages: router({
    list: publicProcedure.query(async () => db.getPackageInventory()),
    functions: publicProcedure
      .input(z.object({ packageId: z.number().int().positive() }))
      .query(async ({ input }) => db.getPackageFunctions(input.packageId)),
  }),

  admin: router({
    stats: adminProcedure.query(async () => db.getAdminStats()),

    listUsers: adminProcedure
      .input(z.object({ role: z.string().optional(), kycStatus: z.string().optional(), limit: z.number().int().positive().max(200).optional() }).optional())
      .query(async ({ input }) => db.listUsers(input ?? {})),

    changeUserRole: adminProcedure
      .input(z.object({ targetUserId: z.number().int().positive(), role: z.string() }))
      .mutation(async ({ ctx, input }) => db.changeUserRole(ctx.user.id, input.targetUserId, input.role)),

    auditLog: adminProcedure
      .input(z.object({ limit: z.number().int().positive().max(200).optional() }).optional())
      .query(async ({ input }) => db.getAuditLog(input?.limit ?? 50)),

    setConfig: adminProcedure
      .input(z.object({ key: z.string().min(1), value: z.string(), dataType: z.string().optional() }))
      .mutation(async ({ ctx, input }) => db.setConfig(ctx.user.id, input.key, input.value, input.dataType)),

    packageInventory: adminProcedure.query(async () => db.getPackageInventory()),
  }),

  // ─── Registro en subasta ──────────────────────────────────────────────────
  auctionRegistrations: router({
    register: protectedProcedure
      .input(z.object({ auctionId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => db.registerForAuction(ctx.user.id, input.auctionId)),

    getMyRegistration: protectedProcedure
      .input(z.object({ auctionId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => db.getAuctionRegistration(ctx.user.id, input.auctionId)),

    listForAuction: adminProcedure
      .input(z.object({ auctionId: z.number().int().positive() }))
      .query(async ({ input }) => db.listAuctionRegistrations(input.auctionId)),
  }),

  // ─── Alertas de precio ────────────────────────────────────────────────────
  priceAlerts: router({
    set: protectedProcedure
      .input(z.object({ lotId: z.number().int().positive(), targetPrice: z.number().positive() }))
      .mutation(async ({ ctx, input }) => db.setPriceAlert(ctx.user.id, input.lotId, input.targetPrice)),

    delete: protectedProcedure
      .input(z.object({ alertId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => db.deletePriceAlert(ctx.user.id, input.alertId)),

    list: protectedProcedure.query(async ({ ctx }) => db.listPriceAlerts(ctx.user.id)),
  }),

  // ─── Confirmación de pago por comprador ───────────────────────────────────
  buyerOrders: router({
    confirmPayment: protectedProcedure
      .input(z.object({ orderId: z.number().int().positive(), paymentMethod: z.string().min(1), paymentReference: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => db.buyerConfirmPayment(ctx.user.id, input.orderId, input.paymentMethod, input.paymentReference)),
  }),

  // ─── Búsqueda full-text ───────────────────────────────────────────────────
  search: router({
    lots: publicProcedure
      .input(z.object({ query: z.string().min(1), categoryId: z.number().int().positive().optional(), status: z.string().optional(), limit: z.number().int().positive().max(50).optional(), offset: z.number().int().min(0).optional() }))
      .query(async ({ input }) => db.searchLots(input.query, { categoryId: input.categoryId, status: input.status, limit: input.limit, offset: input.offset })),
  }),

  // ─── Polling de estado de lote ────────────────────────────────────────────
  lotPolling: router({
    status: publicProcedure
      .input(z.object({ lotId: z.number().int().positive() }))
      .query(async ({ input }) => db.getLotStatus(input.lotId)),
  }),

  // ─── Historial de revisiones del experto ─────────────────────────────────
  expertReview: router({
    history: expertOrAdminProcedure
      .input(z.object({ lotId: z.number().int().positive() }))
      .query(async ({ input }) => db.getLotReviewHistory(input.lotId)),
  }),
});

export type AppRouter = typeof appRouter;
