import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { mockLots, formatCurrency } from "@/lib/mockData";
import { Package, Clock, CheckCircle, DollarSign, Plus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DashboardKpiSkeleton } from "@/components/SkeletonCard";
import { trpc } from "@/lib/trpc";

const kpis = [
  { icon: Package, key: "sell.active", value: "4", label: "Lotes activos" },
  { icon: Clock, key: "sell.review", value: "2", label: "En revisión" },
  { icon: CheckCircle, key: "sell.sold", value: "18", label: "Lotes vendidos" },
  { icon: DollarSign, key: "sell.commissions", value: "$12,400", label: "Comisiones" },
];

const tabs = ["Todos", "Borradores", "En revisión", "Activos", "Vendidos", "Comisiones"];


// Atributos dinámicos por categoría
const CATEGORY_ATTRIBUTES: Record<string, { label: string; placeholder: string; type?: string }[]> = {
  "Relojes": [
    { label: "Marca", placeholder: "Ej: Patek Philippe, Rolex, AP" },
    { label: "Modelo", placeholder: "Ej: Nautilus 5711" },
    { label: "Referencia", placeholder: "Ej: 5711/1A-010" },
    { label: "Año", placeholder: "Ej: 2019", type: "number" },
    { label: "Material caja", placeholder: "Ej: Acero inoxidable, Oro 18k" },
    { label: "Diámetro (mm)", placeholder: "Ej: 40", type: "number" },
    { label: "Movimiento", placeholder: "Ej: Cal. 324 SC — automático" },
    { label: "Incluye caja original", placeholder: "Sí / No" },
    { label: "Incluye papeles", placeholder: "Sí / No" },
  ],
  "Arte": [
    { label: "Artista", placeholder: "Ej: Banksy, Basquiat" },
    { label: "Técnica", placeholder: "Ej: Óleo sobre lienzo, Serigrafía" },
    { label: "Dimensiones", placeholder: "Ej: 80 × 60 cm" },
    { label: "Año de creación", placeholder: "Ej: 2002", type: "number" },
    { label: "Procedencia", placeholder: "Galería, colección privada..." },
    { label: "Certificado de autenticidad", placeholder: "Sí / No" },
  ],
  "Deportes": [
    { label: "Deporte", placeholder: "Ej: Fútbol, Tenis, Baloncesto" },
    { label: "Atleta", placeholder: "Ej: Lionel Messi" },
    { label: "Evento", placeholder: "Ej: Copa del Mundo 2022" },
    { label: "Tipo de artículo", placeholder: "Ej: Camiseta firmada, Balón" },
    { label: "Certificación PSA/JSA", placeholder: "Número de certificado" },
  ],
  "Joyería": [
    { label: "Metal", placeholder: "Ej: Oro 18k, Platino" },
    { label: "Piedra principal", placeholder: "Ej: Diamante, Esmeralda" },
    { label: "Quilates", placeholder: "Ej: 2.5 ct", type: "number" },
    { label: "Certificado GIA", placeholder: "Número de certificado" },
    { label: "Peso total (g)", placeholder: "Ej: 12.5", type: "number" },
  ],
  "Coleccionables": [
    { label: "Tipo", placeholder: "Ej: Moneda, Sello, Figura" },
    { label: "País de origen", placeholder: "Ej: México, España" },
    { label: "Año", placeholder: "Ej: 1955", type: "number" },
    { label: "Estado de conservación", placeholder: "Ej: Mint, VF, Fine" },
    { label: "Grado NGC/PCGS", placeholder: "Ej: MS-65" },
  ],
};

