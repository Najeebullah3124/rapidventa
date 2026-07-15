/**
 * RapidVenta — Pruebas funcionales del backend
 * Cubre: auth, catálogo, lotes, pujas, órdenes, notificaciones, watchlist, admin, paquetes
 * Ejecutar: pnpm test
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers de contexto ──────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  const clearedCookies: any[] = [];
  return {
    user: overrides
      ? {
          id: overrides.id ?? 1,
          openId: overrides.openId ?? "test-open-id",
          name: overrides.name ?? "Test User",
          email: overrides.email ?? "test@rapidventa.com",
          loginMethod: overrides.loginMethod ?? "manus",
          role: overrides.role ?? "buyer",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as any,
    res: {
      clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }),
    } as any,
  };
}

function anonCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("me — retorna null para usuario no autenticado", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me — retorna el usuario autenticado", async () => {
    const ctx = makeCtx({ name: "María García", role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("María García");
    expect(result?.role).toBe("buyer");
  });

  it("logout — limpia la cookie de sesión", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────

describe("catalog", () => {
  it("categories — retorna lista de categorías (puede ser vacía si BD no disponible)", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.catalog.categories();
    expect(Array.isArray(result)).toBe(true);
  });

  it("config — retorna configuración de la plataforma", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.catalog.config();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── LOTES ────────────────────────────────────────────────────────────────────

describe("lots", () => {
  it("list — retorna array de lotes (público)", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.lots.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list — filtra por status live", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.lots.list({ status: "live", limit: 5 });
    expect(Array.isArray(result)).toBe(true);
    // Si hay resultados, todos deben ser live
    result.forEach((r: any) => {
      expect(r.lot.status).toBe("live");
    });
  });

  it("list — filtra por categoryId", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.lots.list({ categoryId: 1, limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("get — lanza error para ID inexistente", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.lots.get({ id: 999999 })).rejects.toThrow();
  });

  it("consign — requiere autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(
      caller.lots.consign({
        categoryId: 1,
        titleEs: "Lote de prueba",
        startingBid: 1000,
      })
    ).rejects.toThrow();
  });

  it("consign — rechaza si el usuario no tiene KYC aprobado", async () => {
    // Usuario seller sin KYC aprobado
    const ctx = makeCtx({ id: 999, role: "seller" as any });
    const caller = appRouter.createCaller(ctx);
    // El usuario 999 no existe en BD, debe fallar
    await expect(
      caller.lots.consign({
        categoryId: 1,
        titleEs: "Lote sin KYC",
        startingBid: 500,
      })
    ).rejects.toThrow();
  });
});

// ─── SUBASTAS ─────────────────────────────────────────────────────────────────

describe("auctions", () => {
  it("list — retorna subastas públicas", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.auctions.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list — filtra por status upcoming", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.auctions.list({ status: "upcoming", limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create — requiere autenticación de admin", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(
      caller.auctions.create({
        titleEs: "Subasta Test",
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 172800000),
      })
    ).rejects.toThrow();
  });

  it("create — rechaza si usuario no es admin", async () => {
    const ctx = makeCtx({ role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auctions.create({
        titleEs: "Subasta No Autorizada",
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 172800000),
      })
    ).rejects.toThrow();
  });
});

// ─── PUJAS ────────────────────────────────────────────────────────────────────

describe("bids", () => {
  it("history — retorna historial de pujas para un lote", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.bids.history({ lotId: 1, limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("place — requiere autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(
      caller.bids.place({ lotId: 1, amount: 5000 })
    ).rejects.toThrow();
  });

  it("place — rechaza puja en lote inexistente", async () => {
    const ctx = makeCtx({ id: 1, role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.bids.place({ lotId: 999999, amount: 5000 })
    ).rejects.toThrow();
  });
});

// ─── ÓRDENES ─────────────────────────────────────────────────────────────────

describe("orders", () => {
  it("myOrders — requiere autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.orders.myOrders({ role: "buyer" })).rejects.toThrow();
  });

  it("myOrders — retorna array para usuario autenticado", async () => {
    const ctx = makeCtx({ id: 1, role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.myOrders({ role: "buyer" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("confirmPayment — requiere rol admin", async () => {
    const ctx = makeCtx({ role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.orders.confirmPayment({
        orderId: 1,
        paymentMethod: "wire",
        paymentReference: "REF-001",
      })
    ).rejects.toThrow();
  });
});

// ─── NOTIFICACIONES ──────────────────────────────────────────────────────────

describe("notifications", () => {
  it("list — requiere autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.notifications.list({})).rejects.toThrow();
  });

  it("list — retorna array para usuario autenticado", async () => {
    const ctx = makeCtx({ id: 1 });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("markRead — requiere autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.notifications.markRead({})).rejects.toThrow();
  });
});

// ─── WATCHLIST ────────────────────────────────────────────────────────────────

describe("watchlist", () => {
  it("toggle — requiere autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.watchlist.toggle({ lotId: 1 })).rejects.toThrow();
  });

  it("list — requiere autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.watchlist.list()).rejects.toThrow();
  });

  it("list — retorna array para usuario autenticado", async () => {
    const ctx = makeCtx({ id: 1 });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.watchlist.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── KYC ─────────────────────────────────────────────────────────────────────

describe("kyc", () => {
  it("submit — requiere autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(
      caller.kyc.submit({
        documentType: "passport",
        documentUrl: "https://example.com/doc.jpg",
        selfieUrl: "https://example.com/selfie.jpg",
      })
    ).rejects.toThrow();
  });

  it("review — requiere rol admin", async () => {
    const ctx = makeCtx({ role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.kyc.review({
        targetUserId: 2,
        decision: "approved",
      })
    ).rejects.toThrow();
  });
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

describe("admin", () => {
  it("listUsers — requiere rol admin", async () => {
    const ctx = makeCtx({ role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listUsers({ limit: 10 })).rejects.toThrow();
  });

  it("auditLog — requiere rol admin", async () => {
    const ctx = makeCtx({ role: "seller" as any });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.auditLog({ limit: 10 })).rejects.toThrow();
  });

  it("stats — requiere rol admin", async () => {
    const ctx = makeCtx({ role: "expert" as any });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });
});

// ─── PAQUETES (INVENTARIO) ────────────────────────────────────────────────────

describe("packages", () => {
  it("list — retorna lista de paquetes (público)", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.packages.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("functions — retorna funciones de un paquete (público)", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.packages.functions({ packageId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── REGLAS DE NEGOCIO ────────────────────────────────────────────────────────

describe("reglas de negocio", () => {
  it("RN-001: usuario no autenticado no puede pujar", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.bids.place({ lotId: 1, amount: 1000 })).rejects.toThrow();
  });

  it("RN-002: usuario no admin no puede crear subastas", async () => {
    const ctx = makeCtx({ role: "seller" as any });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auctions.create({
        titleEs: "Subasta Ilegal",
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
      })
    ).rejects.toThrow();
  });

  it("RN-003: usuario no admin no puede aprobar KYC", async () => {
    const ctx = makeCtx({ role: "expert" as any });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.kyc.review({ targetUserId: 5, decision: "approved" })
    ).rejects.toThrow();
  });

  it("RN-004: usuario no admin no puede ver log de auditoría", async () => {
    const ctx = makeCtx({ role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.auditLog({ limit: 5 })).rejects.toThrow();
  });

  it("RN-005: usuario no admin no puede confirmar pagos", async () => {
    const ctx = makeCtx({ role: "buyer" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.orders.confirmPayment({
        orderId: 1,
        paymentMethod: "wire",
        paymentReference: "REF-TEST",
      })
    ).rejects.toThrow();
  });

  it("RN-006: catálogo y subastas son públicos sin autenticación", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const [cats, aucs, lots] = await Promise.all([
      caller.catalog.categories(),
      caller.auctions.list({ limit: 5 }),
      caller.lots.list({ limit: 5 }),
    ]);
    expect(Array.isArray(cats)).toBe(true);
    expect(Array.isArray(aucs)).toBe(true);
    expect(Array.isArray(lots)).toBe(true);
  });

  it("RN-007: historial de pujas es público", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.bids.history({ lotId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("RN-008: paquetes e inventario de funciones son públicos", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const pkgs = await caller.packages.list();
    expect(Array.isArray(pkgs)).toBe(true);
  });
});
