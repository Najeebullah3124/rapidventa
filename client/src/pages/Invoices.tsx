import { useState } from "react";
import { Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { formatCurrency } from "@/lib/mockData";
import {
  FileText, Download, ChevronLeft, Search, Filter,
  CheckCircle, Clock, AlertCircle, XCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type InvoiceStatus = "all" | "paid" | "pending" | "overdue" | "cancelled";

const statusConfig = {
  paid: { label: "Pagado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: Clock },
  overdue: { label: "Vencido", color: "bg-red-100 text-red-700", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

// Mock invoices data (en producción vendría de trpc.orders.list)
const mockInvoices = [
  { id: 1, invoiceNo: "RV-2026-0001", lotTitle: "Patek Philippe Nautilus 5711", lotNumber: "LOT-001", amount: 85000, buyerPremium: 12750, vat: 10200, total: 107950, status: "paid", date: new Date("2026-06-15"), dueDate: new Date("2026-06-30"), paymentMethod: "Transferencia bancaria" },
  { id: 2, invoiceNo: "RV-2026-0002", lotTitle: "Banksy — Love is in the Air", lotNumber: "LOT-002", amount: 320000, buyerPremium: 48000, vat: 38400, total: 406400, status: "pending", date: new Date("2026-07-01"), dueDate: new Date("2026-07-15"), paymentMethod: null },
  { id: 3, invoiceNo: "RV-2026-0003", lotTitle: "Messi Signed Jersey — 2022 World Cup", lotNumber: "LOT-003", amount: 45000, buyerPremium: 6750, vat: 5400, total: 57150, status: "overdue", date: new Date("2026-05-20"), dueDate: new Date("2026-06-04"), paymentMethod: null },
  { id: 4, invoiceNo: "RV-2026-0004", lotTitle: "Rolex Daytona 116500LN", lotNumber: "LOT-004", amount: 28000, buyerPremium: 4200, vat: 3360, total: 35560, status: "paid", date: new Date("2026-04-10"), dueDate: new Date("2026-04-25"), paymentMethod: "Tarjeta de crédito" },
];

export default function Invoices() {
  const { t, lang } = useLang();
  const { isAuthenticated, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState("wire");
  const [payRef, setPayRef] = useState("");

  const confirmPaymentMutation = trpc.buyerOrders.confirmPayment.useMutation({
    onSuccess: () => {
      toast.success("Pago confirmado. Recibirás una notificación de confirmación.");
      setShowPayModal(false);
      setPayRef("");
    },
    onError: (err) => toast.error(err.message),
  });

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
        <FileText className="w-12 h-12 text-gray-300" />
        <h2 className="rv-section-title text-xl">Acceso requerido</h2>
        <p className="text-gray-500 text-sm text-center max-w-xs">Inicia sesión para ver tus facturas y gestionar tus pagos.</p>
        <button onClick={() => startLogin()} className="rv-btn-primary px-6 py-2.5 text-sm">Iniciar sesión</button>
      </div>
    );
  }

  const filtered = mockInvoices.filter((inv) => {
    const matchSearch = search === "" || inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) || inv.lotTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = {
    paid: mockInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0),
    pending: mockInvoices.filter(i => i.status === "pending").reduce((s, i) => s + i.total, 0),
    overdue: mockInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0),
  };

  const handleDownload = (inv: typeof mockInvoices[0]) => {
    toast.success(`Descargando factura ${inv.invoiceNo}...`);
    // En producción: generar PDF con los datos reales
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;
    if (!payRef.trim()) { toast.error("Ingresa la referencia de pago"); return; }
    confirmPaymentMutation.mutate({
      orderId: selectedInvoice.id,
      paymentMethod: payMethod,
      paymentReference: payRef,
    });
  };

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
          <h1 className="rv-editorial-title text-3xl sm:text-4xl text-white mb-2">Mis Facturas</h1>
          <p className="text-white/60 text-sm">Historial de compras y gestión de pagos</p>
        </div>
      </div>

      <div className="container py-6 sm:py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total pagado</p>
            <p className="text-2xl font-bold text-green-600" style={{ fontFamily: "'Playfair Display', serif" }}>{formatCurrency(totals.paid)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{mockInvoices.filter(i => i.status === "paid").length} facturas</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pendiente de pago</p>
            <p className="text-2xl font-bold text-amber-600" style={{ fontFamily: "'Playfair Display', serif" }}>{formatCurrency(totals.pending)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{mockInvoices.filter(i => i.status === "pending").length} facturas</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vencido</p>
            <p className="text-2xl font-bold text-red-600" style={{ fontFamily: "'Playfair Display', serif" }}>{formatCurrency(totals.overdue)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{mockInvoices.filter(i => i.status === "overdue").length} facturas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por número de factura o lote..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "paid", "pending", "overdue", "cancelled"] as InvoiceStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                    statusFilter === s
                      ? "bg-[oklch(0.25_0.12_265)] text-white border-[oklch(0.25_0.12_265)]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {s === "all" ? "Todas" : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoice table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[oklch(0.97_0.008_220)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Factura</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lote</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No se encontraron facturas</td>
                  </tr>
                ) : filtered.map((inv) => {
                  const sc = statusConfig[inv.status as keyof typeof statusConfig];
                  const StatusIcon = sc?.icon ?? CheckCircle;
                  return (
                    <tr key={inv.id} className="hover:bg-[oklch(0.98_0.005_220)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-semibold text-[oklch(0.25_0.12_265)]">{inv.invoiceNo}</p>
                        <p className="text-xs text-gray-400">{inv.date.toLocaleDateString("es-ES")}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 max-w-[200px] truncate">{inv.lotTitle}</p>
                        <p className="text-xs text-gray-400 font-mono">{inv.lotNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-bold text-[oklch(0.72_0.14_72)]">{formatCurrency(inv.total)}</p>
                        <p className="text-xs text-gray-400">+{formatCurrency(inv.buyerPremium)} premium</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", sc?.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {sc?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className={cn("text-xs font-medium", inv.status === "overdue" ? "text-red-600" : "text-gray-600")}>
                          {inv.dueDate.toLocaleDateString("es-ES")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(inv)}
                            className="p-1.5 text-gray-400 hover:text-[oklch(0.25_0.12_265)] transition-colors"
                            title="Descargar factura"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {(inv.status === "pending" || inv.status === "overdue") && (
                            <button
                              onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                              className="px-3 py-1 bg-[oklch(0.72_0.14_72)] text-white text-xs font-semibold rounded-lg hover:bg-[oklch(0.65_0.14_72)] transition-colors"
                            >
                              Pagar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modal: Confirmar pago ── */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="rv-section-title text-lg mb-1">Confirmar pago</h3>
            <p className="text-sm text-gray-500 mb-4">Factura {selectedInvoice.invoiceNo} — {formatCurrency(selectedInvoice.total)}</p>

            <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-4 mb-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Precio de martillo</span>
                <span className="font-medium">{formatCurrency(selectedInvoice.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Buyer premium (15%)</span>
                <span className="font-medium">{formatCurrency(selectedInvoice.buyerPremium)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IVA (12%)</span>
                <span className="font-medium">{formatCurrency(selectedInvoice.vat)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 mt-1.5">
                <span>Total a pagar</span>
                <span className="text-[oklch(0.72_0.14_72)]">{formatCurrency(selectedInvoice.total)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Método de pago</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: "wire", label: "Transferencia" }, { id: "card", label: "Tarjeta" }, { id: "crypto", label: "Cripto" }].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className={cn(
                      "py-2 text-xs font-medium rounded-lg border transition-colors",
                      payMethod === m.id
                        ? "bg-[oklch(0.25_0.12_265)] text-white border-[oklch(0.25_0.12_265)]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Referencia de pago</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Número de confirmación o referencia"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPayModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={confirmPaymentMutation.isPending}
                className="flex-1 rv-btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {confirmPaymentMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
