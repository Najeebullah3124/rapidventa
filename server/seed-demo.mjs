/**
 * Seed de datos de demostración para RapidVenta
 * Usa mysql2 directamente para evitar problemas con tsx+drizzle
 */
import mysql from "mysql2/promise";
import { readFileSync } from "fs";

// Leer DATABASE_URL del entorno o del .env
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  try {
    const env = readFileSync(".env", "utf8");
    const match = env.match(/DATABASE_URL=(.+)/);
    if (match) dbUrl = match[1].trim();
  } catch {}
}

if (!dbUrl) {
  console.error("❌ DATABASE_URL no encontrado");
  process.exit(1);
}

const conn = await mysql.createConnection(dbUrl);
console.log("🌱 Iniciando seed de datos de demostración...\n");

// Helper para ejecutar SQL con manejo de errores
async function exec(sql, params = []) {
  try {
    await conn.execute(sql, params);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY" || e.code === "WARN_DATA_TRUNCATED") {
      // Ignorar duplicados
    } else {
      console.warn(`  ⚠️  ${e.message.slice(0, 80)}`);
    }
  }
}

// ─── 1. Usuarios demo ─────────────────────────────────────────────────────────
console.log("👤 Creando usuarios demo...");
const now = new Date().toISOString().slice(0, 19).replace("T", " ");

await exec(`INSERT INTO users (openId, name, email, loginMethod, role, kycStatus, kycReviewedAt, phone, country, isVerifiedSeller, createdAt, updatedAt, lastSignedIn)
  VALUES ('demo-buyer-001','Carlos Mendoza','carlos.mendoza@demo.com','demo','buyer','approved',?,'+52 55 1234 5678','MX',0,?,?,?)
  ON DUPLICATE KEY UPDATE name=VALUES(name)`, [now, now, now, now]);

await exec(`INSERT INTO users (openId, name, email, loginMethod, role, kycStatus, kycReviewedAt, phone, country, isVerifiedSeller, sellerRating, totalSales, createdAt, updatedAt, lastSignedIn)
  VALUES ('demo-seller-001','Galería Artística Monterrey','galeria@demo.com','demo','seller','approved',?,'+52 81 9876 5432','MX',1,'4.80',47,?,?,?)
  ON DUPLICATE KEY UPDATE name=VALUES(name)`, [now, now, now, now]);

await exec(`INSERT INTO users (openId, name, email, loginMethod, role, kycStatus, kycReviewedAt, phone, country, isVerifiedExpert, createdAt, updatedAt, lastSignedIn)
  VALUES ('demo-expert-001','Dr. Alejandro Ruiz','dr.ruiz@demo.com','demo','expert','approved',?,'+52 55 8765 4321','MX',1,?,?,?)
  ON DUPLICATE KEY UPDATE name=VALUES(name)`, [now, now, now, now]);

await exec(`INSERT INTO users (openId, name, email, loginMethod, role, kycStatus, kycReviewedAt, phone, country, createdAt, updatedAt, lastSignedIn)
  VALUES ('demo-admin-001','Admin RapidVenta','admin@rapidventa.com','demo','admin','approved',?,'+52 55 0000 0001','MX',?,?,?)
  ON DUPLICATE KEY UPDATE name=VALUES(name)`, [now, now, now, now]);

console.log("  ✅ 4 usuarios creados\n");

// Obtener IDs
const [[adminRow]] = await conn.execute("SELECT id FROM users WHERE openId='demo-admin-001' LIMIT 1");
const [[sellerRow]] = await conn.execute("SELECT id FROM users WHERE openId='demo-seller-001' LIMIT 1");
const [[expertRow]] = await conn.execute("SELECT id FROM users WHERE openId='demo-expert-001' LIMIT 1");
const adminId = adminRow.id;
const sellerId = sellerRow.id;
const expertId = expertRow.id;

// ─── 2. Subastas demo ─────────────────────────────────────────────────────────
console.log("🔨 Creando subastas demo...");
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
const nextWeekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");

