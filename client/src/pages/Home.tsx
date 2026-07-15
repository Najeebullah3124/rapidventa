import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { LotCard } from "@/components/LotCard";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import {
  ShieldCheck, BadgePercent, Headphones,
  TrendingUp, Users, Globe, DollarSign,
  ChevronRight, Award
} from "lucide-react";

const categoryData = [
  {
    key: "cat.art",
    label: "Arte",
    lots: 32,
    image: "/manus-storage/rv-lot-art_b318fc6b.jpg",
    href: "/catalog?cat=Arte",
    soon: false,
  },
  {
    key: "cat.watches",
    label: "Relojes",
    lots: 48,
    image: "/manus-storage/rv-lot-watch_160166ab.jpg",
    href: "/catalog?cat=Relojes",
    soon: false,
  },
  {
    key: "cat.sports",
    label: "Deportes",
    lots: 60,
    image: "/manus-storage/rv-lot-sports_51a583e1.jpg",
    href: "/catalog?cat=Deportes",
    soon: false,
  },
  {
    key: "cat.collectibles",
    label: "Coleccionables",
    lots: 85,
    image: "/manus-storage/rv-lot-art_b318fc6b.jpg",
    href: "/catalog?cat=Coleccionables",
    soon: false,
  },
  {
    key: "cat.jewelry",
    label: "Joyería",
    lots: 0,
    image: "/manus-storage/rv-lot-watch_160166ab.jpg",
    href: "#",
    soon: true,
  },
  {
    key: "cat.cars",
    label: "Automóviles",
    lots: 0,
    image: "/manus-storage/rv-lot-sports_51a583e1.jpg",
    href: "#",
    soon: true,
  },
];

const stats = [
  { icon: TrendingUp, value: "12,450+", key: "stats.lots" },
  { icon: Users, value: "38,200+", key: "stats.buyers" },
  { icon: Globe, value: "47", key: "stats.countries" },
  { icon: DollarSign, value: "$284M+", key: "stats.value" },
];

const trustItems = [
  {
    icon: ShieldCheck,
    titleKey: "trust.expert.title",
    descKey: "trust.expert.desc",
  },
  {
    icon: BadgePercent,
    titleKey: "trust.buyer.title",
    descKey: "trust.buyer.desc",
  },
  {
    icon: Headphones,
    titleKey: "trust.support.title",
    descKey: "trust.support.desc",
  },
];

