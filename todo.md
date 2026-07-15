# RapidVenta — TODO

## Completado anteriormente
- [x] Mockup UI/UX completo (13 páginas, responsive, bilingüe)
- [x] Esquema de BD (16 tablas, PK, FK, índices)
- [x] Seed de paquetes y funciones de negocio (8 paquetes, 28 funciones)
- [x] Backend tRPC (30+ endpoints, middleware de roles)
- [x] Vistas dinámicas por rol en Navbar
- [x] 43 pruebas vitest pasadas
- [x] Validación interna de BD 100/100
- [x] Login, Register KYC, HowToBid, Checkout, UserProfile
- [x] Admin Dashboard con 7 módulos

## Prioridad Alta — Flujo de negocio central

- [x] Conectar botón "Pujar ahora" en LotDetail al backend real (bids.place)
- [x] Tabla auction_registrations en BD + endpoint auctions.register
- [x] UI de registro en subasta antes de pujar
- [x] Proxy bid / Auto-bid UI conectado al campo maxAutoBid del backend
- [x] Confirmación de pago por el comprador (buyer confirm payment)
- [x] Página /invoices como ruta independiente
- [x] Página /favorites como ruta independiente

## Prioridad Media — Experiencia de usuario

- [x] Tabla price_alerts en BD + router de alertas de precio
- [x] UI de alertas de precio en /favorites y dashboard
- [x] Estados de puja en tiempo real con polling (vas ganando / has sido superado)
- [x] Imágenes de lotes desde S3 en formulario de consignación
- [x] Atributos dinámicos por categoría en formulario de consignación
- [x] Historial de revisiones del experto (timestamps + notas previas)

## Prioridad Baja — Pulido

- [x] Skeleton loaders en catálogo y dashboards
- [x] Búsqueda full-text con debounce en catálogo (frontend + backend)
- [x] Soft close visible en countdown del detalle de lote
