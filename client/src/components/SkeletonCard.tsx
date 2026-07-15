import { cn } from "@/lib/utils";

// Pulse animation base
const Pulse = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
);

// Skeleton para LotCard en el catálogo
export function LotCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <Pulse className="w-full aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-12" />
        </div>
        <Pulse className="h-5 w-3/4" />
        <Pulse className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Pulse className="h-8 flex-1 rounded-lg" />
          <Pulse className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Skeleton para KPI card en dashboards
export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <Pulse className="h-5 w-5 mb-3 rounded-full" />
      <Pulse className="h-7 w-20 mb-2" />
      <Pulse className="h-3 w-24" />
    </div>
  );
}

// Skeleton para fila de tabla
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Pulse className={cn("h-4", i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24")} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton para página de catálogo completa
export function CatalogSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <LotCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton para dashboard KPIs
export function DashboardKpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton para auction card
export function AuctionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <Pulse className="w-full h-40" />
      <div className="p-5 space-y-3">
        <Pulse className="h-3 w-20" />
        <Pulse className="h-6 w-3/4" />
        <Pulse className="h-4 w-1/2" />
        <div className="flex gap-3 pt-2">
          <Pulse className="h-8 flex-1 rounded-lg" />
          <Pulse className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
