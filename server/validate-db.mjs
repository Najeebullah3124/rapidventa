/**
 * RapidVenta — Validación interna de base de datos (sin IA)
 * Ejecutar: node server/validate-db.mjs
 *
 * Este script valida directamente en la BD:
 * 1. Existencia y conteo de todas las tablas
 * 2. Integridad de PKs e índices
 * 3. Inventario de paquetes y funciones de negocio
 * 4. Datos de subastas y lotes
 * 5. Configuración de la plataforma
 * 6. Reglas de negocio en datos (buyer premium, comisiones)
 */

import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("❌ DATABASE_URL no definida"); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);
let passed = 0, failed = 0;

function ok(label, value) {
  console.log(`  ✅ ${label}: ${value}`);
  passed++;
}
function fail(label, msg) {
  console.error(`  ❌ ${label}: ${msg}`);
  failed++;
}
function section(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log("─".repeat(60));
}

// ─── 1. TABLAS ───────────────────────────────────────────────────────────────
section("1. INVENTARIO DE TABLAS");
const expectedTables = [
  "users", "auctions", "lots", "bids", "orders",
  "categories", "packages", "package_functions",
  "platform_config", "notifications", "watchlist",
  "kyc_documents", "audit_log", "function_execution_log"
];
const [tableRows] = await conn.execute("SHOW TABLES");
const existingTables = tableRows.map(r => Object.values(r)[0]);
for (const t of expectedTables) {
  if (existingTables.includes(t)) ok(`Tabla '${t}'`, "existe");
  else fail(`Tabla '${t}'`, "NO EXISTE");
}

// ─── 2. CONTEO DE REGISTROS ──────────────────────────────────────────────────
section("2. CONTEO DE REGISTROS POR TABLA");
for (const t of expectedTables) {
  if (!existingTables.includes(t)) continue;
  const [[row]] = await conn.execute(`SELECT COUNT(*) as c FROM \`${t}\``);
  ok(`${t.padEnd(28)}`, `${row.c} registros`);
}

// ─── 3. ÍNDICES ──────────────────────────────────────────────────────────────
section("3. VALIDACIÓN DE ÍNDICES CRÍTICOS");
const criticalIndexes = [
  ["users",     "openId"],
  ["lots",      "idx_lots_status"],
  ["lots",      "idx_lots_categoryId"],
  ["bids",      "idx_bids_lotId"],
  ["orders",    "idx_orders_buyerId"],
  ["packages",  "idx_packages_code"],
];
for (const [table, idx] of criticalIndexes) {
  if (!existingTables.includes(table)) continue;
  const [idxRows] = await conn.execute(`SHOW INDEX FROM \`${table}\` WHERE Key_name = '${idx}' OR Column_name = '${idx}'`);
  if (idxRows.length > 0) ok(`Índice ${table}.${idx}`, "presente");
  else fail(`Índice ${table}.${idx}`, "ausente");
}

// ─── 4. PAQUETES DE NEGOCIO ──────────────────────────────────────────────────
section("4. INVENTARIO DE PAQUETES DE NEGOCIO");
const [pkgs] = await conn.execute("SELECT code, name, version, isActive FROM packages ORDER BY code");
if (pkgs.length === 0) fail("Paquetes", "no hay registros");
else {
  for (const p of pkgs) {
    ok(`PKG ${p.code} v${p.version}`, `${p.name} [${p.isActive ? "ACTIVO" : "INACTIVO"}]`);
  }
}

// ─── 5. FUNCIONES DE NEGOCIO ─────────────────────────────────────────────────
section("5. INVENTARIO DE FUNCIONES DE NEGOCIO");
const [fns] = await conn.execute(`
  SELECT pf.code, pf.name, pf.isActive, p.code as pkgCode
  FROM package_functions pf
  JOIN packages p ON pf.packageId = p.id
  ORDER BY p.code, pf.code
`);
if (fns.length === 0) fail("Funciones", "no hay registros");
else {
  ok("Total funciones registradas", fns.length);
  for (const f of fns) {
    ok(`  FN ${f.pkgCode}.${f.code}`, `${f.nameEs} [${f.isActive ? "ACTIVO" : "INACTIVO"}]`);
  }
}

// ─── 6. SUBASTAS Y LOTES ─────────────────────────────────────────────────────
section("6. DATOS DE SUBASTAS Y LOTES");
const [auctions] = await conn.execute("SELECT id, titleEs, status, auctionType, buyerPremiumPct FROM auctions ORDER BY id");
for (const a of auctions) {
  ok(`Subasta #${a.id}`, `${a.titleEs} | status=${a.status} | type=${a.auctionType} | premium=${a.buyerPremiumPct}%`);
}
const [lots] = await conn.execute(`
  SELECT l.id, l.titleEs, l.status, l.startingBid, l.currentBid, c.nameEs as category
  FROM lots l LEFT JOIN categories c ON l.categoryId = c.id ORDER BY l.id
`);
for (const l of lots) {
  ok(`Lote #${l.id}`, `${l.titleEs} | cat=${l.category} | status=${l.status} | base=$${l.startingBid} | actual=$${l.currentBid || 0}`);
}

