import React, { createContext, useContext, useState } from "react";

type Lang = "es" | "en";

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  "nav.home": { es: "Inicio", en: "Home" },
  "nav.auctions": { es: "Subastas", en: "Auctions" },
  "nav.catalog": { es: "Catálogo", en: "Catalog" },
  "nav.sell": { es: "Vender", en: "Sell" },
  "nav.how": { es: "Cómo pujar", en: "How to Bid" },
  "nav.help": { es: "Ayuda", en: "Help" },
  "nav.account": { es: "Mi cuenta", en: "My Account" },
  "nav.login": { es: "Iniciar sesión", en: "Sign In" },
  "nav.register": { es: "Registrarse", en: "Register" },
  "topbar.support": { es: "Soporte al cliente", en: "Customer Support" },
  "topbar.sell": { es: "Vender un lote", en: "Sell a Lot" },
  "topbar.how": { es: "Cómo pujar", en: "How to Bid" },

  // Hero
  "hero.eyebrow": { es: "SUBASTAS DIGITALES DE LUJO", en: "LUXURY DIGITAL AUCTIONS" },
  "hero.title": { es: "Descubre, puja y vende piezas excepcionales con verificación experta.", en: "Discover, bid and sell exceptional pieces with expert verification." },
  "hero.subtitle": { es: "RapidVenta conecta compradores, vendedores y expertos en una experiencia de subastas transparente, bilingüe y en tiempo real.", en: "RapidVenta connects buyers, sellers and experts in a transparent, bilingual, real-time auction experience." },
  "hero.trust1": { es: "Autenticidad verificada", en: "Verified Authenticity" },
  "hero.trust2": { es: "Buyer premium transparente", en: "Transparent Buyer Premium" },
  "hero.trust3": { es: "Soporte experto 24/7", en: "Expert Support 24/7" },
  "hero.cta1": { es: "Explorar subastas", en: "Explore Auctions" },
  "hero.cta2": { es: "Vender un lote", en: "Sell a Lot" },

  // Stats
  "stats.lots": { es: "Lotes vendidos", en: "Lots Sold" },
  "stats.buyers": { es: "Compradores registrados", en: "Registered Buyers" },
  "stats.countries": { es: "Países participantes", en: "Participating Countries" },
  "stats.value": { es: "Valor total subastado", en: "Total Auctioned Value" },

  // Sections
  "section.live": { es: "Subastas en vivo", en: "Live Auctions" },
  "section.live.sub": { es: "Puja por piezas seleccionadas antes de que cierre el martillo digital.", en: "Bid on selected pieces before the digital hammer falls." },
  "section.categories": { es: "Categorías", en: "Categories" },
  "section.featured": { es: "Lotes destacados", en: "Featured Lots" },
  "section.trust": { es: "Por qué RapidVenta", en: "Why RapidVenta" },
  "section.cta.title": { es: "¿Tienes una pieza excepcional?", en: "Do you have an exceptional piece?" },
  "section.cta.sub": { es: "Consigna tu lote en RapidVenta y accede a una red global de compradores calificados.", en: "Consign your lot with RapidVenta and reach a global network of qualified buyers." },
  "section.cta.btn": { es: "Comenzar venta", en: "Start Selling" },

  // Categories
  "cat.art": { es: "Arte", en: "Art" },
  "cat.watches": { es: "Relojes", en: "Watches" },
  "cat.sports": { es: "Deportes", en: "Sports" },
  "cat.collectibles": { es: "Coleccionables", en: "Collectibles" },
  "cat.jewelry": { es: "Joyería", en: "Jewelry" },
  "cat.cars": { es: "Automóviles", en: "Automobiles" },
  "cat.soon": { es: "Próximamente", en: "Coming Soon" },

  // Lot card
  "lot.bid": { es: "Pujar ahora", en: "Bid Now" },
  "lot.notify": { es: "Notificarme", en: "Notify Me" },
  "lot.result": { es: "Ver resultado", en: "View Result" },
  "lot.raise": { es: "Subir puja", en: "Raise Bid" },
  "lot.winning": { es: "Vas ganando", en: "You're Winning" },
  "lot.current": { es: "Puja actual", en: "Current Bid" },
  "lot.estimate": { es: "Estimación", en: "Estimate" },
  "lot.number": { es: "Lote", en: "Lot" },
  "lot.seller": { es: "Vendedor", en: "Seller" },

  // Countdown
  "cd.days": { es: "Días", en: "Days" },
  "cd.hours": { es: "Horas", en: "Hours" },
  "cd.min": { es: "Min", en: "Min" },
  "cd.sec": { es: "Seg", en: "Sec" },
  "cd.urgent": { es: "Últimos minutos", en: "Last Minutes" },
  "cd.softclose": { es: "Soft close activo", en: "Soft Close Active" },

  // Trust
  "trust.expert.title": { es: "Revisión experta", en: "Expert Review" },
  "trust.expert.desc": { es: "Cada lote pasa por evaluación antes de publicarse.", en: "Every lot is evaluated before being published." },
  "trust.buyer.title": { es: "Protección al comprador", en: "Buyer Protection" },
  "trust.buyer.desc": { es: "Buyer premium visible antes de pujar.", en: "Buyer premium visible before bidding." },
  "trust.support.title": { es: "Soporte especializado", en: "Specialized Support" },
  "trust.support.desc": { es: "Atención bilingüe para compradores y vendedores.", en: "Bilingual support for buyers and sellers." },

  // Footer
  "footer.tagline": { es: "La casa de subastas digitales para coleccionistas serios.", en: "The digital auction house for serious collectors." },
  "footer.auctions": { es: "Subastas", en: "Auctions" },
  "footer.account": { es: "Cuenta", en: "Account" },
  "footer.sellers": { es: "Vendedores", en: "Sellers" },
  "footer.support": { es: "Soporte", en: "Support" },

  // Catalog
  "catalog.title": { es: "Catálogo de lotes", en: "Lot Catalog" },
  "catalog.search": { es: "Buscar lotes...", en: "Search lots..." },
  "catalog.filters": { es: "Filtros", en: "Filters" },
  "catalog.category": { es: "Categoría", en: "Category" },
  "catalog.status": { es: "Estado", en: "Status" },
  "catalog.price": { es: "Rango de precio", en: "Price Range" },
  "catalog.sort": { es: "Ordenar por", en: "Sort by" },
  "catalog.clear": { es: "Limpiar filtros", en: "Clear Filters" },
  "catalog.empty": { es: "No encontramos lotes con estos filtros", en: "No lots found with these filters" },

  // Lot detail
  "lot.place": { es: "Realizar puja", en: "Place Bid" },
  "lot.maxbid": { es: "Puja máxima (proxy)", en: "Maximum Bid (proxy)" },
  "lot.nextmin": { es: "Próxima puja mínima", en: "Next Minimum Bid" },
  "lot.premium": { es: "Buyer premium", en: "Buyer Premium" },
  "lot.login": { es: "Iniciar sesión para pujar", en: "Sign in to bid" },
  "lot.register_auction": { es: "Registrarme en esta subasta", en: "Register for this auction" },
  "lot.description": { es: "Descripción", en: "Description" },
  "lot.provenance": { es: "Procedencia", en: "Provenance" },
  "lot.condition": { es: "Condición y detalles", en: "Condition & Details" },
  "lot.history": { es: "Historial de pujas", en: "Bid History" },
  "lot.shipping": { es: "Envío y términos", en: "Shipping & Terms" },

  // Auctions page
  "auctions.live": { es: "Subastas en vivo", en: "Live Auctions" },
  "auctions.upcoming": { es: "Próximas subastas", en: "Upcoming Auctions" },
  "auctions.ended": { es: "Subastas finalizadas", en: "Ended Auctions" },
  "auctions.view": { es: "Ver lotes", en: "View Lots" },
  "auctions.register": { es: "Registrarme", en: "Register" },

  // Dashboard
  "dash.active_bids": { es: "Pujas activas", en: "Active Bids" },
  "dash.won": { es: "Lotes ganados", en: "Lots Won" },
  "dash.favorites": { es: "Favoritos", en: "Favorites" },
  "dash.invoices": { es: "Facturas", en: "Invoices" },
  "dash.alerts": { es: "Alertas de precio", en: "Price Alerts" },

  // Seller
  "sell.active": { es: "Lotes activos", en: "Active Lots" },
  "sell.review": { es: "En revisión", en: "Under Review" },
  "sell.sold": { es: "Lotes vendidos", en: "Lots Sold" },
  "sell.commissions": { es: "Comisiones", en: "Commissions" },
  "sell.submit": { es: "Enviar a revisión", en: "Submit for Review" },
  "sell.review_msg": { es: "Tu lote fue enviado a revisión experta. Te notificaremos cuando sea aprobado.", en: "Your lot was submitted for expert review. We'll notify you when approved." },

  // Expert
  "expert.pending": { es: "Pendientes", en: "Pending" },
  "expert.approved": { es: "Aprobados", en: "Approved" },
  "expert.rejected": { es: "Rechazados", en: "Rejected" },
  "expert.approve": { es: "Aprobar", en: "Approve" },
  "expert.changes": { es: "Solicitar cambios", en: "Request Changes" },
  "expert.reject": { es: "Rechazar", en: "Reject" },

  // Admin
  "admin.gmv": { es: "GMV", en: "GMV" },
  "admin.revenue": { es: "Ingresos", en: "Revenue" },
  "admin.users": { es: "Usuarios totales", en: "Total Users" },
  "admin.pending": { es: "Pendiente revisión", en: "Pending Review" },
  "admin.lots": { es: "Lotes totales", en: "Total Lots" },
  "admin.bids": { es: "Pujas totales", en: "Total Bids" },
  "admin.payments": { es: "Pagos pendientes", en: "Pending Payments" },

  // Chatbot
  "chat.title": { es: "Asistente RapidVenta", en: "RapidVenta Assistant" },
  "chat.placeholder": { es: "Escribe tu consulta...", en: "Type your question..." },
  "chat.buy": { es: "Quiero comprar", en: "I want to buy" },
  "chat.sell": { es: "Quiero vender", en: "I want to sell" },
  "chat.premium": { es: "¿Qué es el buyer premium?", en: "What is buyer premium?" },
  "chat.first_lot": { es: "Cómo registrar mi primer lote", en: "How to register my first lot" },
  "chat.support": { es: "Hablar con soporte", en: "Talk to support" },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "es",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  const t = (key: string): string => {
    return translations[key]?.[lang] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
