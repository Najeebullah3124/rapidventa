import { useState } from "react";
import { Link } from "wouter";
import { mockLots, formatCurrency } from "@/lib/mockData";
import {
  Star, MapPin, Calendar, ShieldCheck, Award, Package,
  TrendingUp, Clock, ChevronRight, CheckCircle, ExternalLink,
  Gavel, BarChart2, MessageSquare, Flag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Mock profile data ──────────────────────────────────────────────────────────
const profiles = {
  seller: {
    id: "seller-galeria-sur",
    type: "seller" as const,
    name: "Galería Sur",
    handle: "@galeria-sur",
    avatar: "GS",
    avatarBg: "oklch(0.55 0.18 145)",
    location: "Buenos Aires, Argentina",
    joinedYear: 2019,
    verified: true,
    bio: "Casa de subastas especializada en arte latinoamericano contemporáneo y moderno. Más de 25 años en el mercado del arte, con presencia en Buenos Aires, Ciudad de México y Miami. Representamos artistas emergentes y consagrados de toda la región.",
    specialty: "Arte latinoamericano",
    website: "galeriasur.com",
    stats: {
      lotsTotal: 284,
      lotsSold: 261,
      gmv: 4200000,
      avgSaleRate: 91.9,
      avgPremium: 18.4,
      repeatBuyers: 67,
    },
    badges: [
      { label: "Vendedor Verificado", icon: ShieldCheck, color: "text-blue-600 bg-blue-50" },
      { label: "Top Seller 2023", icon: Award, color: "text-amber-600 bg-amber-50" },
      { label: "+250 lotes vendidos", icon: Package, color: "text-green-600 bg-green-50" },
    ],
    reviews: [
      { author: "Juan G.", rating: 5, date: "Jun 2024", text: "Excelente experiencia. La pieza llegó perfectamente embalada y el dictamen del experto fue muy detallado." },
      { author: "Ana M.", rating: 5, date: "May 2024", text: "Galería de confianza. Ya he comprado tres veces y siempre el proceso es transparente y profesional." },
      { author: "Carlos R.", rating: 4, date: "Abr 2024", text: "Buena comunicación durante todo el proceso. El envío tardó un poco más de lo esperado pero la pieza es impresionante." },
    ],
  },
  expert: {
    id: "expert-dr-martinez",
    type: "expert" as const,
    name: "Dr. Alejandro Martínez",
    handle: "@dr-martinez",
    avatar: "AM",
    avatarBg: "oklch(0.72 0.14 72)",
    location: "Ciudad de México, México",
    joinedYear: 2021,
    verified: true,
    bio: "Doctor en Historia del Arte por la UNAM con especialización en relojería de colección y arte moderno latinoamericano. Valuador certificado por la Asociación Internacional de Valuadores (ASA) y miembro del Consejo de Expertos de RapidVenta desde 2021.",
    specialty: "Relojería · Arte moderno",
    website: "—",
    stats: {
      lotsReviewed: 847,
      avgTurnaround: 1.8,
      approvalRate: 78.4,
      accuracy: 96.2,
      disputesWon: 12,
      certifications: 4,
    },
    badges: [
      { label: "Experto Certificado", icon: ShieldCheck, color: "text-blue-600 bg-blue-50" },
      { label: "ASA Valuador", icon: Award, color: "text-amber-600 bg-amber-50" },
      { label: "+800 revisiones", icon: CheckCircle, color: "text-green-600 bg-green-50" },
    ],
    reviews: [
      { author: "Galería Sur", rating: 5, date: "Jun 2024", text: "Dictamen muy completo y entregado en tiempo récord. El Dr. Martínez es el referente en relojería de la plataforma." },
      { author: "Arte Global S.A.", rating: 5, date: "May 2024", text: "Excelente criterio técnico. Su valuación fue clave para que el lote alcanzara el precio esperado." },
      { author: "Colección Privada", rating: 5, date: "Mar 2024", text: "Profesional, riguroso y muy comunicativo. Recomendado ampliamente." },
    ],
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("w-3.5 h-3.5", i <= rating ? "fill-[oklch(0.72_0.14_72)] text-[oklch(0.72_0.14_72)]" : "text-gray-200")}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: typeof profiles.seller.reviews[0] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[oklch(0.97_0.008_220)] flex items-center justify-center text-xs font-bold text-[oklch(0.25_0.12_265)]">
            {review.author[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-[oklch(0.25_0.12_265)]">{review.author}</p>
            <p className="text-xs text-gray-400">{review.date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">"{review.text}"</p>
    </div>
  );
}

// ── Seller Profile ─────────────────────────────────────────────────────────────
function SellerProfile({ profile }: { profile: typeof profiles.seller }) {
  const [activeTab, setActiveTab] = useState<"lots" | "reviews" | "stats">("lots");
  const lots = mockLots.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Lotes totales", value: profile.stats.lotsTotal.toLocaleString() },
          { label: "Lotes vendidos", value: profile.stats.lotsSold.toLocaleString() },
          { label: "GMV generado", value: `$${(profile.stats.gmv / 1000000).toFixed(1)}M` },
          { label: "Tasa de venta", value: `${profile.stats.avgSaleRate}%` },
          { label: "Premium promedio", value: `${profile.stats.avgPremium}%` },
          { label: "Compradores recurrentes", value: `${profile.stats.repeatBuyers}%` },
        ].map((s) => (
          <div key={s.label} className="rv-kpi-card text-center">
            <p className="text-xl font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
            <p className="text-[0.6rem] text-gray-400 mt-1 uppercase tracking-wide leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto">
          {(["lots", "reviews", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm font-semibold border-b-2 transition-colors",
                activeTab === tab
                  ? "border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              {tab === "lots" ? "Lotes" : tab === "reviews" ? "Valoraciones" : "Estadísticas"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "lots" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <Link key={lot.id} href={`/lot/${lot.id}`}>
              <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="relative overflow-hidden h-40">
                  <img src={lot.image} alt={lot.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 left-2">
                    {lot.status === "LIVE" && <span className="rv-badge-live"><span className="w-1.5 h-1.5 bg-white rounded-full rv-live-dot" />EN VIVO</span>}
                    {lot.status === "UPCOMING" && <span className="rv-badge-upcoming">PRÓXIMO</span>}
                    {lot.status === "ENDED" && <span className="rv-badge-ended">FINALIZADO</span>}
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm text-[oklch(0.25_0.12_265)] leading-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {lot.title}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">{lot.lotNumber} · {lot.category}</p>
                  <p className="text-sm font-bold text-[oklch(0.72_0.14_72)]">
                    {lot.status === "UPCOMING" ? `Est. ${formatCurrency(lot.estimateLow)}–${formatCurrency(lot.estimateHigh)}` : formatCurrency(lot.currentBid)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-center">
              <p className="text-4xl font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>4.9</p>
              <StarRating rating={5} />
              <p className="text-xs text-gray-400 mt-1">142 valoraciones</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-2">{star}</span>
                  <Star className="w-3 h-3 fill-[oklch(0.72_0.14_72)] text-[oklch(0.72_0.14_72)]" />
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[oklch(0.72_0.14_72)] h-1.5 rounded-full"
                      style={{ width: star === 5 ? "88%" : star === 4 ? "9%" : "2%" }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-6 text-right">
                    {star === 5 ? "125" : star === 4 ? "13" : star === 3 ? "3" : "1"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {profile.reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="rv-editorial-heading text-base mb-4">Rendimiento de ventas</h3>
            <div className="space-y-3">
              {[
                { label: "Tasa de venta promedio", value: `${profile.stats.avgSaleRate}%`, bar: profile.stats.avgSaleRate },
                { label: "Compradores recurrentes", value: `${profile.stats.repeatBuyers}%`, bar: profile.stats.repeatBuyers },
                { label: "Lotes sobre estimación", value: "74%", bar: 74 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-bold text-[oklch(0.25_0.12_265)]">{item.value}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-[oklch(0.72_0.14_72)] h-2 rounded-full transition-all" style={{ width: `${item.bar}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="rv-editorial-heading text-base mb-4">Categorías más vendidas</h3>
            <div className="space-y-2">
              {[
                { cat: "Arte contemporáneo", pct: 52 },
                { cat: "Arte moderno", pct: 31 },
                { cat: "Fotografía artística", pct: 11 },
                { cat: "Escultura", pct: 6 },
              ].map((item) => (
                <div key={item.cat} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 sm:w-40 flex-shrink-0 truncate">{item.cat}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-[oklch(0.25_0.12_265)] h-2 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 w-8 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Expert Profile ─────────────────────────────────────────────────────────────
function ExpertProfile({ profile }: { profile: typeof profiles.expert }) {
  const [activeTab, setActiveTab] = useState<"reviews" | "certs" | "stats">("reviews");

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Lotes revisados", value: profile.stats.lotsReviewed.toLocaleString() },
          { label: "Tiempo promedio (días)", value: profile.stats.avgTurnaround },
          { label: "Tasa de aprobación", value: `${profile.stats.approvalRate}%` },
          { label: "Precisión de valuación", value: `${profile.stats.accuracy}%` },
          { label: "Disputas resueltas", value: profile.stats.disputesWon },
          { label: "Certificaciones", value: profile.stats.certifications },
        ].map((s) => (
          <div key={s.label} className="rv-kpi-card text-center">
            <p className="text-xl font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
            <p className="text-[0.6rem] text-gray-400 mt-1 uppercase tracking-wide leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto">
          {(["reviews", "certs", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm font-semibold border-b-2 transition-colors",
                activeTab === tab
                  ? "border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              {tab === "reviews" ? "Valoraciones" : tab === "certs" ? "Certificaciones" : "Estadísticas"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {profile.reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      )}

      {activeTab === "certs" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: "ASA — Accredited Senior Appraiser", issuer: "American Society of Appraisers", year: "2018", specialty: "Fine Art & Decorative Arts" },
            { title: "WOSTEP — Watchmaking Certificate", issuer: "Watchmakers of Switzerland Training", year: "2015", specialty: "Relojería de colección" },
            { title: "Doctor en Historia del Arte", issuer: "Universidad Nacional Autónoma de México", year: "2012", specialty: "Arte latinoamericano moderno" },
            { title: "Certificado RICS — Valuación de Arte", issuer: "Royal Institution of Chartered Surveyors", year: "2020", specialty: "Arte y objetos de lujo" },
          ].map((cert) => (
            <div key={cert.title} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[oklch(0.25_0.12_265)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-[oklch(0.72_0.14_72)]" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>{cert.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cert.issuer}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[0.65rem] font-semibold text-[oklch(0.72_0.14_72)] bg-amber-50 px-2 py-0.5 rounded">{cert.year}</span>
                    <span className="text-[0.65rem] text-gray-400">{cert.specialty}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="rv-editorial-heading text-base mb-4">Métricas de revisión</h3>
            <div className="space-y-3">
              {[
                { label: "Precisión de valuación", value: `${profile.stats.accuracy}%`, bar: profile.stats.accuracy },
                { label: "Tasa de aprobación", value: `${profile.stats.approvalRate}%`, bar: profile.stats.approvalRate },
                { label: "Satisfacción vendedores", value: "98.1%", bar: 98.1 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-bold text-[oklch(0.25_0.12_265)]">{item.value}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-[oklch(0.72_0.14_72)] h-2 rounded-full" style={{ width: `${item.bar}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="rv-editorial-heading text-base mb-4">Especialidades</h3>
            <div className="space-y-2">
              {[
                { cat: "Relojería de colección", pct: 58 },
                { cat: "Arte moderno latinoam.", pct: 29 },
                { cat: "Joyería fina", pct: 9 },
                { cat: "Otros", pct: 4 },
              ].map((item) => (
                <div key={item.cat} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 sm:w-40 flex-shrink-0 truncate">{item.cat}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-[oklch(0.25_0.12_265)] h-2 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 w-8 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UserProfile() {
  // Determine which profile to show based on URL
  const isSeller = !window.location.pathname.includes("expert");
  const profile = isSeller ? profiles.seller : profiles.expert;

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.008_220)]">
      {/* Profile header */}
      <div className="bg-[oklch(0.25_0.12_265)]">
        <div className="container py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: profile.avatarBg, fontFamily: "'Playfair Display', serif" }}
            >
              {profile.avatar}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {profile.name}
                </h1>
                {profile.verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[oklch(0.72_0.14_72)] bg-white/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Verificado
                  </span>
                )}
                <span className="text-xs font-semibold text-white/40 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {profile.type === "seller" ? "Vendedor" : "Experto"}
                </span>
              </div>
              <p className="text-white/50 text-sm mt-0.5">{profile.handle}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-white/60 text-xs">
                  <MapPin className="w-3 h-3" />
                  {profile.location}
                </span>
                <span className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Calendar className="w-3 h-3" />
                  Miembro desde {profile.joinedYear}
                </span>
                <span className="flex items-center gap-1.5 text-white/60 text-xs">
                  <BarChart2 className="w-3 h-3" />
                  {profile.specialty}
                </span>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {profile.badges.map((badge) => (
                  <span key={badge.label} className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg", badge.color)}>
                    <badge.icon className="w-3 h-3" />
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => toast.info("Función de contacto disponible en producción")}
                className="flex items-center gap-1.5 rv-btn-primary text-sm px-4 py-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contactar
              </button>
              <button
                onClick={() => toast.info("Reporte enviado")}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                <Flag className="w-3 h-3" />
                Reportar
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-white/70 text-sm leading-relaxed max-w-3xl">{profile.bio}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {profile.type === "seller"
          ? <SellerProfile profile={profiles.seller} />
          : <ExpertProfile profile={profiles.expert} />
        }
      </div>

      {/* Profile switcher for mockup demo */}
      <div className="fixed bottom-20 left-2 sm:left-4 bg-white border border-gray-200 rounded-xl shadow-lg p-2 sm:p-3 z-40">
        <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest mb-2">Demo: cambiar perfil</p>
        <div className="flex gap-2">
          <Link href="/profile/seller-galeria-sur">
            <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors",
              isSeller ? "bg-[oklch(0.25_0.12_265)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}>Vendedor</span>
          </Link>
          <Link href="/profile/expert-dr-martinez">
            <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors",
              !isSeller ? "bg-[oklch(0.25_0.12_265)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}>Experto</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
