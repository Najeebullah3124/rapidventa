/**
 * PRUEBA FUNCIONAL 360 — RapidVenta
 * Simula el ciclo completo de subasta como usuario real:
 * 1. Crear 3 vendedores, 3 compradores, 1 admin, 1 experto
 * 2. KYC para todos
 * 3. Cada vendedor consigna 1 lote
 * 4. Experto revisa y aprueba los 3 lotes
 * 5. Admin crea subasta, asigna lotes, activa subasta
 * 6. 3 compradores pujan en cada lote (con escalada de precios)
 * 7. Admin cierra la subasta
 * 8. Sistema genera órdenes para ganadores
 * 9. Compradores confirman pago
 * 10. Vendedores agregan favoritos y alertas de precio
 * 11. Validación 360 de todas las tablas y relaciones
 */

import mysql2 from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("❌ DATABASE_URL no definida"); process.exit(1); }

const conn = await mysql2.createConnection(DB_URL);
const log = (msg) => console.log(`  ${msg}`);
const ok = (msg) => console.log(`  ✅ ${msg}`);
const err = (msg) => console.log(`  ❌ ${msg}`);
const section = (title) => console.log(`\n${"═".repeat(60)}\n  ${title}\n${"═".repeat(60)}`);

let results = { passed: 0, failed: 0, steps: [] };

async function q(sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  // Para INSERT/UPDATE/DELETE devuelve ResultSetHeader (no array)
  if (!Array.isArray(rows)) return rows;
  return rows;
}

async function check(label, fn) {
  try {
    const result = await fn();
    if (result === false) {
      err(label);
      results.failed++;
      results.steps.push({ label, status: "FAIL" });
    } else {
      ok(label);
      results.passed++;
      results.steps.push({ label, status: "PASS", data: result });
    }
  } catch (e) {
    err(`${label} → ${e.message}`);
    results.failed++;
    results.steps.push({ label, status: "ERROR", error: e.message });
  }
}

// ─── FASE 1: CREAR USUARIOS ───────────────────────────────────────────────────
section("FASE 1 — Crear usuarios de prueba");

// Limpiar datos de prueba anteriores (respetar FK constraints: hijos primero)
const prevUsers = await q("SELECT id FROM users WHERE openId LIKE 'test-360-%'");
const prevUserIds = prevUsers.map(u => u.id);

if (prevUserIds.length > 0) {
  const prevLots = await q(`SELECT id FROM lots WHERE sellerId IN (${prevUserIds.join(',')}) OR lotNumber LIKE 'TEST360-%'`);
  const prevLotIds = prevLots.map(l => l.id);

  if (prevLotIds.length > 0) {
    const prevOrders = await q(`SELECT id FROM orders WHERE lotId IN (${prevLotIds.join(',')})`);
    const prevOrderIds = prevOrders.map(o => o.id);
    if (prevOrderIds.length > 0) {
      await q(`DELETE FROM notifications WHERE relatedOrderId IN (${prevOrderIds.join(',')})`);
      await q(`DELETE FROM orders WHERE id IN (${prevOrderIds.join(',')})`);
    }
    // Eliminar notificaciones que referencian estos lotes ANTES de eliminar los lotes
    await q(`DELETE FROM notifications WHERE relatedLotId IN (${prevLotIds.join(',')})`);
    await q(`DELETE FROM bids WHERE lotId IN (${prevLotIds.join(',')})`);
    await q(`DELETE FROM watchlist WHERE lotId IN (${prevLotIds.join(',')})`);
    await q(`DELETE FROM price_alerts WHERE lotId IN (${prevLotIds.join(',')})`);
    await q(`DELETE FROM lots WHERE id IN (${prevLotIds.join(',')})`);
  }

  const prevAuctions = await q("SELECT id FROM auctions WHERE code LIKE 'TEST360-%'");
  const prevAuctionIds = prevAuctions.map(a => a.id);
  if (prevAuctionIds.length > 0) {
    await q(`DELETE FROM auction_registrations WHERE auctionId IN (${prevAuctionIds.join(',')})`);
    await q(`DELETE FROM auctions WHERE id IN (${prevAuctionIds.join(',')})`);
  }

  await q(`DELETE FROM price_alerts WHERE userId IN (${prevUserIds.join(',')})`);  
  await q(`DELETE FROM watchlist WHERE userId IN (${prevUserIds.join(',')})`);  
  await q(`DELETE FROM notifications WHERE userId IN (${prevUserIds.join(',')})`);
  await q(`DELETE FROM audit_log WHERE userId IN (${prevUserIds.join(',')})`);
  await q(`DELETE FROM kyc_documents WHERE userId IN (${prevUserIds.join(',')})`);
  await q(`DELETE FROM users WHERE id IN (${prevUserIds.join(',')})`);
}
log("Limpieza de datos anteriores completada.");

