import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { LotCard } from "@/components/LotCard";
import { mockLots, LotStatus, formatCurrency } from "@/lib/mockData";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CatalogSkeleton } from "@/components/SkeletonCard";
import { trpc } from "@/lib/trpc";

const categories = ["Arte", "Relojes", "Deportes", "Coleccionables", "Joyería"];
const statuses: LotStatus[] = ["LIVE", "UPCOMING", "ENDED"];
const sortOptions = [
  { value: "recent", label: "Más recientes" },
  { value: "price_asc", label: "Precio menor-mayor" },
  { value: "price_desc", label: "Precio mayor-menor" },
  { value: "ending", label: "Termina pronto" },
];

export default function Catalog() {
  const { t, lang } = useLang();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<LotStatus[]>([]);
  const [sort, setSort] = useState("recent");
  const [certified, setCertified] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch from backend with full-text search (debounced) and sort
  const { data: backendLots, isLoading } = trpc.lots.list.useQuery({
    status: selectedStatuses.length === 1 ? selectedStatuses[0].toLowerCase() : undefined,
    search: debouncedSearch || undefined,
    sort: sort === "price_asc" ? "price_asc" : sort === "price_desc" ? "price_desc" : "recent",
    certified: certified || undefined,
    isFeatured: undefined,
    limit: 50,
    offset: 0,
  });

  const toggleCat = (cat: string) =>
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleStatus = (s: LotStatus) =>
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const clearFilters = () => {
    setSearch("");
    setSelectedCats([]);
    setSelectedStatuses([]);
    setCertified(false);
    setSort("recent");
  };

  // Merge backend data with mock data, preferring backend when available
  const sourceLots = backendLots && backendLots.length > 0
    ? backendLots.map(l => ({
        id: String(l.lot.id),
        title: l.lot.titleEs,
        titleEn: l.lot.titleEn ?? l.lot.titleEs,
        description: l.lot.descriptionEs ?? "",
        descriptionEn: l.lot.descriptionEn ?? "",
        category: (l.category?.nameEs ?? "Arte") as import("@/lib/mockData").Category,
        status: (l.lot.status?.toUpperCase() ?? "UPCOMING") as LotStatus,
        currentBid: Number(l.lot.currentBid ?? l.lot.reservePrice ?? 0),
        estimateLow: Number(l.lot.estimateLow ?? 0),
        estimateHigh: Number(l.lot.estimateHigh ?? 0),
        image: (l.lot.imageUrls as string[] | null)?.[0] ?? "/manus-storage/rv-lot-art_b318fc6b.jpg",
        endsAt: new Date(Date.now() + 86400000),
        lotNumber: l.lot.lotNumber ?? `LOT-${l.lot.id}`,
        seller: l.seller?.name ?? "Vendedor",
        sellerInitials: (l.seller?.name ?? "VE").slice(0, 2).toUpperCase(),
        certified: l.lot.isCertified ?? false,
        bidCount: 0,
        isFeatured: l.lot.isFeatured ?? false,
        slug: l.lot.lotNumber ?? `lot-${l.lot.id}`,
        buyerPremium: 20,
      }))
    : mockLots;

  const filtered = sourceLots
    .filter((l) => {
      const title = lang === "en" ? (l.titleEn ?? l.title) : l.title;
      if (search && !title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCats.length && !selectedCats.includes(l.category)) return false;
      if (selectedStatuses.length && !selectedStatuses.includes(l.status)) return false;
      if (certified && !l.certified) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.currentBid - b.currentBid;
      if (sort === "price_desc") return b.currentBid - a.currentBid;
      if (sort === "ending") return a.endsAt.getTime() - b.endsAt.getTime();
      return b.id.localeCompare(a.id);
    });

  const hasFilters = selectedCats.length > 0 || selectedStatuses.length > 0 || certified || search;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-[oklch(0.25_0.12_265)] mb-3 uppercase tracking-wide">{t("catalog.category")}</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCats.includes(cat)}
                onChange={() => toggleCat(cat)}
                className="w-4 h-4 rounded accent-[oklch(0.72_0.14_72)]"
              />
              <span className="text-sm text-gray-700 group-hover:text-[oklch(0.25_0.12_265)] transition-colors">
                {t(`cat.${cat.toLowerCase()}`) || cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 className="text-sm font-semibold text-[oklch(0.25_0.12_265)] mb-3 uppercase tracking-wide">{t("catalog.status")}</h3>
        <div className="space-y-2">
          {statuses.map((s) => (
            <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedStatuses.includes(s)}
                onChange={() => toggleStatus(s)}
                className="w-4 h-4 rounded accent-[oklch(0.72_0.14_72)]"
              />
              <span className="text-sm text-gray-700 group-hover:text-[oklch(0.25_0.12_265)] transition-colors">
                {s === "LIVE" ? "En vivo" : s === "UPCOMING" ? "Próximo" : "Finalizado"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Certified */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={certified}
            onChange={(e) => setCertified(e.target.checked)}
            className="w-4 h-4 rounded accent-[oklch(0.72_0.14_72)]"
          />
          <span className="text-sm text-gray-700">Con certificado de autenticidad</span>
        </label>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg py-2 transition-colors"
        >
          {t("catalog.clear")}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[oklch(0.97_0.008_220)] border-b border-gray-200 py-7 sm:py-10">
        <div className="container">
          <h1 className="rv-section-title text-4xl mb-2">{t("catalog.title")}</h1>
          <p className="text-gray-500 text-sm">
            {filtered.length} {lang === "es" ? "lotes disponibles" : "lots available"}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("catalog.search")}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative w-full sm:w-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors w-full"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Mobile filters button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t("catalog.filters")}
            {hasFilters && <span className="w-2 h-2 bg-[oklch(0.72_0.14_72)] rounded-full" />}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 bg-[oklch(0.97_0.008_220)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[oklch(0.25_0.12_265)] text-sm uppercase tracking-wide">{t("catalog.filters")}</h2>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700">
                    {t("catalog.clear")}
                  </button>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <CatalogSkeleton count={8} />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">{t("catalog.empty")}</h3>
                <button onClick={clearFilters} className="text-sm text-[oklch(0.72_0.14_72)] hover:underline">
                  {t("catalog.clear")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((lot) => (
                  <LotCard key={lot.id} lot={lot} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto rv-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-[oklch(0.25_0.12_265)]">{t("catalog.filters")}</h2>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full mt-6 rv-btn-primary py-3 text-sm"
            >
              {lang === "es" ? `Ver ${filtered.length} lotes` : `View ${filtered.length} lots`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
