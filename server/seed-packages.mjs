/**
 * Seed: Inventario de Paquetes y Funciones de Negocio — RapidVenta
 * Ejecutar: node server/seed-packages.mjs
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  packages,
  packageFunctions,
  categories,
  platformConfig,
} from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ─── Paquetes ───────────────────────────────────────────────────────────────
const packageDefs = [
  { code: "PKG_AUTH",      name: "Autenticación y KYC",           description: "Gestión de usuarios, login OAuth, verificación de identidad (KYC) y control de acceso por rol." },
  { code: "PKG_AUCTION",   name: "Gestión de Subastas",            description: "Creación, configuración y ciclo de vida de subastas (draft → upcoming → live → ended)." },
  { code: "PKG_LOT",       name: "Gestión de Lotes",               description: "Consignación, revisión experta, aprobación/rechazo y asignación de lotes a subastas." },
  { code: "PKG_BID",       name: "Motor de Pujas",                 description: "Colocación de pujas, validación de reglas de negocio, anti-sniping, auto-bid y cierre de lote." },
  { code: "PKG_ORDER",     name: "Órdenes y Pagos",                description: "Creación de órdenes, cálculo de buyer premium + IVA + comisión vendedor, confirmación de pago." },
  { code: "PKG_NOTIFY",    name: "Notificaciones",                 description: "Creación y gestión de notificaciones internas por evento de negocio." },
  { code: "PKG_ADMIN",     name: "Administración y Configuración", description: "KPIs del dashboard, configuración de plataforma, gestión de roles, auditoría e inventario de paquetes." },
  { code: "PKG_WATCHLIST", name: "Lista de Favoritos",             description: "Gestión de lotes favoritos por usuario con alertas de puja." },
];

const functionDefs = {
  PKG_AUTH: [
    { code: "FN_AUTH_UPSERT_USER",  name: "Crear/Actualizar Usuario",            businessRule: "Crea o actualiza un usuario tras OAuth callback. El primer usuario con openId del owner recibe rol admin automáticamente.", inputSchema: '{"openId":"string","name":"string?","email":"string?"}', outputSchema: '{"id":"number","role":"string"}' },
    { code: "FN_AUTH_SUBMIT_KYC",   name: "Enviar Documentos KYC",               businessRule: "Solo permitido si kycStatus es pending o rejected. Genera notificación de confirmación.", inputSchema: '{"userId":"number","documentType":"string","documentUrl":"string","selfieUrl":"string"}', outputSchema: '{"success":"boolean"}' },
    { code: "FN_AUTH_REVIEW_KYC",   name: "Revisar KYC (Admin)",                 businessRule: "Solo admin puede aprobar/rechazar KYC. El lote debe estar en estado submitted.", inputSchema: '{"adminId":"number","targetUserId":"number","decision":"approved|rejected"}', outputSchema: '{"success":"boolean"}' },
  ],
  PKG_AUCTION: [
    { code: "FN_AUCTION_CREATE",        name: "Crear Subasta",             businessRule: "Solo admin. endTime > startTime. Genera código único SUB-YYYY-MM-XXXX.", inputSchema: '{"adminId":"number","titleEs":"string","startTime":"Date","endTime":"Date"}', outputSchema: '{"success":"boolean","code":"string","id":"number"}' },
    { code: "FN_AUCTION_CHANGE_STATUS", name: "Cambiar Estado de Subasta", businessRule: "Transiciones: draft→upcoming, upcoming→live, live→ended. Al terminar, lotes live pasan a unsold.", inputSchema: '{"adminId":"number","auctionId":"number","newStatus":"string"}', outputSchema: '{"success":"boolean"}' },
    { code: "FN_AUCTION_LIST",          name: "Listar Subastas",           businessRule: "Lista pública de subastas con filtro por status.", inputSchema: '{"status":"string?","limit":"number?"}', outputSchema: '{"auctions":"Auction[]"}' },
  ],
  PKG_LOT: [
    { code: "FN_LOT_CONSIGN",        name: "Consignar Lote",             businessRule: "Vendedor debe tener KYC aprobado y rol seller. Genera número RV-YYYY-NNN. Estado inicial: pending_review.", inputSchema: '{"sellerId":"number","categoryId":"number","titleEs":"string","startingBid":"number"}', outputSchema: '{"success":"boolean","lotNumber":"string"}' },
    { code: "FN_LOT_REVIEW",         name: "Revisar Lote (Experto)",     businessRule: "Solo expertos o admins. Lote debe estar en pending_review o in_review. Aprobación certifica el lote.", inputSchema: '{"expertId":"number","lotId":"number","decision":"approved|rejected"}', outputSchema: '{"success":"boolean"}' },
    { code: "FN_LOT_ASSIGN_AUCTION", name: "Asignar Lote a Subasta",     businessRule: "Solo lotes aprobados. La subasta no puede estar ended o cancelled.", inputSchema: '{"adminId":"number","lotId":"number","auctionId":"number"}', outputSchema: '{"success":"boolean"}' },
    { code: "FN_LOT_LIST",           name: "Listar Lotes",               businessRule: "Filtros: status, categoryId, auctionId, sellerId, isFeatured.", inputSchema: '{"status":"string?","categoryId":"number?"}', outputSchema: '{"lots":"Lot[]"}' },
    { code: "FN_LOT_GET",            name: "Obtener Lote",               businessRule: "Obtiene detalle e incrementa viewCount.", inputSchema: '{"lotId":"number"}', outputSchema: '{"lot":"Lot"}' },
  ],
  PKG_BID: [
    { code: "FN_BID_PLACE",     name: "Colocar Puja",                    businessRule: "KYC aprobado. Lote live. Monto >= currentBid + bidIncrement. Vendedor no puede pujar en su lote. Notifica al pujador anterior.", inputSchema: '{"bidderId":"number","lotId":"number","amount":"number"}', outputSchema: '{"success":"boolean","bidId":"number"}' },
    { code: "FN_BID_CLOSE_LOT", name: "Cerrar Lote (Determinar Ganador)", businessRule: "Solo admin. Verifica reserve price. Sin pujas → unsold. Puja < reserve → unsold. Ganador → sold + crea orden.", inputSchema: '{"adminId":"number","lotId":"number"}', outputSchema: '{"success":"boolean","sold":"boolean"}' },
    { code: "FN_BID_HISTORY",   name: "Historial de Pujas",              businessRule: "Lista pública del historial de pujas.", inputSchema: '{"lotId":"number","limit":"number?"}', outputSchema: '{"bids":"BidHistory[]"}' },
  ],
  PKG_ORDER: [
    { code: "FN_ORDER_CREATE",          name: "Crear Orden",            businessRule: "Calcula buyer premium, IVA y comisión del vendedor. Genera ORD-YYYY-NNNNN. Plazo de pago: 5 días.", inputSchema: '{"lotId":"number","buyerId":"number","sellerId":"number","hammerPrice":"number"}', outputSchema: '{"orderNumber":"string","totalAmount":"number"}' },
    { code: "FN_ORDER_CONFIRM_PAYMENT", name: "Confirmar Pago (Admin)", businessRule: "Solo admin. Orden debe estar en pending_payment o payment_processing.", inputSchema: '{"adminId":"number","orderId":"number","paymentMethod":"string","paymentReference":"string"}', outputSchema: '{"success":"boolean"}' },
    { code: "FN_ORDER_LIST",            name: "Listar Órdenes",         businessRule: "Lista órdenes por rol del usuario (buyer o seller).", inputSchema: '{"userId":"number","role":"buyer|seller"}', outputSchema: '{"orders":"Order[]"}' },
  ],
  PKG_NOTIFY: [
    { code: "FN_NOTIFY_CREATE",    name: "Crear Notificación",    businessRule: "Crea notificación interna. Llamada internamente por otros paquetes.", inputSchema: '{"userId":"number","type":"string","title":"string","message":"string"}', outputSchema: '{"void":"void"}' },
    { code: "FN_NOTIFY_LIST",      name: "Listar Notificaciones", businessRule: "Lista notificaciones del usuario. Soporta filtro unreadOnly.", inputSchema: '{"userId":"number","unreadOnly":"boolean?"}', outputSchema: '{"notifications":"Notification[]"}' },
    { code: "FN_NOTIFY_MARK_READ", name: "Marcar como Leídas",    businessRule: "Marca notificaciones como leídas. Sin IDs → marca todas.", inputSchema: '{"userId":"number","notificationIds":"number[]?"}', outputSchema: '{"success":"boolean"}' },
  ],
  PKG_ADMIN: [
    { code: "FN_ADMIN_GET_STATS",         name: "Obtener KPIs del Dashboard",  businessRule: "Solo admin. Retorna totalUsers, totalLots, activeLots, totalBids, totalOrders, GMV, pendingKyc, pendingLots.", inputSchema: '{"adminId":"number"}', outputSchema: '{"totalUsers":"number","gmv":"number"}' },
    { code: "FN_ADMIN_SET_CONFIG",        name: "Configurar Parámetro",        businessRule: "Solo admin. Upsert en platform_config. Registra en audit_log.", inputSchema: '{"adminId":"number","key":"string","value":"string"}', outputSchema: '{"success":"boolean"}' },
    { code: "FN_ADMIN_CHANGE_USER_ROLE",  name: "Cambiar Rol de Usuario",      businessRule: "Solo admin. Registra cambio en audit_log.", inputSchema: '{"adminId":"number","targetUserId":"number","newRole":"string"}', outputSchema: '{"success":"boolean"}' },
    { code: "FN_ADMIN_LIST_USERS",        name: "Listar Usuarios",             businessRule: "Solo admin. Filtros por rol y kycStatus.", inputSchema: '{"adminId":"number","role":"string?"}', outputSchema: '{"users":"User[]"}' },
    { code: "FN_ADMIN_AUDIT_LOG",         name: "Ver Log de Auditoría",        businessRule: "Solo admin. Retorna log de auditoría con nombre de usuario.", inputSchema: '{"adminId":"number"}', outputSchema: '{"entries":"AuditEntry[]"}' },
    { code: "FN_ADMIN_PACKAGE_INVENTORY", name: "Inventario de Paquetes",      businessRule: "Solo admin. Lista todos los paquetes y sus funciones registradas.", inputSchema: '{"adminId":"number"}', outputSchema: '{"packages":"PackageWithFunctions[]"}' },
  ],
  PKG_WATCHLIST: [
    { code: "FN_WATCHLIST_TOGGLE", name: "Agregar/Quitar Favorito", businessRule: "Toggle: si existe lo quita, si no existe lo agrega. Actualiza watchCount del lote.", inputSchema: '{"userId":"number","lotId":"number"}', outputSchema: '{"action":"added|removed"}' },
    { code: "FN_WATCHLIST_LIST",   name: "Listar Favoritos",        businessRule: "Lista los lotes favoritos del usuario con datos del lote.", inputSchema: '{"userId":"number"}', outputSchema: '{"items":"WatchlistItem[]"}' },
  ],
};

console.log("🌱 Sembrando inventario de paquetes y funciones...\n");

for (const pkg of packageDefs) {
  await db.insert(packages).values({
    code: pkg.code,
    name: pkg.name,
    description: pkg.description,
    version: "1.0.0",
    isActive: true,
  }).onDuplicateKeyUpdate({
    set: { name: pkg.name, description: pkg.description },
  });
  console.log(`  ✓ Paquete: ${pkg.code}`);

  const [pkgRow] = await db.select({ id: packages.id }).from(packages).where(eq(packages.code, pkg.code)).limit(1);
  const packageId = pkgRow.id;

  const fns = functionDefs[pkg.code] ?? [];
  for (const fn of fns) {
    await db.insert(packageFunctions).values({
      packageId,
      code: fn.code,
      name: fn.name,
      description: fn.businessRule,
      businessRule: fn.businessRule,
      inputSchema: fn.inputSchema,
      outputSchema: fn.outputSchema,
      isActive: true,
    }).onDuplicateKeyUpdate({
      set: { name: fn.name, businessRule: fn.businessRule, inputSchema: fn.inputSchema, outputSchema: fn.outputSchema },
    });
    console.log(`    ↳ ${fn.code}`);
  }
}

// ─── Seed de categorías ──────────────────────────────────────────────────────
console.log("\n🌱 Sembrando categorías...");
const cats = [
  { slug: "relojes",        nameEs: "Relojes",       nameEn: "Watches",      sortOrder: 1 },
  { slug: "arte",           nameEs: "Arte",           nameEn: "Art",          sortOrder: 2 },
  { slug: "deportes",       nameEs: "Deportes",       nameEn: "Sports",       sortOrder: 3 },
  { slug: "coleccionables", nameEs: "Coleccionables", nameEn: "Collectibles", sortOrder: 4 },
  { slug: "joyeria",        nameEs: "Joyería",        nameEn: "Jewelry",      sortOrder: 5 },
  { slug: "automoviles",    nameEs: "Automóviles",    nameEn: "Automobiles",  sortOrder: 6 },
];
for (const cat of cats) {
  await db.insert(categories).values({
    slug: cat.slug,
    nameEs: cat.nameEs,
    nameEn: cat.nameEn,
    isActive: true,
    sortOrder: cat.sortOrder,
  }).onDuplicateKeyUpdate({
    set: { nameEs: cat.nameEs, nameEn: cat.nameEn },
  });
  console.log(`  ✓ ${cat.nameEs}`);
}

// ─── Seed de configuración de plataforma ────────────────────────────────────
console.log("\n🌱 Sembrando configuración de plataforma...");
const configs = [
  { key: "buyer_premium_pct",     value: "20",   dataType: "number",  description: "Porcentaje de buyer premium por defecto" },
  { key: "vat_pct",               value: "16",   dataType: "number",  description: "Porcentaje de IVA por defecto" },
  { key: "seller_commission_pct", value: "15",   dataType: "number",  description: "Comisión de la plataforma al vendedor" },
  { key: "anti_sniping_minutes",  value: "3",    dataType: "number",  description: "Minutos de extensión anti-sniping" },
  { key: "payment_due_days",      value: "5",    dataType: "number",  description: "Días para pagar después de ganar" },
  { key: "min_bid_increment",     value: "100",  dataType: "number",  description: "Incremento mínimo de puja en USD" },
  { key: "platform_currency",     value: "USD",  dataType: "string",  description: "Moneda base de la plataforma" },
  { key: "kyc_required",          value: "true", dataType: "boolean", description: "Requiere KYC para pujar" },
];
for (const cfg of configs) {
  await db.insert(platformConfig).values({
    key: cfg.key,
    value: cfg.value,
    dataType: cfg.dataType,
    description: cfg.description,
  }).onDuplicateKeyUpdate({
    set: { value: cfg.value, description: cfg.description },
  });
  console.log(`  ✓ ${cfg.key} = ${cfg.value}`);
}

console.log("\n✅ Seed completado exitosamente.");
await connection.end();