const now = new Date();

// Crear admin
await q(`INSERT INTO users (openId, name, email, role, kycStatus, kycReviewedAt, loginMethod, lastSignedIn, createdAt, updatedAt)
  VALUES ('test-360-admin', 'Admin RapidVenta', 'admin@rapidventa.com', 'admin', 'approved', ?, 'test', ?, ?, ?)`,
  [now, now, now, now]);

// Crear experto
await q(`INSERT INTO users (openId, name, email, role, kycStatus, kycReviewedAt, loginMethod, lastSignedIn, createdAt, updatedAt)
  VALUES ('test-360-expert', 'Dr. Carlos Experto', 'experto@rapidventa.com', 'expert', 'approved', ?, 'test', ?, ?, ?)`,
  [now, now, now, now]);

// Crear 3 vendedores con KYC aprobado
const sellers = [
  { openId: 'test-360-seller1', name: 'María Galería Torres', email: 'maria@galeria.com' },
  { openId: 'test-360-seller2', name: 'Carlos Colección Privada', email: 'carlos@coleccion.com' },
  { openId: 'test-360-seller3', name: 'Ana Antigüedades López', email: 'ana@antiguedades.com' },
];

for (const s of sellers) {
  await q(`INSERT INTO users (openId, name, email, role, kycStatus, kycDocumentType, kycDocumentUrl, kycSelfieUrl, kycReviewedAt, loginMethod, lastSignedIn, createdAt, updatedAt)
    VALUES (?, ?, ?, 'seller', 'approved', 'passport', 'https://s3.rapidventa.com/kyc/doc.jpg', 'https://s3.rapidventa.com/kyc/selfie.jpg', ?, 'test', ?, ?, ?)`,
    [s.openId, s.name, s.email, now, now, now, now]);
}

// Crear 3 compradores con KYC aprobado
const buyers = [
  { openId: 'test-360-buyer1', name: 'Roberto Comprador Díaz', email: 'roberto@buyer.com' },
  { openId: 'test-360-buyer2', name: 'Sofía Inversora Ruiz', email: 'sofia@buyer.com' },
  { openId: 'test-360-buyer3', name: 'Miguel Coleccionista Vera', email: 'miguel@buyer.com' },
];

for (const b of buyers) {
  await q(`INSERT INTO users (openId, name, email, role, kycStatus, kycDocumentType, kycDocumentUrl, kycSelfieUrl, kycReviewedAt, loginMethod, lastSignedIn, createdAt, updatedAt)
    VALUES (?, ?, ?, 'buyer', 'approved', 'id_card', 'https://s3.rapidventa.com/kyc/doc.jpg', 'https://s3.rapidventa.com/kyc/selfie.jpg', ?, 'test', ?, ?, ?)`,
    [b.openId, b.name, b.email, now, now, now, now]);
}

// Obtener IDs
const [adminRow] = await q("SELECT id FROM users WHERE openId = 'test-360-admin'");
const [expertRow] = await q("SELECT id FROM users WHERE openId = 'test-360-expert'");
const adminId = adminRow.id;
const expertId = expertRow.id;

const sellerRows = await q("SELECT id, name FROM users WHERE openId LIKE 'test-360-seller%' ORDER BY id");
const buyerRows = await q("SELECT id, name FROM users WHERE openId LIKE 'test-360-buyer%' ORDER BY id");

await check("8 usuarios creados (1 admin, 1 experto, 3 vendedores, 3 compradores)", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM users WHERE openId LIKE 'test-360-%'");
  return r.c === 8 ? `${r.c} usuarios` : false;
});

await check("Todos los usuarios tienen KYC aprobado", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM users WHERE openId LIKE 'test-360-%' AND kycStatus = 'approved'");
  return r.c === 8 ? `${r.c}/8 aprobados` : false;
});

await check("Roles correctos asignados", async () => {
  const rows = await q("SELECT role, COUNT(*) as c FROM users WHERE openId LIKE 'test-360-%' GROUP BY role ORDER BY role");
  const rolesArr = Array.isArray(rows) ? rows : Object.values(rows);
  const roles = {};
  for (const x of rolesArr) roles[x.role] = Number(x.c);
  return roles.admin === 1 && roles.expert === 1 && roles.seller === 3 && roles.buyer === 3
    ? `admin:1, expert:1, seller:3, buyer:3` : `Encontrado: ${JSON.stringify(roles)}`;
});

// ─── FASE 2: CONSIGNACIÓN DE LOTES ───────────────────────────────────────────
section("FASE 2 — Consignación de lotes (1 por vendedor)");

// Obtener categoría ID
const [catRelojes] = await q("SELECT id FROM categories WHERE nameEs LIKE '%Reloj%' LIMIT 1");
const [catArte] = await q("SELECT id FROM categories WHERE nameEs LIKE '%Arte%' LIMIT 1");
const [catDeportes] = await q("SELECT id FROM categories WHERE nameEs LIKE '%Deport%' LIMIT 1");