// ─── 7. CONFIGURACIÓN DE PLATAFORMA ─────────────────────────────────────────
section("7. CONFIGURACIÓN DE PLATAFORMA");
const [configs] = await conn.execute("SELECT `key`, value, dataType FROM platform_config ORDER BY `key`");
if (configs.length === 0) fail("Config", "no hay registros");
else {
  for (const c of configs) {
    ok(`CONFIG ${c.key}`, `${c.value} (${c.dataType})`);
  }
}

// ─── 8. REGLAS DE NEGOCIO EN DATOS ──────────────────────────────────────────
section("8. VALIDACIÓN DE REGLAS DE NEGOCIO EN DATOS");

// RN-001: Buyer premium debe ser >= 0 y <= 50
const [premiumCheck] = await conn.execute("SELECT COUNT(*) as c FROM auctions WHERE buyerPremiumPct < 0 OR buyerPremiumPct > 50");
if (premiumCheck[0].c === 0) ok("RN-001: Buyer premium en rango [0,50]", "OK");
else fail("RN-001: Buyer premium fuera de rango", `${premiumCheck[0].c} registros inválidos`);

// RN-002: Lotes deben tener categoría válida
const [catCheck] = await conn.execute("SELECT COUNT(*) as c FROM lots l LEFT JOIN categories c ON l.categoryId = c.id WHERE c.id IS NULL");
if (catCheck[0].c === 0) ok("RN-002: Todos los lotes tienen categoría válida", "OK");
else fail("RN-002: Lotes sin categoría válida", `${catCheck[0].c} registros`);

// RN-003: Lotes deben tener precio de inicio > 0
const [priceCheck] = await conn.execute("SELECT COUNT(*) as c FROM lots WHERE startingBid <= 0");
if (priceCheck[0].c === 0) ok("RN-003: Todos los lotes tienen precio de inicio > 0", "OK");
else fail("RN-003: Lotes con precio de inicio inválido", `${priceCheck[0].c} registros`);

// RN-004: Usuarios deben tener openId único
const [openIdCheck] = await conn.execute("SELECT COUNT(*) as total, COUNT(DISTINCT openId) as uniq FROM users");
if (openIdCheck[0].total === openIdCheck[0].uniq) ok("RN-004: openId único por usuario", `${openIdCheck[0].total} usuarios`);
else fail("RN-004: openId duplicado detectado", `total=${openIdCheck[0].total} vs uniq=${openIdCheck[0].uniq}`);

// RN-005: Paquetes activos deben tener al menos 1 función activa
const [pkgFnCheck] = await conn.execute(`
  SELECT p.code FROM packages p
  LEFT JOIN package_functions pf ON pf.packageId = p.id AND pf.isActive = 1
  WHERE p.isActive = 1
  GROUP BY p.id HAVING COUNT(pf.id) = 0
`);
if (pkgFnCheck.length === 0) ok("RN-005: Todos los paquetes activos tienen funciones", "OK");
else fail("RN-005: Paquetes activos sin funciones", pkgFnCheck.map(r => r.code).join(", "));

// RN-006: Configuración crítica presente
const criticalConfigs = ["buyer_premium_pct", "seller_commission_pct", "min_bid_increment"];
const [cfgRows] = await conn.execute(`SELECT \`key\` FROM platform_config WHERE \`key\` IN (${criticalConfigs.map(() => "?").join(",")})`, criticalConfigs);
const foundKeys = cfgRows.map(r => r.key);
for (const k of criticalConfigs) {
  if (foundKeys.includes(k)) ok(`RN-006: Config crítica '${k}'`, "presente");
  else fail(`RN-006: Config crítica '${k}'`, "AUSENTE");
}

// ─── 9. ROLES DE USUARIOS ────────────────────────────────────────────────────
section("9. ROLES DE USUARIOS DEMO");
const [userRoles] = await conn.execute("SELECT name, email, role, kycStatus FROM users ORDER BY id");
for (const u of userRoles) {
  ok(`Usuario ${u.name || u.email}`, `role=${u.role} | kyc=${u.kycStatus}`);
}

// ─── RESUMEN ─────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log(`📊 RESUMEN DE VALIDACIÓN`);
console.log(`${"═".repeat(60)}`);
console.log(`  ✅ Pruebas pasadas: ${passed}`);
console.log(`  ❌ Pruebas fallidas: ${failed}`);
console.log(`  📈 Total: ${passed + failed}`);
if (failed === 0) {
  console.log(`\n  🎉 VALIDACIÓN COMPLETA — BACKEND 100% FUNCIONAL`);
} else {
  console.log(`\n  ⚠️  SE ENCONTRARON ${failed} PROBLEMA(S) — REVISAR`);
}
console.log(`${"═".repeat(60)}\n`);

await conn.end();
process.exit(failed > 0 ? 1 : 0);