const featuredTabs = ["Todos", "Relojes", "Arte", "Deportes", "Coleccionables"];

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  let { user, loading: authLoading, isAuthenticated } = useAuth();

  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState("Todos");

  // Datos reales desde el backend
  const { data: liveLotsData } = trpc.lots.list.useQuery({ status: "live", limit: 8 });
  const { data: allLotsData } = trpc.lots.list.useQuery({ limit: 12 });
  const { data: categoriesData } = trpc.catalog.categories.useQuery();

  // Función helper para mapear lote del backend al tipo Lot del frontend
  const mapLot = (r: any, forceStatus?: "LIVE" | "UPCOMING" | "ENDED") => ({
    id: String(r.lot.id),
    slug: r.lot.lotNumber,
    lotNumber: r.lot.lotNumber,
    title: r.lot.titleEs,
    titleEn: r.lot.titleEn ?? r.lot.titleEs,
    category: (r.category?.nameEs ?? "Arte") as any,
    status: forceStatus ?? (r.lot.status === "live" ? "LIVE" : r.lot.status === "upcoming" ? "UPCOMING" : "ENDED") as any,
    currentBid: Number(r.lot.currentBid ?? r.lot.startingBid),
    estimateLow: Number(r.lot.estimateLow ?? 0),
    estimateHigh: Number(r.lot.estimateHigh ?? 0),
    buyerPremium: 20,
    bidCount: r.lot.bidCount ?? 0,
    image: (() => { try { return JSON.parse(r.lot.imageUrls ?? "[]")?.[0] ?? "/manus-storage/rv-lot-art_b318fc6b.jpg"; } catch { return "/manus-storage/rv-lot-art_b318fc6b.jpg"; } })(),
    seller: r.seller?.name ?? "Vendedor",
    sellerInitials: (r.seller?.name ?? "V").slice(0, 2).toUpperCase(),
    endsAt: new Date(r.lot.updatedAt ?? Date.now()),
    description: r.lot.descriptionEs ?? "",
    descriptionEn: r.lot.descriptionEn ?? "",
    certified: Boolean(r.lot.isCertified),
    isFeatured: r.lot.isFeatured,
  });

  const liveLots = (liveLotsData ?? []).map((r: any) => mapLot(r, "LIVE"));
  const allLots = (allLotsData ?? []).map((r: any) => mapLot(r));

  const filteredLots = activeTab === "Todos"
    ? allLots
    : allLots.filter((l) => l.category === activeTab);

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section
        className="relative min-h-[90vh] flex items-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, oklch(0.18 0.10 265) 0%, oklch(0.25 0.12 265) 60%, oklch(0.30 0.10 265) 100%)`,
        }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/manus-storage/rv-hero-bg_6b198f54.jpg')` }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-[oklch(0.18_0.10_265)]/80" />

        {/* Decorative gold line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[oklch(0.72_0.14_72)] to-transparent" />

        <div className="relative container py-16 sm:py-20 lg:py-32">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <div className="rv-gold-line" />
              <span className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em]">
                {t("hero.eyebrow")}
              </span>
            </div>

            {/* Title */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 rv-fade-up"
              style={{ fontFamily: "'Playfair Display', serif", animationDelay: "0.1s" }}
            >
              {t("hero.title")}
            </h1>

            {/* Subtitle */}
            <p
              className="text-white/70 text-lg leading-relaxed mb-8 rv-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              {t("hero.subtitle")}
            </p>

            {/* Trust bullets */}
            <div className="flex flex-wrap gap-4 mb-10 rv-fade-up" style={{ animationDelay: "0.3s" }}>
              {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3")].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[oklch(0.72_0.14_72)] flex-shrink-0" />
                  <span className="text-white/80 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 rv-fade-up" style={{ animationDelay: "0.4s" }}>
              <Link href="/catalog">
                <button className="rv-btn-primary text-base px-8 py-3">
                  {t("hero.cta1")}
                </button>
              </Link>
              <Link href="/sell">
                <button className="rv-btn-outline text-base px-8 py-3">
                  {t("hero.cta2")}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {stats.map((stat) => (
              <div key={stat.key} className="flex flex-col items-center py-8 px-4 text-center">
                <stat.icon className="w-5 h-5 text-[oklch(0.72_0.14_72)] mb-2" />
                <span className="text-2xl font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {stat.value}
                </span>
                <span className="text-xs text-gray-500 mt-1">{t(stat.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE AUCTIONS CAROUSEL ── */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2 h-2 bg-red-600 rounded-full rv-live-dot" />
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">En vivo ahora</span>
              </div>
              <h2 className="rv-section-title text-3xl">{t("section.live")}</h2>
              <p className="text-gray-500 mt-1 text-sm">{t("section.live.sub")}</p>
            </div>
            <Link href="/auctions">
              <button className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[oklch(0.25_0.12_265)] hover:text-[oklch(0.72_0.14_72)] transition-colors">
                Ver todas
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Carousel */}
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
            {liveLots.map((lot) => (
              <div key={lot.id} className="snap-start flex-shrink-0 w-72 md:w-auto">
                <LotCard lot={lot} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-16 bg-[oklch(0.97_0.008_220)]">
        <div className="container">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="rv-gold-line" />
              <h2 className="rv-section-title text-3xl">{t("section.categories")}</h2>
              <div className="rv-gold-line" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryData.map((cat) => (
              <Link key={cat.key} href={cat.soon ? "#" : cat.href}>
                <div className={`group relative rounded-xl overflow-hidden aspect-square rv-card-shadow ${cat.soon ? "opacity-60" : ""}`}>
                  <img
                    src={cat.image}
                    alt={t(cat.key) || cat.label}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.08_265)]/80 to-transparent" />
                  {cat.soon && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[0.6rem] font-bold bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)] px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        {t("cat.soon")}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {t(cat.key) || cat.label}
                    </p>
                    {!cat.soon && (
                      <p className="text-white/60 text-[0.65rem]">{cat.lots} lotes</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED LOTS ── */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-[oklch(0.72_0.14_72)]" />
                <span className="text-xs font-semibold text-[oklch(0.72_0.14_72)] uppercase tracking-wider">Selección premium</span>
              </div>
              <h2 className="rv-section-title text-3xl">{t("section.featured")}</h2>
            </div>
            {/* Tabs */}
            <div className="flex flex-wrap gap-1">
              {featuredTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                    activeTab === tab
                      ? "bg-[oklch(0.25_0.12_265)] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab === "Todos" ? (lang === "es" ? "Todos" : "All") : (lang === "en" ? tab : tab)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredLots.slice(0, 8).map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/catalog">
              <button className="rv-btn-primary px-10 py-3 text-base">
                {lang === "es" ? "Ver catálogo completo" : "View Full Catalog"}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <section className="py-16 bg-[oklch(0.97_0.008_220)]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustItems.map((item) => (
              <div key={item.titleKey} className="flex flex-col items-center text-center p-6">
                <div className="w-14 h-14 rounded-full bg-[oklch(0.25_0.12_265)] flex items-center justify-center mb-4">
                  <item.icon className="w-7 h-7 text-[oklch(0.72_0.14_72)]" />
                </div>
                <div className="rv-gold-line mx-auto mb-4" />
                <h3 className="font-bold text-[oklch(0.25_0.12_265)] text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {t(item.titleKey)}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 bg-[oklch(0.25_0.12_265)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[oklch(0.72_0.14_72)] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[oklch(0.72_0.14_72)] translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative container text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="rv-gold-line" />
            <span className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em]">Para vendedores</span>
            <div className="rv-gold-line" />
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("section.cta.title")}
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
            {t("section.cta.sub")}
          </p>
          <Link href="/sell">
            <button className="rv-btn-primary text-base px-10 py-3.5">
              {t("section.cta.btn")}
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