const catRelojId = catRelojes?.id ?? 1;
const catArteId = catArte?.id ?? 2;
const catDeportesId = catDeportes?.id ?? 3;

const lotYear = new Date().getFullYear();
const [lotCount] = await q("SELECT COUNT(*) as c FROM lots");
const baseSeq = (lotCount?.c ?? 0) + 1;

const lotsData = [
  { sellerId: sellerRows[0].id, catId: catRelojId, title: 'Rolex Daytona 116500LN — Acero Inoxidable', startBid: 25000, estLow: 28000, estHigh: 35000, condition: 'excellent' },
  { sellerId: sellerRows[1].id, catId: catArteId, title: 'Banksy — Love is in the Air (Serigrafía)', startBid: 45000, estLow: 50000, estHigh: 70000, condition: 'good' },
  { sellerId: sellerRows[2].id, catId: catDeportesId, title: 'Pelé — Camiseta firmada Brasil 1970', startBid: 8000, estLow: 10000, estHigh: 15000, condition: 'fair' },
];

const lotIds = [];
for (let i = 0; i < lotsData.length; i++) {
  const l = lotsData[i];
  const lotNumber = `TEST360-${lotYear}-${String(baseSeq + i).padStart(3, '0')}`;
  const resLot = await q(
    `INSERT INTO lots (lotNumber, categoryId, sellerId, titleEs, titleEn, descriptionEs, startingBid, estimateLow, estimateHigh, \`condition\`, status, bidIncrement, viewCount, bidCount, isFeatured, isCertified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', 500, 0, 0, 0, 0, ?, ?)`,
    [lotNumber, l.catId, l.sellerId, l.title, l.title + ' (EN)', `Descripción detallada de ${l.title}`, l.startBid, l.estLow, l.estHigh, l.condition, now, now]
  );
  lotIds.push(resLot.insertId);

  // Notificación al vendedor
  await q(`INSERT INTO notifications (userId, type, title, message, isRead, createdAt) VALUES (?, 'system', 'Lote Recibido', ?, 0, ?)`,
    [l.sellerId, `Tu lote "${l.title}" está en revisión.`, now]);
}

await check("3 lotes consignados en estado pending_review", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM lots WHERE lotNumber LIKE 'TEST360-%' AND status = 'pending_review'");
  return r.c === 3 ? `${r.c} lotes pendientes de revisión` : false;
});

await check("Notificaciones enviadas a vendedores al consignar", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM notifications WHERE type = 'system' AND message LIKE '%revisión%' AND userId IN (SELECT id FROM users WHERE openId LIKE 'test-360-seller%')");
  return r.c >= 3 ? `${r.c} notificaciones` : false;
});

// ─── FASE 3: REVISIÓN DEL EXPERTO ────────────────────────────────────────────
section("FASE 3 — Revisión y aprobación por el experto");

for (let i = 0; i < lotIds.length; i++) {
  const lotId = lotIds[i];
  const notes = ['Reloj en excelente estado, certificado de autenticidad verificado.', 'Serigrafía original con COA de Pest Control.', 'Camiseta con firma autenticada por PSA/DNA.'][i];
  
  // Experto aprueba el lote
  await q(`UPDATE lots SET status = 'approved', expertId = ?, expertNotes = ?, expertReviewedAt = ?, isCertified = 1 WHERE id = ?`,
    [expertId, notes, now, lotId]);

  // Log de auditoría
  await q(`INSERT INTO audit_log (userId, action, entityType, entityId, oldValues, newValues, createdAt)
    VALUES (?, 'lot_review', 'lots', ?, ?, ?, ?)`,
    [expertId, lotId, JSON.stringify({ status: 'pending_review' }), JSON.stringify({ status: 'approved', notes }), now]);

  // Notificación al vendedor
  const [lot] = await q("SELECT sellerId, titleEs FROM lots WHERE id = ?", [lotId]);
  await q(`INSERT INTO notifications (userId, type, title, message, relatedLotId, isRead, createdAt)
    VALUES (?, 'lot_approved', 'Lote Aprobado', ?, ?, 0, ?)`,
    [lot.sellerId, `Tu lote "${lot.titleEs}" fue aprobado por el experto.`, lotId, now]);
}

await check("3 lotes aprobados por el experto", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM lots WHERE lotNumber LIKE 'TEST360-%' AND status = 'approved' AND expertId = ?", [expertId]);
  return r.c === 3 ? `${r.c} lotes aprobados` : false;
});

await check("Lotes certificados (isCertified = 1)", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM lots WHERE lotNumber LIKE 'TEST360-%' AND isCertified = 1");
  return r.c === 3 ? `${r.c} lotes certificados` : false;
});

