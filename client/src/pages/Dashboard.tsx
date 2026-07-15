import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { mockLots, formatCurrency } from "@/lib/mockData";
import { CountdownTimer } from "@/components/CountdownTimer";
import { LotCard } from "@/components/LotCard";
import { TrendingUp, Trophy, Heart, FileText, Bell, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardKpiSkeleton, TableRowSkeleton } from "@/components/SkeletonCard";
import { trpc } from "@/lib/trpc";

const kpis = [
  { icon: TrendingUp, key: "dash.active_bids", value: "3", label: "Pujas activas" },
  { icon: Trophy, key: "dash.won", value: "7", label: "Lotes ganados" },
  { icon: Heart, key: "dash.favorites", value: "12", label: "Favoritos" },
  { icon: FileText, key: "dash.invoices", value: "5", label: "Facturas" },
];

const tabs = ["dash.active_bids", "dash.favorites", "dash.invoices", "dash.alerts"];
const tabLabels: Record<string, string> = {
  "dash.active_bids": "Pujas activas",
  "dash.favorites": "Favoritos",
  "dash.invoices": "Facturas",
  "dash.alerts": "Alertas de precio",
};

const mockInvoices = [
  { id: "FAC-001", lot: "Patek Philippe Nautilus 5711", hammer: 95000, premium: 19000, total: 114000, date: "2024-06-15", status: "Pagado" },
  { id: "FAC-002", lot: "Óleo abstracto — Torres García", hammer: 18500, premium: 3700, total: 22200, date: "2024-05-28", status: "Pendiente" },
];

export default function Dashboard() {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState("dash.active_bids");

  // Fetch real data from backend
  const { data: myBids, isLoading: bidsLoading } = trpc.bids.myBids.useQuery();
  const { data: myWatchlist, isLoading: watchlistLoading } = trpc.watchlist.list.useQuery();
  const { data: myOrders, isLoading: ordersLoading } = trpc.orders.myOrders.useQuery({ role: "buyer" });
  const { data: myAlerts, isLoading: alertsLoading } = trpc.priceAlerts.list.useQuery();

  const isLoading = bidsLoading || watchlistLoading || ordersLoading;

  const liveLots = mockLots.filter((l) => l.status === "LIVE" || l.status === "WINNING" || l.status === "OUTBID");
  const favLots = mockLots.slice(0, 4);

  const kpiValues = {
    activeBids: myBids?.filter(b => b.bid.status === "active")?.length ?? kpis[0].value,
    won: myOrders?.length ?? kpis[1].value,
    favorites: myWatchlist?.length ?? kpis[2].value,
    invoices: myOrders?.length ?? kpis[3].value,
  };

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.008_220)]">
      {/* Header */}
      <div className="bg-[oklch(0.25_0.12_265)] py-12">
        <div className="container">
          <p className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            Mi cuenta
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[oklch(0.72_0.14_72)] flex items-center justify-center text-[oklch(0.18_0.08_265)] font-bold text-lg flex-shrink-0">
              JG
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Juan García
              </h1>
              <p className="text-white/60 text-sm mt-0.5">Comprador verificado · Miembro desde 2023</p>
            </div>
          </div>
          <span className="rv-rule-wide mt-4" />
        </div>
      </div>

      <div className="container py-5 sm:py-8">
        {/* KPI Grid */}
        {isLoading ? (
          <DashboardKpiSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { icon: TrendingUp, value: String(kpiValues.activeBids), label: "Pujas activas" },
              { icon: Trophy, value: String(kpiValues.won), label: "Lotes ganados" },
              { icon: Heart, value: String(kpiValues.favorites), label: "Favoritos" },
              { icon: FileText, value: String(kpiValues.invoices), label: "Facturas" },
            ].map((kpi, i) => (
              <div key={i} className="rv-kpi-card">
                <kpi.icon className="w-5 h-5 text-[oklch(0.72_0.14_72)] mb-3" />
                <p className="text-2xl font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {kpi.value}
                </p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-medium">{kpi.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 pt-6 pb-0">
            <h2 className="rv-editorial-heading">Actividad de subasta</h2>
          </div>

          <div className="flex border-b border-gray-100 overflow-x-auto px-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab
                    ? "border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Active Bids */}
            {activeTab === "dash.active_bids" && (
              <div className="space-y-3">
                {liveLots.map((lot) => (
                  <div key={lot.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-[oklch(0.97_0.008_220)] rounded-lg rv-record-row">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img src={lot.image} alt={lot.title} className="w-14 h-11 object-cover rounded flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[oklch(0.25_0.12_265)] truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {lang === "en" ? lot.titleEn : lot.title}
                        </p>
                        <p className="text-[0.65rem] text-gray-400 font-mono mt-0.5">{lot.lotNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-bold text-[oklch(0.72_0.14_72)]">{formatCurrency(lot.currentBid)}</p>
                        {lot.status === "WINNING" && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-[0.6rem] text-green-600 font-bold uppercase tracking-wide">Ganando</span>
                          </div>
                        )}
                        {lot.status === "OUTBID" && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-[0.6rem] text-red-500 font-bold uppercase tracking-wide">Superado</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CountdownTimer targetDate={lot.endsAt} variant="pill" />
                        <button className="rv-btn-primary text-xs px-3 py-2 flex-shrink-0">
                          Pujar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Favorites */}
            {activeTab === "dash.favorites" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {favLots.map((lot) => (
                  <LotCard key={lot.id} lot={lot} />
                ))}
              </div>
            )}

            {/* Invoices */}
            {activeTab === "dash.invoices" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Factura</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Lote</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Martillo</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Premium</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Total</th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvoices.map((inv) => (
                      <tr key={inv.id} className="rv-record-row">
                        <td className="py-4 font-mono text-xs text-gray-400">{inv.id}</td>
                        <td className="py-4 px-3 font-semibold text-[oklch(0.25_0.12_265)] max-w-xs truncate text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {inv.lot}
                        </td>
                        <td className="py-4 px-3 text-right text-gray-600 text-sm">{formatCurrency(inv.hammer)}</td>
                        <td className="py-4 px-3 text-right text-gray-600 text-sm">{formatCurrency(inv.premium)}</td>
                        <td className="py-4 px-3 text-right font-bold text-[oklch(0.25_0.12_265)]">{formatCurrency(inv.total)}</td>
                        <td className="py-4 px-3 text-center">
                          <span className={cn(
                            "text-xs font-bold px-2.5 py-0.5 rounded-sm uppercase tracking-wide",
                            inv.status === "Pagado" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Alerts */}
            {activeTab === "dash.alerts" && (
              <div className="space-y-3">
                {mockLots.slice(0, 3).map((lot) => (
                  <div key={lot.id} className="flex items-center gap-4 p-4 bg-[oklch(0.97_0.008_220)] rounded-lg rv-record-row">
                    <Bell className="w-5 h-5 text-[oklch(0.72_0.14_72)] flex-shrink-0" />
                    <img src={lot.image} alt="" className="w-10 h-8 object-cover rounded flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {lang === "en" ? lot.titleEn : lot.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Alertar cuando supere <span className="font-bold text-[oklch(0.72_0.14_72)]">{formatCurrency(lot.currentBid + 5000)}</span>
                      </p>
                    </div>
                    <button className="text-xs font-semibold text-red-500 hover:text-red-700 uppercase tracking-wide">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
