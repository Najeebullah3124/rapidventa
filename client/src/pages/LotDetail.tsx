import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { CountdownTimer } from "@/components/CountdownTimer";
import { mockLots, mockBidHistory, formatCurrency } from "@/lib/mockData";
import { ShieldCheck, Heart, Share2, ChevronLeft, AlertCircle, CheckCircle, TrendingUp, Bell, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const tabs = ["lot.description", "lot.provenance", "lot.condition", "lot.history", "lot.shipping"];

export default function LotDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLang();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("lot.description");
  const [bidAmount, setBidAmount] = useState("");
  const [maxBid, setMaxBid] = useState("");
  const [useProxy, setUseProxy] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");

  const lot = mockLots.find((l) => l.slug === slug) || mockLots[0];
  const title = lang === "en" ? lot.titleEn : lot.title;
  const description = lang === "en" ? lot.descriptionEn : lot.description;

  // ── Polling de estado del lote cada 10 segundos ──────────────────────────
  const { data: liveStatus } = trpc.lotPolling.status.useQuery(
    { lotId: 1 }, // En producción vendría del slug/id real
    { refetchInterval: 10_000, enabled: lot.status === "LIVE" }
  );

  const currentBid = liveStatus?.currentBid ? Number(liveStatus.currentBid) : lot.currentBid;
  const bidCount = liveStatus?.bidCount ?? lot.bidCount;
  const nextMin = currentBid + 500;
  const premium = currentBid * (lot.buyerPremium / 100);
  const total = currentBid + premium;

  // ── Detectar si el usuario va ganando o fue superado (estado local) ────────
  const [bidStatus, setBidStatus] = useState<"none" | "winning" | "outbid">("none");
  const isWinning = bidStatus === "winning";
  const isOutbid = bidStatus === "outbid";

  // ── Registro en subasta ──────────────────────────────────────────────────
  const registerMutation = trpc.auctionRegistrations.register.useMutation({
    onSuccess: () => toast.success("¡Registro en subasta confirmado! Puedes pujar cuando comience."),
    onError: (err) => toast.error(err.message),
  });

  // ── Puja real al backend ─────────────────────────────────────────────────
  const placeBidMutation = trpc.bids.place.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Puja de ${formatCurrency(data.amount)} registrada exitosamente!`);
      setBidAmount("");
      setMaxBid("");
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Watchlist ────────────────────────────────────────────────────────────
  const toggleWatchlistMutation = trpc.watchlist.toggle.useMutation({
    onSuccess: (data) => {
      setWishlist(data.action === "added");
      toast.success(data.action === "added" ? "Añadido a favoritos" : "Eliminado de favoritos");
    },
    onError: () => toast.error("Error al actualizar favoritos"),
  });

  // ── Alerta de precio ─────────────────────────────────────────────────────
  const setAlertMutation = trpc.priceAlerts.set.useMutation({
    onSuccess: () => {
      toast.success("Alerta de precio configurada");
      setShowAlertModal(false);
      setAlertPrice("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleBid = () => {
    if (!isAuthenticated) { startLogin(); return; }
    const amount = parseFloat(bidAmount);
    if (!amount || amount < nextMin) {
      toast.error(`Puja mínima requerida: ${formatCurrency(nextMin)}`);
      return;
    }
    placeBidMutation.mutate({
      lotId: 1,
      amount,
      maxAutoBid: useProxy && maxBid ? parseFloat(maxBid) : undefined,
    });
  };

  const handleRegister = () => {
    if (!isAuthenticated) { startLogin(); return; }
    registerMutation.mutate({ auctionId: 1 });
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) { startLogin(); return; }
    toggleWatchlistMutation.mutate({ lotId: 1 });
  };

  const handleSetAlert = () => {
    if (!isAuthenticated) { startLogin(); return; }
    const price = parseFloat(alertPrice);
    if (!price || price <= 0) { toast.error("Ingresa un precio válido"); return; }
    setAlertMutation.mutate({ lotId: 1, targetPrice: price });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-[oklch(0.97_0.008_220)] border-b border-gray-200 py-3">
        <div className="container flex items-center gap-2 text-sm text-gray-500">
          <Link href="/"><span className="hover:text-[oklch(0.25_0.12_265)] cursor-pointer">Inicio</span></Link>
          <span>/</span>
          <Link href="/catalog"><span className="hover:text-[oklch(0.25_0.12_265)] cursor-pointer">{t("catalog.title")}</span></Link>
          <span>/</span>
          <span className="text-[oklch(0.25_0.12_265)] font-medium truncate max-w-xs">{title}</span>
        </div>
      </div>

      <div className="container py-5 sm:py-8">
        <Link href="/catalog">
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[oklch(0.25_0.12_265)] mb-4 sm:mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Volver al catálogo
          </button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* ── LEFT: Gallery ── */}
          <div>
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 mb-3">
              <img src={lot.image} alt={title} className="w-full h-full object-cover" />
              {lot.status === "LIVE" && (
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full rv-live-dot" />
                    LIVE
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={handleToggleWishlist}
                  disabled={toggleWatchlistMutation.isPending}
                  className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                >
                  <Heart className={cn("w-4 h-4", wishlist ? "fill-red-500 text-red-500" : "text-gray-600")} />
                </button>
                <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                  <Share2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                  title="Configurar alerta de precio"
                >
                  <Bell className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[lot.image, lot.image, lot.image].map((img, i) => (
                <div key={i} className={cn("w-20 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors flex-shrink-0", i === 0 ? "border-[oklch(0.72_0.14_72)]" : "border-transparent hover:border-gray-300")}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Bid Panel ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono text-gray-400">{t("lot.number")} {lot.lotNumber}</span>
                <span className="text-xs bg-[oklch(0.94_0.015_220)] text-[oklch(0.25_0.12_265)] px-2 py-0.5 rounded-full font-medium">
                  {lot.category}
                </span>
                {lot.certified && (
                  <span className="flex items-center gap-1 text-xs text-[oklch(0.72_0.14_72)]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Certificado
                  </span>
                )}
              </div>
              <h1 className="rv-section-title text-2xl leading-tight mb-1">{title}</h1>
              <p className="text-sm text-gray-500">{t("lot.seller")}: <span className="font-medium text-gray-700">{lot.seller}</span></p>
            </div>

            {/* Status alerts */}
            {isWinning && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-green-700">{t("lot.winning")} — Vas ganando esta puja</p>
              </div>
            )}
            {isOutbid && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-700">Has sido superado — sube tu puja</p>
              </div>
            )}

            {/* Price card */}
            <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-5 mb-5">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{t("lot.current")}</p>
                  <p className="text-3xl font-bold text-[oklch(0.72_0.14_72)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {lot.status === "UPCOMING" ? "—" : formatCurrency(currentBid)}
                  </p>
                  {liveStatus && (
                    <p className="text-[0.65rem] text-gray-400 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                      Actualizado en vivo
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{t("lot.estimate")}</p>
                  <p className="text-sm text-gray-600 font-medium">
                    {formatCurrency(lot.estimateLow)} – {formatCurrency(lot.estimateHigh)}
                  </p>
                </div>
              </div>

              {/* Buyer premium breakdown */}
              <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-3">
                <span className="text-gray-500">{t("lot.premium")} ({lot.buyerPremium}%)</span>
                <span className="font-semibold text-gray-700">{formatCurrency(premium)}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500 font-semibold">Total estimado</span>
                <span className="font-bold text-[oklch(0.25_0.12_265)]">{formatCurrency(total)}</span>
              </div>

              {/* Countdown + soft close notice */}
              {(lot.status === "LIVE" || lot.status === "UPCOMING") && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    {lot.status === "LIVE" ? "Cierra en" : "Comienza en"}
                  </p>
                  <CountdownTimer targetDate={lot.endsAt} variant="boxes" />
                  {/* Soft close notice */}
                  {lot.status === "LIVE" && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        <span className="font-semibold">Soft close activo:</span> si se recibe una puja en los últimos 5 minutos, el tiempo se extiende automáticamente 5 minutos adicionales.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bid form */}
            {lot.status === "LIVE" && (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                    {t("lot.nextmin")}: <span className="text-[oklch(0.72_0.14_72)]">{formatCurrency(nextMin)}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={String(nextMin)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                    />
                    <button
                      onClick={handleBid}
                      disabled={placeBidMutation.isPending}
                      className="rv-btn-primary px-5 py-2.5 text-sm whitespace-nowrap flex items-center gap-2"
                    >
                      {placeBidMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {t("lot.place")}
                    </button>
                  </div>
                </div>

                {/* Proxy bid */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={useProxy}
                      onChange={(e) => setUseProxy(e.target.checked)}
                      className="w-4 h-4 accent-[oklch(0.72_0.14_72)]"
                    />
                    <span className="text-sm text-gray-700">{t("lot.maxbid")}</span>
                  </label>
                  {useProxy && (
                    <div>
                      <input
                        type="number"
                        value={maxBid}
                        onChange={(e) => setMaxBid(e.target.value)}
                        placeholder="Puja máxima automática"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                      />
                      <p className="text-xs text-gray-400 mt-1">El sistema pujará automáticamente hasta este límite en tu nombre.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {lot.status === "UPCOMING" && (
              <button
                onClick={handleRegister}
                disabled={registerMutation.isPending}
                className="w-full rv-btn-primary py-3 text-sm mb-3 flex items-center justify-center gap-2"
              >
                {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {registerMutation.isSuccess ? "✓ Registrado en esta subasta" : t("lot.register_auction")}
              </button>
            )}

            {lot.status === "ENDED" && (
              <div className="bg-gray-50 rounded-xl p-4 text-center mb-4">
                <p className="text-sm font-semibold text-gray-600">Subasta finalizada</p>
                <p className="text-2xl font-bold text-[oklch(0.25_0.12_265)] mt-1">{formatCurrency(currentBid)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Precio de martillo final</p>
              </div>
            )}

            {/* Bid count */}
            {lot.status !== "UPCOMING" && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <TrendingUp className="w-3.5 h-3.5" />
                {bidCount} pujas registradas
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="mt-8 sm:mt-12 border-t border-gray-100 pt-6 sm:pt-8">
          <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab
                    ? "border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {t(tab)}
              </button>
            ))}
          </div>

          <div className="max-w-2xl">
            {activeTab === "lot.description" && <p className="text-gray-700 leading-relaxed">{description}</p>}
            {activeTab === "lot.provenance" && <p className="text-gray-700 leading-relaxed">Colección privada, adquirida directamente del artista en 1998. Incluye documentación de procedencia completa.</p>}
            {activeTab === "lot.condition" && <p className="text-gray-700 leading-relaxed">Excelente estado de conservación. Sin restauraciones previas. Certificado de autenticidad incluido.</p>}
            {activeTab === "lot.history" && (
              <div className="space-y-3">
                {mockBidHistory.map((bid, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[oklch(0.25_0.12_265)] flex items-center justify-center text-white text-[0.65rem] font-bold">
                        {bid.user[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{bid.user}</p>
                        <p className="text-xs text-gray-400">{bid.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[oklch(0.72_0.14_72)]">{formatCurrency(bid.amount)}</p>
                      {bid.winning && <p className="text-[0.65rem] text-green-600 font-medium">Puja ganadora</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "lot.shipping" && <p className="text-gray-700 leading-relaxed">El envío se coordina directamente con el comprador ganador. Embalaje profesional incluido. Seguro de transporte disponible. Entrega internacional disponible.</p>}
          </div>
        </div>
      </div>

      {/* ── Modal: Alerta de precio ── */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="rv-section-title text-lg mb-1">Alerta de precio</h3>
            <p className="text-sm text-gray-500 mb-4">Te notificaremos cuando la puja actual alcance o supere tu precio objetivo.</p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Precio objetivo (USD)</label>
              <input
                type="number"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder={String(currentBid + 1000)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAlertModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSetAlert}
                disabled={setAlertMutation.isPending}
                className="flex-1 rv-btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {setAlertMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Configurar alerta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