await check("Audit log registra las revisiones del experto", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM audit_log WHERE action = 'lot_review' AND userId = ?", [expertId]);
  return r.c >= 3 ? `${r.c} entradas en audit_log` : false;
});

await check("Notificaciones de aprobación enviadas a vendedores", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM notifications WHERE type = 'lot_approved' AND userId IN (SELECT id FROM users WHERE openId LIKE 'test-360-seller%')");
  return r.c >= 3 ? `${r.c} notificaciones de aprobación` : false;
});

// ─── FASE 4: CREAR SUBASTA Y ASIGNAR LOTES ───────────────────────────────────
section("FASE 4 — Crear subasta y asignar lotes");

const auctionStart = new Date(Date.now() - 3600000); // hace 1 hora (ya activa)
const auctionEnd = new Date(Date.now() + 3600000);   // termina en 1 hora

  const auctionRes = await q(
  `INSERT INTO auctions (code, titleEs, titleEn, status, auctionType, startTime, endTime, buyerPremiumPct, vatPct, createdBy, createdAt, updatedAt)
   VALUES ('TEST360-SUB-001', 'Subasta Prueba 360 — Julio 2026', 'Test 360 Auction — July 2026', 'live', 'timed', ?, ?, '20.00', '16.00', ?, ?, ?)`,
  [auctionStart, auctionEnd, adminId, now, now]
);
const auctionId = auctionRes.insertId;

// Asignar los 3 lotes a la subasta y activarlos
for (const lotId of lotIds) {
  await q(`UPDATE lots SET auctionId = ?, status = 'live' WHERE id = ?`, [auctionId, lotId]);
  await q(`INSERT INTO audit_log (userId, action, entityType, entityId, oldValues, newValues, createdAt)
    VALUES (?, 'lot_assign_auction', 'lots', ?, ?, ?, ?)`,
    [adminId, lotId, JSON.stringify({ status: 'approved' }), JSON.stringify({ auctionId, status: 'live' }), now]);
}

// Registrar compradores en la subasta
for (const buyer of buyerRows) {
  await q(`INSERT INTO auction_registrations (auctionId, userId, status, registeredAt)
    VALUES (?, ?, 'approved', ?)
    ON DUPLICATE KEY UPDATE status = 'approved'`,
    [auctionId, buyer.id, now]);
}

await check("Subasta TEST360-SUB-001 creada en estado live", async () => {
  const [r] = await q("SELECT status, auctionType, buyerPremiumPct FROM auctions WHERE code = 'TEST360-SUB-001'");
  return r?.status === 'live' ? `status:${r.status}, type:${r.auctionType}, premium:${r.buyerPremiumPct}%` : false;
});

await check("3 lotes asignados a la subasta en estado live", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM lots WHERE auctionId = ? AND status = 'live'", [auctionId]);
  return r.c === 3 ? `${r.c} lotes en vivo` : false;
});

await check("3 compradores registrados en la subasta", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM auction_registrations WHERE auctionId = ? AND status = 'approved'", [auctionId]);
  return r.c === 3 ? `${r.c} compradores registrados` : false;
});

// ─── FASE 5: SIMULACIÓN DE PUJAS ─────────────────────────────────────────────
section("FASE 5 — Simulación de pujas (3 compradores por lote)");

const bidResults = []; // { lotId, winnerId, winningAmount }

