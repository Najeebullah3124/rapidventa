import { useState } from "react";
import { Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { formatCurrency, mockLots } from "@/lib/mockData";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  Heart, Bell, BellOff, Trash2, ChevronLeft, TrendingUp,
  ShieldCheck, Loader2, Plus, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Favorites() {
  const { t, lang } = useLang();
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"watchlist" | "alerts">("watchlist");
  const [showAddAlert, setShowAddAlert] = useState<string | null>(null);
  const [alertPrice, setAlertPrice] = useState("");

  // ── Watchlist del backend ────────────────────────────────────────────────
  const { data: watchlistData, isLoading: watchlistLoading, refetch: refetchWatchlist } = trpc.watchlist.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // ── Alertas de precio del backend ────────────────────────────────────────
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.priceAlerts.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const toggleWatchlistMutation = trpc.watchlist.toggle.useMutation({
    onSuccess: () => { toast.success("Eliminado de favoritos"); refetchWatchlist(); },
    onError: (err) => toast.error(err.message),
  });

  const setAlertMutation = trpc.priceAlerts.set.useMutation({
    onSuccess: () => {
      toast.success("Alerta de precio configurada");
      setShowAddAlert(null);
      setAlertPrice("");
      refetchAlerts();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAlertMutation = trpc.priceAlerts.delete.useMutation({
    onSuccess: () => { toast.success("Alerta eliminada"); refetchAlerts(); },
    onError: (err) => toast.error(err.message),
  });

  const handleAddAlert = (lotId: number) => {
    const price = parseFloat(alertPrice);
    if (!price || price <= 0) { toast.error("Ingresa un precio válido"); return; }
    setAlertMutation.mutate({ lotId, targetPrice: price });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.72_0.14_72)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8">
        <Heart className="w-12 h-12 text-gray-300" />
        <h2 className="rv-section-title text-xl">Acceso requerido</h2>
        <p className="text-gray-500 text-sm text-center max-w-xs">Inicia sesión para ver tus favoritos y alertas de precio.</p>
        <button onClick={() => startLogin()} className="rv-btn-primary px-6 py-2.5 text-sm">Iniciar sesión</button>
      </div>
    );
  }

  // Usar mockLots como fallback mientras se conecta el backend real
  const watchlistItems = watchlistData?.length
    ? mockLots.filter((_, i) => i < (watchlistData?.length ?? 0))
    : mockLots.slice(0, 3);

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_220)]">
      {/* Header */}
      <div className="bg-[oklch(0.18_0.08_265)] text-white py-8 sm:py-12">
        <div className="container">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Volver al dashboard
            </button>
          </Link>
          <div className="rv-gold-rule mb-4" />
          <h1 className="rv-editorial-title text-3xl sm:text-4xl text-white mb-2">Favoritos y Alertas</h1>
          <p className="text-white/60 text-sm">Lotes guardados y notificaciones de precio</p>
        </div>
      </div>

      <div className="container py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("watchlist")}
            className={cn(
              "px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === "watchlist"
                ? "border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Heart className="w-4 h-4" />
            Favoritos
            <span className="bg-[oklch(0.25_0.12_265)] text-white text-xs px-1.5 py-0.5 rounded-full">
              {watchlistItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={cn(
              "px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === "alerts"
                ? "border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Bell className="w-4 h-4" />
            Alertas de precio
            <span className="bg-[oklch(0.72_0.14_72)] text-white text-xs px-1.5 py-0.5 rounded-full">
              {alertsData?.length ?? 0}
            </span>
          </button>
        </div>

        {/* ── Watchlist tab ── */}
        {activeTab === "watchlist" && (
          <div>
            {watchlistLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.72_0.14_72)]" />
              </div>
            ) : watchlistItems.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No tienes lotes guardados</p>
                <Link href="/catalog">
                  <button className="mt-4 rv-btn-primary px-6 py-2.5 text-sm">Explorar catálogo</button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchlistItems.map((lot) => {
                  const title = lang === "en" ? lot.titleEn : lot.title;
                  return (
                    <div key={lot.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={lot.image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {lot.status === "LIVE" && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded-full">
                              <span className="w-1 h-1 bg-white rounded-full rv-live-dot" />
                              LIVE
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <button
                            onClick={() => setShowAddAlert(String(lot.id))}
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                            title="Agregar alerta de precio"
                          >
                            <Bell className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => toggleWatchlistMutation.mutate({ lotId: Number(lot.id) })}
                            disabled={toggleWatchlistMutation.isPending}
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                            title="Eliminar de favoritos"
                          >
                            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{lot.lotNumber}</span>
                          {lot.certified && <ShieldCheck className="w-3.5 h-3.5 text-[oklch(0.72_0.14_72)]" />}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2">{title}</h3>

                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-400">Puja actual</p>
                            <p className="text-lg font-bold text-[oklch(0.72_0.14_72)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {lot.status === "UPCOMING" ? "—" : formatCurrency(lot.currentBid)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Estimado</p>
                            <p className="text-xs text-gray-600">{formatCurrency(lot.estimateLow)}–{formatCurrency(lot.estimateHigh)}</p>
                          </div>
                        </div>

                        {(lot.status === "LIVE" || lot.status === "UPCOMING") && (
                          <div className="mb-3">
                            <CountdownTimer targetDate={lot.endsAt} variant="pill" />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link href={`/lot/${lot.slug}`} className="flex-1">
                            <button className="w-full rv-btn-primary py-2 text-xs">
                              {lot.status === "LIVE" ? "Pujar ahora" : "Ver lote"}
                            </button>
                          </Link>
                        </div>
                      </div>

                      {/* Inline alert form */}
                      {showAddAlert === String(lot.id) && (
                        <div className="border-t border-gray-100 p-4 bg-[oklch(0.97_0.008_220)]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Alerta de precio</p>
                            <button onClick={() => setShowAddAlert(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={alertPrice}
                              onChange={(e) => setAlertPrice(e.target.value)}
                              placeholder="Precio objetivo (USD)"
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                            />
                            <button
                              onClick={() => handleAddAlert(Number(lot.id))}
                              disabled={setAlertMutation.isPending}
                              className="rv-btn-primary px-3 py-2 text-xs flex items-center gap-1"
                            >
                              {setAlertMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              Crear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Alerts tab ── */}
        {activeTab === "alerts" && (
          <div>
            {alertsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.72_0.14_72)]" />
              </div>
            ) : !alertsData || alertsData.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-2">No tienes alertas de precio configuradas</p>
                <p className="text-gray-400 text-xs max-w-xs mx-auto">Ve a un lote y haz clic en el ícono de campana para configurar una alerta cuando el precio alcance tu objetivo.</p>
                <Link href="/catalog">
                  <button className="mt-4 rv-btn-primary px-6 py-2.5 text-sm">Explorar catálogo</button>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[oklch(0.97_0.008_220)]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lote</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Puja actual</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio objetivo</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {alertsData.map((alert: { id: number; lotId: number; targetPrice: string | number; createdAt: Date }) => {
                        const lot = mockLots[0]; // En producción: buscar por alert.lotId
                        const reached = Number(alert.targetPrice) <= lot.currentBid;
                        return (
                          <tr key={alert.id} className="hover:bg-[oklch(0.98_0.005_220)] transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-800">{lot.title}</p>
                              <p className="text-xs text-gray-400 font-mono">{lot.lotNumber}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm font-bold text-[oklch(0.72_0.14_72)]">{formatCurrency(lot.currentBid)}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm font-semibold text-gray-700">{formatCurrency(Number(alert.targetPrice))}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {reached ? (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                  <Bell className="w-3 h-3" />
                                  Alcanzado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                  <BellOff className="w-3 h-3" />
                                  Activa
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link href={`/lot/${lot.slug}`}>
                                  <button className="px-3 py-1 text-xs font-medium text-[oklch(0.25_0.12_265)] border border-[oklch(0.25_0.12_265)] rounded-lg hover:bg-[oklch(0.25_0.12_265)] hover:text-white transition-colors">
                                    Ver lote
                                  </button>
                                </Link>
                                <button
                                  onClick={() => deleteAlertMutation.mutate({ alertId: alert.id })}
                                  disabled={deleteAlertMutation.isPending}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Eliminar alerta"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