await exec(`INSERT INTO auctions (code, titleEs, titleEn, status, auctionType, startTime, endTime, buyerPremiumPct, vatPct, antiSnipingMinutes, createdBy, descriptionEs, createdAt, updatedAt)
  VALUES ('SUB-2026-07-0001','Subasta de Arte Moderno Latinoamericano','Latin American Modern Art Auction','live','timed',?,?,'20.00','16.00',3,?,'Selección exclusiva de obras de arte moderno latinoamericano.',?,?)
  ON DUPLICATE KEY UPDATE titleEs=VALUES(titleEs)`, [yesterday, tomorrow, adminId, now, now]);

await exec(`INSERT INTO auctions (code, titleEs, titleEn, status, auctionType, startTime, endTime, buyerPremiumPct, vatPct, antiSnipingMinutes, createdBy, descriptionEs, createdAt, updatedAt)
  VALUES ('SUB-2026-07-0002','Colección de Relojes de Lujo','Luxury Watches Collection','upcoming','live',?,?,'22.00','16.00',5,?,'Relojes de las más prestigiosas marcas suizas y europeas.',?,?)
  ON DUPLICATE KEY UPDATE titleEs=VALUES(titleEs)`, [nextWeek, nextWeekEnd, adminId, now, now]);

await exec(`INSERT INTO auctions (code, titleEs, titleEn, status, auctionType, startTime, endTime, buyerPremiumPct, vatPct, antiSnipingMinutes, createdBy, descriptionEs, createdAt, updatedAt)
  VALUES ('SUB-2026-06-0001','Deportes y Memorabilia','Sports & Memorabilia','ended','timed',?,?,'18.00','16.00',3,?,'Artículos firmados y memorabilia deportiva.',?,?)
  ON DUPLICATE KEY UPDATE titleEs=VALUES(titleEs)`, [lastWeek, yesterday, adminId, now, now]);

console.log("  ✅ 3 subastas creadas\n");

// Obtener IDs de subastas y categorías
const [[auctionLiveRow]] = await conn.execute("SELECT id FROM auctions WHERE code='SUB-2026-07-0001' LIMIT 1");
const [[auctionUpcomingRow]] = await conn.execute("SELECT id FROM auctions WHERE code='SUB-2026-07-0002' LIMIT 1");
const auctionLiveId = auctionLiveRow.id;
const auctionUpcomingId = auctionUpcomingRow.id;

const [catRows] = await conn.execute("SELECT id, nameEs FROM categories WHERE isActive=1");
const catMap = Object.fromEntries(catRows.map(c => [c.nameEs, c.id]));
const artId = catMap["Arte"] ?? 1;
const watchId = catMap["Relojes"] ?? 2;
const sportsId = catMap["Deportes"] ?? 3;
const collectId = catMap["Coleccionables"] ?? 4;

// ─── 3. Lotes demo ────────────────────────────────────────────────────────────
console.log("📦 Creando lotes demo...");

const reviewedYesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
const images1 = JSON.stringify(["/manus-storage/rv-lot-art_b318fc6b.jpg"]);
const images2 = JSON.stringify(["/manus-storage/rv-lot-watch_160166ab.jpg"]);
const images3 = JSON.stringify(["/manus-storage/rv-lot-sports_51a583e1.jpg"]);

await exec(`INSERT INTO lots (lotNumber, categoryId, auctionId, sellerId, expertId, titleEs, titleEn, descriptionEs, startingBid, currentBid, estimateLow, estimateHigh, bidCount, status, \`condition\`, isFeatured, isCertified, expertNotes, expertReviewedAt, imageUrls, viewCount, watchCount, createdAt, updatedAt)
  VALUES ('RV-2026-001',?,?,?,?,'Composición Abstracta N°7','Abstract Composition No.7','Óleo sobre tela. Obra de gran formato del período expresionista abstracto mexicano. Firmada y fechada 1968.','8000.00','12500.00','10000.00','18000.00',7,'live','excellent',1,1,'Obra autenticada. Certificado de autenticidad adjunto.',?,?,234,18,?,?)
  ON DUPLICATE KEY UPDATE titleEs=VALUES(titleEs)`,
  [artId, auctionLiveId, sellerId, expertId, reviewedYesterday, images1, now, now]);