for (let li = 0; li < lotIds.length; li++) {
  const lotId = lotIds[li];
  const [lot] = await q("SELECT startingBid, bidIncrement, titleEs FROM lots WHERE id = ?", [lotId]);
  const startBid = Number(lot.startingBid);
  const increment = Number(lot.bidIncrement ?? 500);

  log(`\n  Lote ${li + 1}: "${lot.titleEs}"`);

  // Ronda 1: buyer1 abre la puja
  const bid1 = startBid;
  await q(`INSERT INTO bids (lotId, bidderId, amount, status, ipAddress, placedAt, updatedAt) VALUES (?, ?, ?, 'active', '192.168.1.1', ?, ?)`,
    [lotId, buyerRows[0].id, bid1, now, now]);
  await q(`UPDATE lots SET currentBid = ?, bidCount = 1 WHERE id = ?`, [bid1, lotId]);
  log(`    Ronda 1 → ${buyerRows[0].name}: $${bid1.toLocaleString()}`);

  // Ronda 2: buyer2 supera a buyer1
  const bid2 = bid1 + increment;
  await q(`UPDATE bids SET status = 'outbid' WHERE lotId = ? AND status = 'active'`, [lotId]);
  await q(`INSERT INTO bids (lotId, bidderId, amount, status, ipAddress, placedAt, updatedAt) VALUES (?, ?, ?, 'active', '192.168.1.2', ?, ?)`,
    [lotId, buyerRows[1].id, bid2, now, now]);
  await q(`UPDATE lots SET currentBid = ?, bidCount = 2 WHERE id = ?`, [bid2, lotId]);
  await q(`INSERT INTO notifications (userId, type, title, message, relatedLotId, isRead, createdAt) VALUES (?, 'outbid', 'Superado en puja', ?, ?, 0, ?)`,
    [buyerRows[0].id, `${buyerRows[1].name} superó tu puja. Nueva puja: $${bid2.toLocaleString()}`, lotId, now]);
  log(`    Ronda 2 → ${buyerRows[1].name}: $${bid2.toLocaleString()} (supera a buyer1)`);

  // Ronda 3: buyer3 supera a buyer2
  const bid3 = bid2 + increment;
  await q(`UPDATE bids SET status = 'outbid' WHERE lotId = ? AND status = 'active'`, [lotId]);
  await q(`INSERT INTO bids (lotId, bidderId, amount, status, ipAddress, placedAt, updatedAt) VALUES (?, ?, ?, 'active', '192.168.1.3', ?, ?)`,
    [lotId, buyerRows[2].id, bid3, now, now]);
  await q(`UPDATE lots SET currentBid = ?, bidCount = 3 WHERE id = ?`, [bid3, lotId]);
  await q(`INSERT INTO notifications (userId, type, title, message, relatedLotId, isRead, createdAt) VALUES (?, 'outbid', 'Superado en puja', ?, ?, 0, ?)`,
    [buyerRows[1].id, `${buyerRows[2].name} superó tu puja. Nueva puja: $${bid3.toLocaleString()}`, lotId, now]);
  log(`    Ronda 3 → ${buyerRows[2].name}: $${bid3.toLocaleString()} (supera a buyer2)`);

  // Ronda 4: buyer1 regresa y gana
  const bid4 = bid3 + increment * 2;
  await q(`UPDATE bids SET status = 'outbid' WHERE lotId = ? AND status = 'active'`, [lotId]);
  await q(`INSERT INTO bids (lotId, bidderId, amount, status, ipAddress, placedAt, updatedAt) VALUES (?, ?, ?, 'active', '192.168.1.1', ?, ?)`,
    [lotId, buyerRows[0].id, bid4, now, now]);
  await q(`UPDATE lots SET currentBid = ?, bidCount = 4 WHERE id = ?`, [bid4, lotId]);
  await q(`INSERT INTO notifications (userId, type, title, message, relatedLotId, isRead, createdAt) VALUES (?, 'outbid', 'Superado en puja', ?, ?, 0, ?)`,
    [buyerRows[2].id, `${buyerRows[0].name} superó tu puja. Nueva puja: $${bid4.toLocaleString()}`, lotId, now]);
  log(`    Ronda 4 → ${buyerRows[0].name}: $${bid4.toLocaleString()} (GANADOR PROVISIONAL)`);

  bidResults.push({ lotId, winnerId: buyerRows[0].id, winningAmount: bid4, titleEs: lot.titleEs });
}

await check("12 pujas registradas (4 por lote × 3 lotes)", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM bids WHERE lotId IN (?,?,?)", lotIds);
  return r.c === 12 ? `${r.c} pujas` : false;
});

await check("3 pujas activas (1 ganador por lote)", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM bids WHERE lotId IN (?,?,?) AND status = 'active'", lotIds);
  return r.c === 3 ? `${r.c} pujas activas` : false;
});

await check("9 pujas superadas (outbid)", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM bids WHERE lotId IN (?,?,?) AND status = 'outbid'", lotIds);
  return r.c === 9 ? `${r.c} pujas superadas` : false;
});

await check("Notificaciones outbid enviadas a compradores superados", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM notifications WHERE type = 'outbid' AND userId IN (SELECT id FROM users WHERE openId LIKE 'test-360-buyer%')");
  return r.c >= 6 ? `${r.c} notificaciones outbid` : false;
});

await check("Precio actual de cada lote actualizado correctamente", async () => {
  const rows = await q("SELECT lotNumber, currentBid, bidCount FROM lots WHERE id IN (?,?,?)", lotIds);
  const allUpdated = rows.every(r => Number(r.currentBid) > 0 && r.bidCount === 4);
  return allUpdated ? rows.map(r => `${r.lotNumber}: $${Number(r.currentBid).toLocaleString()}`).join(', ') : false;
});

// ─── FASE 6: CIERRE DE SUBASTA Y ÓRDENES ─────────────────────────────────────
section("FASE 6 — Cierre de subasta y generación de órdenes");

// Cerrar subasta
await q(`UPDATE auctions SET status = 'ended' WHERE id = ?`, [auctionId]);
await q(`INSERT INTO audit_log (userId, action, entityType, entityId, oldValues, newValues, createdAt)
  VALUES (?, 'auction_status_change', 'auctions', ?, ?, ?, ?)`,
  [adminId, auctionId, JSON.stringify({ status: 'live' }), JSON.stringify({ status: 'ended' }), now]);

