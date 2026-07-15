import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { mockLots, formatCurrency } from "@/lib/mockData";
import { Clock, CheckCircle, XCircle, ShieldCheck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ExpertPanel() {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState<string | null>(null);
  const [valuation, setValuation] = useState("");
  const [comments, setComments] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approve" | "changes" | "reject" | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"review" | "history">("review");

  // Mock historial de revisiones previas
  const mockHistory = [
    { id: 1, action: "approve" as const, expert: "Dr. Martínez", date: new Date("2026-06-10T14:30:00"), valuation: 85000, notes: "Autenticidad confirmada. Movimiento original Cal. 324 SC. Caja y correa originales. Papeles completos." },
    { id: 2, action: "changes" as const, expert: "Dr. Martínez", date: new Date("2026-06-08T10:15:00"), valuation: 0, notes: "Requiere fotografías adicionales del caseback y del movimiento. Verificar número de serie." },
    { id: 3, action: "reject" as const, expert: "Lic. Rodríguez", date: new Date("2026-05-20T09:00:00"), valuation: 0, notes: "Documentación insuficiente. Certificado de autenticidad no corresponde al número de serie del reloj." },
  ];

  const pending = mockLots.slice(0, 5);
  const selectedLot = pending.find((l) => l.id === selected);

  const handleAction = (action: "approve" | "changes" | "reject") => {
    setConfirmAction(action);
  };

  const confirmActionFn = () => {
    if (confirmAction === "approve") toast.success("Lote aprobado y publicado.");
    if (confirmAction === "changes") toast.warning("Cambios solicitados al vendedor.");
    if (confirmAction === "reject") toast.error("Lote rechazado.");
    setConfirmAction(null);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.008_220)]">
      {/* Header */}
      <div className="bg-[oklch(0.25_0.12_265)] py-12">
        <div className="container">
          <p className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            Panel de Expertos
          </p>
          <h1 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Revisión y Valuación
          </h1>
          <span className="rv-rule-wide mt-4" />

          {/* Stats inline */}
          <div className="flex flex-wrap gap-6 sm:gap-8 mt-6">
            {[
              { icon: Clock, label: "Pendientes", value: "5", color: "text-[oklch(0.72_0.14_72)]" },
              { icon: CheckCircle, label: "Aprobados", value: "23", color: "text-green-400" },
              { icon: XCircle, label: "Rechazados", value: "3", color: "text-red-400" },
            ].map((kpi) => (
              <div key={kpi.label} className="flex items-center gap-3">
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                <div>
                  <p className="text-xl font-bold text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {kpi.value}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Pending list */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-0">
              <h2 className="rv-editorial-heading text-lg">Lotes pendientes de valuación</h2>
            </div>
            <div>
              {pending.map((lot) => (
                <div
                  key={lot.id}
                  onClick={() => setSelected(lot.id)}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 cursor-pointer transition-all border-l-2",
                    selected === lot.id
                      ? "bg-[oklch(0.97_0.008_220)] border-[oklch(0.72_0.14_72)]"
                      : "border-transparent hover:bg-gray-50 rv-record-row"
                  )}
                >
                  <img src={lot.image} alt="" className="w-14 h-11 object-cover rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[oklch(0.25_0.12_265)] truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {lot.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{lot.category} · {lot.seller}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-[oklch(0.72_0.14_72)]">
                      {formatCurrency(lot.estimateLow)}–{formatCurrency(lot.estimateHigh)}
                    </p>
                    <p className="text-[0.6rem] text-gray-400 mt-0.5 uppercase tracking-wide">Est. vendedor</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review panel */}
          {selectedLot ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-[oklch(0.25_0.12_265)] px-6 py-4">
                <p className="text-[oklch(0.72_0.14_72)] text-[0.65rem] font-semibold uppercase tracking-[0.2em] mb-1">
                  Expediente de valuación
                </p>
                <h2 className="font-bold text-white text-lg leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {selectedLot.title}
                </h2>
                <p className="text-white/50 text-xs mt-0.5 font-mono">{selectedLot.lotNumber}</p>
              </div>

              {/* Tabs: Revisión | Historial */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveDetailTab("review")}
                  className={cn(
                    "flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors",
                    activeDetailTab === "review"
                      ? "border-b-2 border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Valuación
                </button>
                <button
                  onClick={() => setActiveDetailTab("history")}
                  className={cn(
                    "flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors",
                    activeDetailTab === "history"
                      ? "border-b-2 border-[oklch(0.72_0.14_72)] text-[oklch(0.25_0.12_265)]"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Historial ({mockHistory.length})
                </button>
              </div>

              {activeDetailTab === "history" ? (
                <div className="p-5 space-y-3">
                  {mockHistory.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sin revisiones previas</p>
                  ) : mockHistory.map((h) => {
                    const actionConfig = {
                      approve: { label: "Aprobado", color: "bg-green-100 text-green-700", icon: CheckCircle },
                      changes: { label: "Cambios solicitados", color: "bg-amber-100 text-amber-700", icon: MessageSquare },
                      reject: { label: "Rechazado", color: "bg-red-100 text-red-700", icon: XCircle },
                    }[h.action];
                    const Icon = actionConfig.icon;
                    return (
                      <div key={h.id} className="border border-gray-100 rounded-xl p-4 bg-[oklch(0.98_0.005_220)]">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", actionConfig.color)}>
                              <Icon className="w-3 h-3" />
                              {actionConfig.label}
                            </span>
                            {h.valuation > 0 && (
                              <span className="text-xs font-bold text-[oklch(0.72_0.14_72)]">{formatCurrency(h.valuation)}</span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-gray-600">{h.expert}</p>
                            <p className="text-[0.65rem] text-gray-400">{h.date.toLocaleDateString("es-ES")} {h.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{h.notes}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
              <div className="p-5 space-y-5">
                <img src={selectedLot.image} alt="" className="w-full h-44 object-cover rounded-lg" />

                <p className="text-sm text-gray-700 leading-relaxed">{selectedLot.description}</p>

                <div className="grid grid-cols-2 gap-3 bg-[oklch(0.97_0.008_220)] rounded-lg p-4 text-sm">
                  <div>
                    <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-0.5">Categoría</p>
                    <p className="font-semibold text-[oklch(0.25_0.12_265)]">{selectedLot.category}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-0.5">Vendedor</p>
                    <p className="font-semibold text-[oklch(0.25_0.12_265)]">{selectedLot.seller}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-0.5">Est. vendedor</p>
                    <p className="font-bold text-[oklch(0.72_0.14_72)]">
                      {formatCurrency(selectedLot.estimateLow)} – {formatCurrency(selectedLot.estimateHigh)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-0.5">Certificado</p>
                    <p className="font-semibold text-[oklch(0.25_0.12_265)] flex items-center gap-1">
                      {selectedLot.certified ? <><ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Sí</> : "No"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                    Valuación experta (USD)
                  </label>
                  <input
                    type="number"
                    value={valuation}
                    onChange={(e) => setValuation(e.target.value)}
                    placeholder="Ingresa tu valuación oficial"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                    Observaciones
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Notas de autenticidad, condición, procedencia..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] resize-none transition-colors"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleAction("approve")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-green-800 transition-colors active:scale-[0.97] uppercase tracking-wide"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleAction("changes")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-600 text-white text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-amber-700 transition-colors active:scale-[0.97] uppercase tracking-wide"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Cambios
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-red-800 transition-colors active:scale-[0.97] uppercase tracking-wide"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 flex items-center justify-center h-80">
              <div className="text-center">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">Selecciona un lote para iniciar la valuación</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm rv-slide-up">
            <div className="bg-[oklch(0.25_0.12_265)] px-6 py-4 rounded-t-2xl">
              <p className="text-[oklch(0.72_0.14_72)] text-[0.65rem] font-semibold uppercase tracking-[0.2em]">Confirmar decisión</p>
            </div>
            <div className="p-6 text-center">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4",
                confirmAction === "approve" ? "bg-green-100" : confirmAction === "reject" ? "bg-red-100" : "bg-amber-100"
              )}>
                {confirmAction === "approve" && <CheckCircle className="w-7 h-7 text-green-700" />}
                {confirmAction === "reject" && <XCircle className="w-7 h-7 text-red-700" />}
                {confirmAction === "changes" && <MessageSquare className="w-7 h-7 text-amber-700" />}
              </div>
              <p className="text-sm text-gray-600 mb-6">
                {confirmAction === "approve" && "El lote será aprobado y publicado en la plataforma."}
                {confirmAction === "reject" && "El lote será rechazado y el vendedor será notificado."}
                {confirmAction === "changes" && "Se notificará al vendedor que debe realizar cambios antes de proceder."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmAction(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={confirmActionFn} className="flex-1 rv-btn-primary py-2.5 text-sm">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