await exec(`INSERT INTO lots (lotNumber, categoryId, auctionId, sellerId, expertId, titleEs, titleEn, descriptionEs, startingBid, estimateLow, estimateHigh, bidCount, status, \`condition\`, isFeatured, isCertified, expertNotes, expertReviewedAt, imageUrls, viewCount, watchCount, createdAt, updatedAt)
  VALUES ('RV-2026-002',?,?,?,?,'Patek Philippe Nautilus 5711','Patek Philippe Nautilus 5711','Referencia 5711/1A-010. Acero inoxidable, esfera azul. Año 2019. Caja y documentos originales.','85000.00','90000.00','120000.00',0,'upcoming','mint',1,1,'Reloj en perfectas condiciones. Servicio reciente documentado.',?,?,892,67,?,?)
  ON DUPLICATE KEY UPDATE titleEs=VALUES(titleEs)`,
  [watchId, auctionUpcomingId, sellerId, expertId, reviewedYesterday, images2, now, now]);

await exec(`INSERT INTO lots (lotNumber, categoryId, auctionId, sellerId, expertId, titleEs, titleEn, descriptionEs, startingBid, currentBid, estimateLow, estimateHigh, bidCount, status, \`condition\`, isFeatured, isCertified, expertNotes, expertReviewedAt, imageUrls, viewCount, watchCount, createdAt, updatedAt)
  VALUES ('RV-2026-003',?,?,?,?,'Jersey Firmado - Lionel Messi','Signed Jersey - Lionel Messi','Jersey oficial del FC Barcelona temporada 2021-22, firmado por Lionel Messi. Incluye certificado PSA/DNA.','3500.00','4200.00','4000.00','7000.00',3,'live','excellent',0,1,'Autenticidad verificada por PSA/DNA.',?,?,456,32,?,?)
  ON DUPLICATE KEY UPDATE titleEs=VALUES(titleEs)`,
  [sportsId, auctionLiveId, sellerId, expertId, reviewedYesterday, images3, now, now]);

await exec(`INSERT INTO lots (lotNumber, categoryId, sellerId, titleEs, titleEn, descriptionEs, startingBid, estimateLow, estimateHigh, bidCount, status, \`condition\`, isFeatured, isCertified, imageUrls, viewCount, watchCount, createdAt, updatedAt)
  VALUES ('RV-2026-004',?,?,'Escultura Contemporánea - Serie Raíces','Contemporary Sculpture - Roots Series','Bronce patinado, 45 cm. Edición 3/10. Obra de artista emergente con reconocimiento internacional.','5500.00','6000.00','9000.00',0,'pending_review','excellent',0,0,?,12,2,?,?)
  ON DUPLICATE KEY UPDATE titleEs=VALUES(titleEs)`,
  [artId, sellerId, images1, now, now]);

await exec(`INSERT INTO lots (lotNumber, categoryId, auctionId, sellerId, expertId, titleEs, titleEn, descriptionEs, startingBid, currentBid, estimateLow, estimateHigh, bidCount, status, \`condition\`, isFeatured, isCertified, expertNotes, expertReviewedAt, imageUrls, viewCount, watchCount, createdAt, updatedAt)
  VALUES ('RV-2026-005',?,?,?,?,'Monedas Antiguas - Colección Imperio Azteca','Ancient Coins - Aztec Empire Collection','Lote de 12 monedas de plata del período colonial mexicano (1700-1820). Excelente estado de conservación.','2200.00','2800.00','2500.00','4500.00',4,'live','good',0,1,'Monedas autenticadas por numismático certificado.',?,?,178,14,?,?)
  ON DUPLICATE KEY UPDATE titleEs=VALUES(titleEs)`,
  [collectId, auctionLiveId, sellerId, expertId, reviewedYesterday, images1, now, now]);

console.log("  ✅ 5 lotes creados\n");

console.log("✅ Seed de demostración completado exitosamente!");
console.log("\n📊 Resumen:");
console.log("   - 4 usuarios (buyer, seller, expert, admin)");
console.log("   - 3 subastas (live, upcoming, ended)");
console.log("   - 5 lotes (live x3, upcoming x1, pending_review x1)");

await conn.end();
process.exit(0);