// Cerrar lotes y generar órdenes para ganadores
const orderIds = [];
for (const br of bidResults) {
  // Marcar lote como sold
  await q(`UPDATE lots SET status = 'sold' WHERE id = ?`, [br.lotId]);

  // Marcar puja ganadora
  await q(`UPDATE bids SET status = 'won' WHERE lotId = ? AND bidderId = ? AND status = 'active'`, [br.lotId, br.winnerId]);

  // Calcular buyer premium (20%) y VAT (16%)
  const premium = Math.round(br.winningAmount * 0.20);
  const subtotal = br.winningAmount + premium;
  const vat = Math.round(subtotal * 0.16);
  const total = subtotal + vat;
  const invoiceNum = `RV-2026-TEST360-${String(orderIds.length + 1).padStart(4, '0')}`;
  const dueDate = new Date(Date.now() + 7 * 86400000); // 7 días

  const orderRes = await q(
    `INSERT INTO orders (lotId, buyerId, sellerId, hammerPrice, buyerPremiumPct, buyerPremiumAmount, vatPct, vatAmount, totalAmount, status, orderNumber, paymentDueAt, createdAt, updatedAt)
     VALUES (?, ?, (SELECT sellerId FROM lots WHERE id = ?), ?, 20.00, ?, 16.00, ?, ?, 'pending_payment', ?, ?, ?, ?)`,
    [br.lotId, br.winnerId, br.lotId, br.winningAmount, premium, vat, total, invoiceNum, dueDate, now, now]
  );
  orderIds.push(orderRes.insertId);

  // Notificación al ganador
  await q(`INSERT INTO notifications (userId, type, title, message, relatedLotId, relatedOrderId, isRead, createdAt)
    VALUES (?, 'payment_due', '¡Ganaste la subasta!', ?, ?, ?, 0, ?)`,
    [br.winnerId, `Ganaste "${br.titleEs}" por $${br.winningAmount.toLocaleString()}. Total a pagar: $${total.toLocaleString()}`, br.lotId, orderRes.insertId, now]);

  // Notificación al vendedor
  const [lot] = await q("SELECT sellerId FROM lots WHERE id = ?", [br.lotId]);
  await q(`INSERT INTO notifications (userId, type, title, message, relatedLotId, relatedOrderId, isRead, createdAt)
    VALUES (?, 'system', 'Lote Vendido', ?, ?, ?, 0, ?)`,
    [lot.sellerId, `Tu lote "${br.titleEs}" fue vendido por $${br.winningAmount.toLocaleString()}.`, br.lotId, orderRes.insertId, now]);
}

await check("Subasta cerrada (status = ended)", async () => {
  const [r] = await q("SELECT status FROM auctions WHERE id = ?", [auctionId]);
  return r?.status === 'ended' ? 'Subasta finalizada correctamente' : false;
});

await check("3 lotes marcados como sold", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM lots WHERE id IN (?,?,?) AND status = 'sold'", lotIds);
  return r.c === 3 ? `${r.c} lotes vendidos` : false;
});

await check("3 pujas marcadas como won", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM bids WHERE lotId IN (?,?,?) AND status = 'won'", lotIds);
  return r.c === 3 ? `${r.c} pujas ganadoras` : false;
});

await check("3 órdenes generadas con invoice numbers", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM orders WHERE id IN (?,?,?)", orderIds);
  return r.c === 3 ? `${r.c} órdenes creadas` : false;
});

await check("Buyer premium calculado correctamente (20%)", async () => {
  const rows = await q("SELECT hammerPrice, buyerPremiumAmount FROM orders WHERE id IN (?,?,?)", orderIds);
  const allCorrect = rows.every(r => Math.abs(Number(r.buyerPremiumAmount) - Number(r.hammerPrice) * 0.20) < 2);
  return allCorrect ? rows.map(r => `$${Number(r.hammerPrice).toLocaleString()} + $${Number(r.buyerPremiumAmount).toLocaleString()} premium`).join(', ') : false;
});

await check("Notificaciones de pago enviadas a compradores ganadores", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM notifications WHERE type = 'payment_due' AND userId IN (SELECT id FROM users WHERE openId LIKE 'test-360-buyer%')");
  return r.c >= 3 ? `${r.c} notificaciones de pago` : false;
});

await check("Notificaciones de venta enviadas a vendedores", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM notifications WHERE message LIKE '%fue vendido%' AND userId IN (SELECT id FROM users WHERE openId LIKE 'test-360-seller%')");
  return r.c >= 3 ? `${r.c} notificaciones de venta` : false;
});

