import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { mockAuctions, formatCurrency } from "@/lib/mockData";
import { Link } from "wouter";
import { Calendar, Package, BadgePercent, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tabKeys = ["auctions.live", "auctions.upcoming", "auctions.ended"] as const;
type TabKey = typeof tabKeys[number];
const statusMap: Record<TabKey, string> = {
  "auctions.live": "LIVE",
  "auctions.upcoming": "UPCOMING",
  "auctions.ended": "ENDED",
};

export default function Auctions() {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState<TabKey>("auctions.live");

  const filtered = mockAuctions.filter((a) => a.status === statusMap[activeTab]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[oklch(0.25_0.12_265)] py-10 sm:py-16">
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <div className="rv-gold-line" />
            <span className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em]">
              {lang === "es" ? "Plataforma de subastas" : "Auction Platform"}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            {lang === "es" ? "Subastas RapidVenta" : "RapidVenta Auctions"}
          </h1>
          <p className="text-white/60 mt-2">
            {lang === "es" ? "Explora todas nuestras subastas activas, próximas y finalizadas." : "Explore all our active, upcoming and ended auctions."}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100 mb-6 sm:mb-8 overflow-x-auto">
          {tabKeys.map((tab) => {
            const count = mockAuctions.filter((a) => a.status === statusMap[tab]).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab
                    ? "border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {t(tab)}
                <span className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded-full",
                  activeTab === tab
                    ? "bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)]"
                    : "bg-gray-100 text-gray-500"
                )}>
                  {count}
                </span>
                {tab === "auctions.live" && count > 0 && (
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full rv-live-dot" />
                )}
              </button>
            );
          })}
        </div>

        {/* Auction cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No hay subastas en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((auction) => (
              <div key={auction.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden rv-card-shadow group">
                {/* Hero image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={auction.heroImage}
                    alt={lang === "en" ? auction.titleEn : auction.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {auction.status === "LIVE" && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-white rounded-full rv-live-dot" />
                        LIVE
                      </span>
                    </div>
                  )}
                  {auction.status === "UPCOMING" && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        PRÓXIMO
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-[oklch(0.25_0.12_265)] text-lg leading-snug mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {lang === "en" ? auction.titleEn : auction.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-[oklch(0.72_0.14_72)]" />
                      <div>
                        <p className="text-[0.65rem] text-gray-400 uppercase tracking-wide">
                          {auction.status === "UPCOMING" ? "Inicio" : "Cierre"}
                        </p>
                        <p className="text-xs font-medium">
                          {formatDate(auction.status === "UPCOMING" ? auction.startDate : auction.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4 text-[oklch(0.72_0.14_72)]" />
                      <div>
                        <p className="text-[0.65rem] text-gray-400 uppercase tracking-wide">Lotes</p>
                        <p className="text-xs font-medium">{auction.lotCount} lotes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                      <BadgePercent className="w-4 h-4 text-[oklch(0.72_0.14_72)]" />
                      <div>
                        <p className="text-[0.65rem] text-gray-400 uppercase tracking-wide">{t("lot.premium")}</p>
                        <p className="text-xs font-medium">{auction.buyerPremium}% sobre precio de martillo</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {auction.status === "LIVE" || auction.status === "ENDED" ? (
                      <Link href="/catalog">
                        <button className="flex-1 rv-btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5">
                          {t("auctions.view")}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    ) : (
                      <button className="flex-1 rv-btn-primary py-2.5 text-sm">
                        {t("auctions.register")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
