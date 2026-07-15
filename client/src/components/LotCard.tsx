import { Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { CountdownTimer } from "./CountdownTimer";
import { Lot, formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface LotCardProps {
  lot: Lot;
  className?: string;
}

const categoryColors: Record<string, string> = {
  Arte: "bg-purple-100 text-purple-800",
  Relojes: "bg-blue-100 text-blue-800",
  Deportes: "bg-green-100 text-green-800",
  Coleccionables: "bg-amber-100 text-amber-800",
  Joyería: "bg-pink-100 text-pink-800",
};

export function LotCard({ lot, className }: LotCardProps) {
  const { t, lang } = useLang();

  const title = lang === "en" ? lot.titleEn : lot.title;

  const statusBadge = () => {
    if (lot.status === "LIVE") {
      return (
        <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-white rounded-full rv-live-dot" />
          LIVE
        </span>
      );
    }
    if (lot.status === "UPCOMING") {
      return (
        <span className="inline-flex items-center bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)] text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          PRÓXIMO
        </span>
      );
    }
    if (lot.status === "ENDED") {
      return (
        <span className="inline-flex items-center bg-gray-500 text-white text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          FINALIZADO
        </span>
      );
    }
    if (lot.status === "WINNING") {
      return (
        <span className="inline-flex items-center bg-green-600 text-white text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          GANANDO
        </span>
      );
    }
    if (lot.status === "OUTBID") {
      return (
        <span className="inline-flex items-center bg-red-600 text-white text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          SUPERADO
        </span>
      );
    }
    return null;
  };

  const actionButton = () => {
    const base = "w-full text-center text-sm font-semibold py-2 rounded transition-all duration-150 active:scale-[0.97]";
    if (lot.status === "LIVE" || lot.status === "OUTBID") {
      return (
        <button className={cn(base, "bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)] hover:bg-[oklch(0.78_0.12_72)]")}>
          {lot.status === "OUTBID" ? t("lot.raise") : t("lot.bid")}
        </button>
      );
    }
    if (lot.status === "WINNING") {
      return (
        <button className={cn(base, "bg-green-600 text-white hover:bg-green-700")}>
          {t("lot.winning")} ✓
        </button>
      );
    }
    if (lot.status === "UPCOMING") {
      return (
        <button className={cn(base, "border border-[oklch(0.25_0.12_265)] text-[oklch(0.25_0.12_265)] hover:bg-[oklch(0.97_0.008_220)]")}>
          {t("lot.notify")}
        </button>
      );
    }
    if (lot.status === "ENDED") {
      return (
        <button className={cn(base, "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
          {t("lot.result")}
        </button>
      );
    }
    return null;
  };

  return (
    <Link href={`/lot/${lot.slug}`}>
      <div
        className={cn(
          "group bg-white rounded-lg overflow-hidden rv-card-shadow cursor-pointer",
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={lot.image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Category badge — top left */}
          <span className={cn("absolute top-2 left-2 text-[0.65rem] font-semibold px-2 py-0.5 rounded-full", categoryColors[lot.category] || "bg-gray-100 text-gray-700")}>
            {t(`cat.${lot.category.toLowerCase()}`) || lot.category}
          </span>

          {/* Status badge — top right */}
          <div className="absolute top-2 right-2">
            {statusBadge()}
          </div>

          {/* Countdown — bottom of image */}
          {(lot.status === "LIVE" || lot.status === "UPCOMING") && (
            <div className="absolute bottom-2 left-2">
              <CountdownTimer targetDate={lot.endsAt} variant="pill" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2">
          {/* Title */}
          <h3 className="font-semibold text-sm text-[oklch(0.18_0.08_265)] leading-snug line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h3>

          {/* Price row */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[0.65rem] text-gray-500 uppercase tracking-wide">{t("lot.current")}</p>
              <p className="text-base font-bold text-[oklch(0.72_0.14_72)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                {lot.status === "UPCOMING" ? "—" : formatCurrency(lot.currentBid)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.65rem] text-gray-500 uppercase tracking-wide">{t("lot.estimate")}</p>
              <p className="text-xs text-gray-600">
                {formatCurrency(lot.estimateLow)} – {formatCurrency(lot.estimateHigh)}
              </p>
            </div>
          </div>

          {/* Lot number + seller */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-[0.65rem] text-gray-400 font-mono">{t("lot.number")} {lot.lotNumber}</span>
            <div className="flex items-center gap-1">
              {lot.certified && <ShieldCheck className="w-3 h-3 text-[oklch(0.72_0.14_72)]" />}
              <div className="w-5 h-5 rounded-full bg-[oklch(0.25_0.12_265)] flex items-center justify-center text-white text-[0.55rem] font-bold">
                {lot.sellerInitials}
              </div>
              <span className="text-[0.65rem] text-gray-500 truncate max-w-[80px]">{lot.seller}</span>
            </div>
          </div>

          {/* Action button */}
          <div onClick={(e) => e.preventDefault()}>
            {actionButton()}
          </div>
        </div>
      </div>
    </Link>
  );
}