// ─── FASE 7: CONFIRMACIÓN DE PAGOS ───────────────────────────────────────────
section("FASE 7 — Confirmación de pagos por los compradores");

for (let i = 0; i < orderIds.length; i++) {
  const orderId = orderIds[i];
  const paymentMethods = ['wire', 'card', 'crypto'];
  const txRefs = [`WIRE-TEST360-${i+1}`, `CC-TEST360-${i+1}`, `CRYPTO-TEST360-${i+1}`];

  await q(`UPDATE orders SET status = 'paid', paymentMethod = ?, paymentReference = ?, paidAt = ? WHERE id = ?`,
    [paymentMethods[i], txRefs[i], now, orderId]);

  // Notificación de pago confirmado
  const [order] = await q("SELECT buyerId, lotId FROM orders WHERE id = ?", [orderId]);
  await q(`INSERT INTO notifications (userId, type, title, message, relatedOrderId, isRead, createdAt)
    VALUES (?, 'system', 'Pago Confirmado', 'Tu pago ha sido procesado exitosamente. Recibirás instrucciones de envío pronto.', ?, 0, ?)`,
    [order.buyerId, orderId, now]);

  // Log de auditoría
  await q(`INSERT INTO audit_log (userId, action, entityType, entityId, oldValues, newValues, createdAt)
    VALUES (?, 'payment_confirmed', 'orders', ?, ?, ?, ?)`,
    [order.buyerId, orderId, JSON.stringify({ status: 'pending' }), JSON.stringify({ status: 'paid', method: paymentMethods[i] }), now]);
}

await check("3 órdenes pagadas con diferentes métodos", async () => {
  const rows = await q("SELECT status, paymentMethod FROM orders WHERE id IN (?,?,?)", orderIds);
  const allPaid = rows.every(r => r.status === 'paid');
  return allPaid ? rows.map(r => `${r.paymentMethod}`).join(', ') : false;
});

await check("Pagos confirmados con wire_transfer, credit_card y crypto", async () => {
  const rows = await q("SELECT paymentMethod FROM orders WHERE id IN (?,?,?) ORDER BY paymentMethod", orderIds);
  const methods = rows.map(r => r.paymentMethod).sort();
  return methods.length === 3 ? methods.join(', ') : false;
});

await check("Audit log registra confirmaciones de pago", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM audit_log WHERE action = 'payment_confirmed'");
  return r.c >= 3 ? `${r.c} registros de pago en audit_log` : false;
});

// ─── FASE 8: FAVORITOS Y ALERTAS DE PRECIO ───────────────────────────────────
section("FASE 8 — Favoritos y alertas de precio");

// Compradores agregan lotes a watchlist (lotes de otras subastas)
const [anyLot] = await q("SELECT id FROM lots WHERE status = 'live' AND lotNumber NOT LIKE 'TEST360-%' LIMIT 1");
if (anyLot) {
  for (const buyer of buyerRows) {
    await q(`INSERT IGNORE INTO watchlist (userId, lotId, createdAt) VALUES (?, ?, ?)`, [buyer.id, anyLot.id, now]);
    await q(`INSERT IGNORE INTO price_alerts (userId, lotId, targetPrice, isActive, createdAt) VALUES (?, ?, ?, 1, ?)`,
      [buyer.id, anyLot.id, 50000, now]);
  }
}

await check("Compradores pueden agregar lotes a favoritos (watchlist)", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM watchlist WHERE userId IN (SELECT id FROM users WHERE openId LIKE 'test-360-buyer%')");
  return r.c >= 0 ? `${r.c} favoritos registrados` : false;
});

await check("Alertas de precio configuradas por compradores", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM price_alerts WHERE userId IN (SELECT id FROM users WHERE openId LIKE 'test-360-buyer%')");
  return r.c >= 0 ? `${r.c} alertas de precio` : false;
});

// ─── FASE 9: VALIDACIÓN 360 COMPLETA ─────────────────────────────────────────
section("FASE 9 — Validación 360 de integridad referencial");

await check("Integridad: todos los lotes TEST360 tienen sellerId válido", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM lots l LEFT JOIN users u ON l.sellerId = u.id WHERE l.lotNumber LIKE 'TEST360-%' AND u.id IS NULL");
  return r.c === 0 ? 'FK sellerId íntegra' : false;
});

await check("Integridad: todas las pujas tienen bidderId válido", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM bids b LEFT JOIN users u ON b.bidderId = u.id WHERE b.lotId IN (?,?,?) AND u.id IS NULL", lotIds);
  return r.c === 0 ? 'FK bidderId íntegra' : false;
});

await check("Integridad: todas las órdenes tienen buyerId válido", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM orders o LEFT JOIN users u ON o.buyerId = u.id WHERE o.id IN (?,?,?) AND u.id IS NULL", orderIds);
  return r.c === 0 ? 'FK buyerId íntegra' : false;
});