export default function SellerPortal() {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState("Activos");
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [dynamicAttrs, setDynamicAttrs] = useState<Record<string, string>>({});

  // Fetch seller lots from backend
  const { data: sellerLots, isLoading: lotsLoading } = trpc.lots.list.useQuery({ limit: 20, offset: 0 });

  const handleAttrChange = (label: string, value: string) => {
    setDynamicAttrs(prev => ({ ...prev, [label]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map(f => URL.createObjectURL(f));
    setUploadedImages(prev => [...prev, ...urls].slice(0, 8));
    toast.success(`${files.length} imagen(es) cargada(s)`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success(t("sell.review_msg"));
    setTimeout(() => {
      setShowForm(false);
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.008_220)]">
      {/* Header — editorial luxury */}
      <div className="bg-[oklch(0.25_0.12_265)] py-10 sm:py-12">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Portal del Vendedor
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[oklch(0.72_0.14_72)] flex items-center justify-center text-[oklch(0.18_0.08_265)] font-bold text-lg flex-shrink-0">
                GS
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Galería Sur
                </h1>
                <p className="text-white/60 text-sm mt-0.5">Vendedor verificado · Miembro desde 2022</p>
              </div>
            </div>
            <span className="rv-rule-wide mt-4" />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rv-btn-primary sm:mb-1 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Consignar lote
          </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* KPI Grid — auction-house style */}
        {lotsLoading ? (
          <DashboardKpiSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              { icon: Package, value: String(sellerLots?.filter(l => l.lot.status === "live")?.length ?? 4), label: "Lotes activos" },
              { icon: Clock, value: String(sellerLots?.filter(l => l.lot.status === "pending_review" || l.lot.status === "in_review")?.length ?? 2), label: "En revisión" },
              { icon: CheckCircle, value: String(sellerLots?.filter(l => l.lot.status === "sold")?.length ?? 18), label: "Lotes vendidos" },
              { icon: DollarSign, value: "$12,400", label: "Comisiones" },
            ].map((kpi, i) => (
              <div key={i} className="rv-kpi-card">
                <kpi.icon className="w-5 h-5 text-[oklch(0.72_0.14_72)] mb-3" />
                <p className="text-2xl font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {kpi.value}
                </p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">{kpi.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Lot records */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 pt-6 pb-0">
            <h2 className="rv-editorial-heading">Registro de lotes</h2>
          </div>

          {/* Tabs */}
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
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Lote</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Categoría</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Puja actual</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Estado</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">Pujas</th>
                  </tr>
                </thead>
                <tbody>
                  {mockLots.slice(0, 5).map((lot) => (
                    <tr key={lot.id} className="rv-record-row">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img src={lot.image} alt="" className="w-12 h-9 object-cover rounded flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-[oklch(0.25_0.12_265)] text-sm truncate max-w-[200px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {lot.title}
                            </p>
                            <p className="text-[0.65rem] text-gray-400 font-mono mt-0.5">{lot.lotNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-gray-600 text-xs">{lot.category}</td>
                      <td className="py-4 px-3 text-right font-bold text-[oklch(0.72_0.14_72)]">
                        {lot.status === "UPCOMING" ? <span className="text-gray-400">—</span> : formatCurrency(lot.currentBid)}
                      </td>
                      <td className="py-4 px-3 text-center">
                        {lot.status === "LIVE" && <span className="rv-badge-live"><span className="w-1.5 h-1.5 bg-white rounded-full rv-live-dot" />EN VIVO</span>}
                        {lot.status === "UPCOMING" && <span className="rv-badge-upcoming">PRÓXIMO</span>}
                        {lot.status === "ENDED" && <span className="rv-badge-ended">FINALIZADO</span>}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-600 text-sm font-medium">{lot.bidCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Lot Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto rv-slide-up">
            <div className="bg-[oklch(0.25_0.12_265)] px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <p className="text-[oklch(0.72_0.14_72)] text-[0.65rem] font-semibold uppercase tracking-[0.2em] mb-1">Consignación</p>
                <h2 className="font-bold text-white text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Nuevo lote
                </h2>
              </div>
              <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-[oklch(0.25_0.12_265)] text-xl mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lote enviado a revisión
                </h3>
                <p className="text-gray-600 text-sm">{t("sell.review_msg")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Título (ES)</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors" placeholder="Nombre del lote en español" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Title (EN)</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors" placeholder="Lot name in English" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Categoría</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setDynamicAttrs({}); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] bg-white"
                  >
                    <option value="">Seleccionar categoría</option>
                    <option>Arte</option>
                    <option>Relojes</option>
                    <option>Deportes</option>
                    <option>Coleccionables</option>
                    <option>Joyería</option>
                  </select>

                {/* Atributos dinámicos por categoría */}
                {selectedCategory && CATEGORY_ATTRIBUTES[selectedCategory] && (
                  <div className="border border-[oklch(0.72_0.14_72)]/30 rounded-xl p-4 bg-[oklch(0.98_0.01_72)] mt-4">
                    <p className="text-xs font-semibold text-[oklch(0.72_0.14_72)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <span className="w-1 h-4 bg-[oklch(0.72_0.14_72)] rounded-full inline-block" />
                      Atributos específicos — {selectedCategory}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CATEGORY_ATTRIBUTES[selectedCategory].map((attr) => (
                        <div key={attr.label}>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">{attr.label}</label>
                          <input
                            type={attr.type ?? "text"}
                            value={dynamicAttrs[attr.label] ?? ""}
                            onChange={(e) => handleAttrChange(attr.label, e.target.value)}
                            placeholder={attr.placeholder}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Estimación baja (USD)</label>
                    <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)]" placeholder="10,000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Estimación alta (USD)</label>
                    <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)]" placeholder="15,000" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Precio de reserva (USD)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)]" placeholder="8,000" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Descripción (ES)</label>
                  <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] resize-none" placeholder="Descripción detallada del lote..." />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Imágenes del lote</label>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {uploadedImages.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {i === 0 && <span className="absolute bottom-1 left-1 text-[0.6rem] bg-[oklch(0.72_0.14_72)] text-white px-1.5 py-0.5 rounded font-semibold">Principal</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[oklch(0.72_0.14_72)] transition-colors cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Arrastra imágenes o haz clic para subir</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG — máx. 10 MB · hasta 8 imágenes</p>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="certified" className="w-4 h-4 accent-[oklch(0.72_0.14_72)]" />
                  <label htmlFor="certified" className="text-sm text-gray-700 cursor-pointer">Incluye certificado de autenticidad</label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 rv-btn-primary py-2.5 text-sm">
                    Enviar a revisión
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