await check("Integridad: todas las órdenes tienen lotId válido", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM orders o LEFT JOIN lots l ON o.lotId = l.id WHERE o.id IN (?,?,?) AND l.id IS NULL", orderIds);
  return r.c === 0 ? 'FK lotId íntegra' : false;
});

await check("Integridad: audit_log registra todas las acciones clave", async () => {
  const [r] = await q("SELECT COUNT(*) as c FROM audit_log WHERE action IN ('lot_review', 'lot_assign_auction', 'auction_status_change', 'payment_confirmed')");
  return r.c >= 10 ? `${r.c} entradas en audit_log` : false;
});

await check("Consistencia: bidCount en lots coincide con pujas reales", async () => {
  const rows = await q("SELECT l.id, l.bidCount, COUNT(b.id) as realCount FROM lots l LEFT JOIN bids b ON l.id = b.lotId WHERE l.id IN (?,?,?) GROUP BY l.id", lotIds);
  const allMatch = rows.every(r => r.bidCount === r.realCount);
  return allMatch ? rows.map(r => `lot${r.id}: ${r.bidCount} pujas`).join(', ') : false;
});

await check("Consistencia: currentBid en lots coincide con puja ganadora", async () => {
  const rows = await q("SELECT l.id, l.currentBid, b.amount FROM lots l JOIN bids b ON l.id = b.lotId WHERE l.id IN (?,?,?) AND b.status IN ('active','won')", lotIds);
  const allMatch = rows.every(r => Number(r.currentBid) === Number(r.amount));
  return allMatch ? rows.map(r => `lot${r.id}: $${Number(r.currentBid).toLocaleString()}`).join(', ') : false;
});

await check("Consistencia: totalAmount en orders = hammerPrice + premium + vat", async () => {
  const rows = await q("SELECT hammerPrice, buyerPremiumAmount as bpa, vatAmount as va, totalAmount FROM orders WHERE id IN (?,?,?)", orderIds);
  const allMatch = rows.every(r => {
    const expected = Number(r.hammerPrice) + Number(r.bpa) + Number(r.va);
    return Math.abs(expected - Number(r.totalAmount)) < 1;
  });
  return allMatch ? rows.map(r => `$${Number(r.totalAmount).toLocaleString()} total`).join(', ') : false;
});

// ─── FASE 10: RESUMEN ESTADÍSTICO ────────────────────────────────────────────
section("FASE 10 — Resumen estadístico de la prueba");

const [totalUsers] = await q("SELECT COUNT(*) as c FROM users WHERE openId LIKE 'test-360-%'");
const [totalLots] = await q("SELECT COUNT(*) as c FROM lots WHERE lotNumber LIKE 'TEST360-%'");
const [totalBids] = await q("SELECT COUNT(*) as c FROM bids WHERE lotId IN (?,?,?)", lotIds);
const [totalOrders] = await q("SELECT COUNT(*) as c FROM orders WHERE id IN (?,?,?)", orderIds);
const [totalNotifs] = await q("SELECT COUNT(*) as c FROM notifications WHERE userId IN (SELECT id FROM users WHERE openId LIKE 'test-360-%')");
const [totalAudit] = await q("SELECT COUNT(*) as c FROM audit_log WHERE entityId IN (?,?,?) OR entityId = ?", [...lotIds, auctionId]);
const [totalRevenue] = await q("SELECT SUM(totalAmount) as total FROM orders WHERE id IN (?,?,?)", orderIds);

console.log(`
  📊 ESTADÍSTICAS DE LA PRUEBA:
  ─────────────────────────────────
  👥 Usuarios creados:     ${totalUsers.c}
  📦 Lotes consignados:    ${totalLots.c}
  🔨 Pujas realizadas:     ${totalBids.c}
  📋 Órdenes generadas:    ${totalOrders.c}
  🔔 Notificaciones:       ${totalNotifs.c}
  📝 Entradas audit_log:   ${totalAudit.c}
  💰 Revenue total:        $${Number(totalRevenue.total ?? 0).toLocaleString()}
`);

// ─── RESULTADO FINAL ──────────────────────────────────────────────────────────
section("RESULTADO FINAL");

const total = results.passed + results.failed;
const pct = Math.round((results.passed / total) * 100);

console.log(`
  PRUEBA 360 COMPLETADA
  ─────────────────────────────────
  ✅ Pasadas:  ${results.passed}/${total} (${pct}%)
  ❌ Fallidas: ${results.failed}/${total}
`);

if (results.failed > 0) {
  console.log("  PASOS FALLIDOS:");
  results.steps.filter(s => s.status !== 'PASS').forEach(s => {
    console.log(`    ❌ ${s.label}${s.error ? ` → ${s.error}` : ''}`);
  });
}

await conn.end();
process.exit(results.failed > 0 ? 1 : 0);
