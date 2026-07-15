import { useState } from "react";
import { Link } from "wouter";
import { mockLots, formatCurrency } from "@/lib/mockData";
import {
  CreditCard, Building2, Bitcoin, ChevronRight, ChevronLeft,
  ShieldCheck, Lock, CheckCircle, Download, Eye, EyeOff,
  AlertCircle, Clock, Package, Printer, ArrowLeft, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Mock data ──────────────────────────────────────────────────────────────────
const lot = mockLots[0]; // Patek Philippe Nautilus
const hammerPrice = 95000;
const buyerPremium = 24700; // 26% of first $100K
const subtotal = hammerPrice + buyerPremium;
const tax = subtotal * 0.16; // IVA México 16%
const total = subtotal + tax;

const invoiceData = {
  invoiceNumber: "RV-INV-2024-00847",
  date: "08 Jul 2024",
  dueDate: "10 Jul 2024",
  auctionRef: "SUB-2024-07 · Lote RV-2024-001",
  buyer: {
    name: "Juan García Hernández",
    email: "juan@email.com",
    address: "Av. Insurgentes Sur 1234, CDMX",
    rfc: "GAHJ850312AB3",
  },
  seller: "Galería Sur",
  lot: lot.title,
  lines: [
    { desc: "Precio de martillo", amount: hammerPrice },
    { desc: "Buyer Premium (26%)", amount: buyerPremium },
    { desc: "IVA 16%", amount: tax },
  ],
  total,
};

// ── Step indicator ─────────────────────────────────────────────────────────────
const steps = ["Resumen", "Método de pago", "Confirmación", "Factura"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              i < current ? "bg-green-500 text-white" :
              i === current ? "bg-[oklch(0.25_0.12_265)] text-white" :
              "bg-gray-100 text-gray-400"
            )}>
              {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              "text-[0.6rem] mt-1 font-semibold uppercase tracking-wide hidden sm:block",
              i === current ? "text-[oklch(0.25_0.12_265)]" : "text-gray-400"
            )}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("w-12 sm:w-20 h-0.5 mx-1 mb-3", i < current ? "bg-green-400" : "bg-gray-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Order summary ──────────────────────────────────────────────────────────────
function OrderSummary({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 overflow-hidden", compact ? "p-4" : "p-6")}>
      {!compact && (
        <div className="flex items-center gap-3 mb-5">
          <img src={lot.image} alt={lot.title} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
          <div>
            <p className="font-bold text-sm text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>{lot.title}</p>
            <p className="text-xs text-gray-400">{lot.lotNumber} · {lot.seller}</p>
            <p className="text-xs text-gray-400">Subasta: SUB-2024-07</p>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Precio de martillo</span>
          <span className="font-semibold text-[oklch(0.25_0.12_265)]">{formatCurrency(hammerPrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Buyer Premium (26%)</span>
          <span className="font-semibold text-[oklch(0.25_0.12_265)]">{formatCurrency(buyerPremium)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IVA (16%)</span>
          <span className="font-semibold text-[oklch(0.25_0.12_265)]">{formatCurrency(tax)}</span>
        </div>
        <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
          <span className="font-bold text-[oklch(0.25_0.12_265)]">Total a pagar</span>
          <span className="font-bold text-lg text-[oklch(0.72_0.14_72)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-bold">Pago requerido antes del 10 Jul 2024 a las 23:59 UTC.</span>{" "}
          Pasado este plazo, el lote puede ser ofrecido al siguiente postor.
        </p>
      </div>
    </div>
  );
}

// ── Step 1: Summary ────────────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-1">Paso 1 de 4</p>
        <h2 className="rv-section-title text-xl">Resumen del pedido</h2>
      </div>
      <OrderSummary />
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-sm text-[oklch(0.25_0.12_265)] mb-3">Datos del comprador</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: "Nombre", value: "Juan García Hernández" },
            { label: "Correo", value: "juan@email.com" },
            { label: "País", value: "México" },
            { label: "RFC / Tax ID", value: "GAHJ850312AB3" },
          ].map((d) => (
            <div key={d.label}>
              <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest">{d.label}</p>
              <p className="font-semibold text-[oklch(0.25_0.12_265)]">{d.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        Transacción protegida por cifrado SSL de 256 bits
      </div>
      <button onClick={onNext} className="w-full rv-btn-primary py-3 flex items-center justify-center gap-2">
        Continuar al pago
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Step 2: Payment method ─────────────────────────────────────────────────────
type PayMethod = "card" | "wire" | "crypto";

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [method, setMethod] = useState<PayMethod>("card");
  const [showCvv, setShowCvv] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");

  const formatCard = (v: string) => v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2, 4)}`;
    return d;
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-1">Paso 2 de 4</p>
        <h2 className="rv-section-title text-xl">Método de pago</h2>
      </div>

      {/* Method selector */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {([
          { id: "card" as PayMethod, icon: CreditCard, label: "Tarjeta", sub: "Visa · MC · Amex" },
          { id: "wire" as PayMethod, icon: Building2, label: "Transferencia", sub: "Wire internacional" },
          { id: "crypto" as PayMethod, icon: Bitcoin, label: "Cripto", sub: "USDC · USDT" },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              method === m.id
                ? "border-[oklch(0.72_0.14_72)] bg-amber-50"
                : "border-gray-100 bg-white hover:border-gray-200"
            )}
          >
            <m.icon className={cn("w-5 h-5", method === m.id ? "text-[oklch(0.72_0.14_72)]" : "text-gray-400")} />
            <div className="text-center">
              <p className={cn("text-xs font-bold", method === m.id ? "text-[oklch(0.25_0.12_265)]" : "text-gray-600")}>{m.label}</p>
              <p className="text-[0.6rem] text-gray-400">{m.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Card form */}
      {method === "card" && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Número de tarjeta</label>
            <div className="relative">
              <input
                value={cardNum}
                onChange={(e) => setCardNum(formatCard(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] font-mono"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <div className="w-6 h-4 bg-blue-600 rounded-sm opacity-80" />
                <div className="w-6 h-4 bg-red-500 rounded-sm opacity-80" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Vencimiento</label>
              <input
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/AA"
                maxLength={5}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">CVV</label>
              <div className="relative">
                <input
                  type={showCvv ? "text" : "password"}
                  placeholder="•••"
                  maxLength={4}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] font-mono pr-10"
                />
                <button onClick={() => setShowCvv(!showCvv)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre en la tarjeta</label>
            <input
              defaultValue="JUAN GARCIA HERNANDEZ"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] uppercase"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <Lock className="w-3.5 h-3.5 text-green-500" />
            Los datos de tu tarjeta están cifrados y nunca se almacenan en nuestros servidores.
          </div>
        </div>
      )}

      {/* Wire transfer */}
      {method === "wire" && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              Realiza la transferencia a la siguiente cuenta bancaria. El lote se liberará una vez confirmado el pago (1-2 días hábiles).
            </p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Banco", value: "Citibank N.A." },
              { label: "Beneficiario", value: "RapidVenta S.A. de C.V." },
              { label: "SWIFT / BIC", value: "CITIUS33" },
              { label: "IBAN / Cuenta", value: "US12 3456 7890 1234 5678 90" },
              { label: "Referencia", value: "RV-2024-001-JGARCIA" },
              { label: "Monto exacto", value: formatCurrency(total) },
            ].map((d) => (
              <div key={d.label} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                <span className="text-gray-500">{d.label}</span>
                <span className="font-bold text-[oklch(0.25_0.12_265)] font-mono text-xs">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crypto */}
      {method === "crypto" && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {["USDC (ERC-20)", "USDT (TRC-20)"].map((coin) => (
              <button key={coin} className="border-2 border-gray-100 rounded-xl p-3 text-center hover:border-[oklch(0.72_0.14_72)] transition-colors">
                <p className="text-sm font-bold text-[oklch(0.25_0.12_265)]">{coin}</p>
              </button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            {/* QR placeholder */}
            <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={cn("w-4 h-4", Math.random() > 0.5 ? "bg-gray-800" : "bg-white")} />
                ))}
              </div>
            </div>
            <p className="text-xs font-mono text-gray-500 break-all">0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b</p>
            <p className="text-xs text-gray-400 mt-2">Envía exactamente <span className="font-bold text-[oklch(0.25_0.12_265)]">{(total / 17.5).toFixed(2)} USDC</span></p>
          </div>
        </div>
      )}

      <OrderSummary compact />

      <div className="flex gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 rv-btn-outline px-4 py-3 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Atrás
        </button>
        <button onClick={onNext} className="flex-1 rv-btn-primary py-3 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          {method === "card" ? `Pagar ${formatCurrency(total)}` : method === "wire" ? "Confirmar y enviar instrucciones" : "He realizado el pago"}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Confirmation ───────────────────────────────────────────────────────
function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-1">Paso 3 de 4</p>
        <h2 className="rv-section-title text-xl">Confirmar pago</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-bold text-sm text-[oklch(0.25_0.12_265)]">Resumen final</h3>
        {[
          { label: "Lote", value: lot.title },
          { label: "Número de lote", value: lot.lotNumber },
          { label: "Subasta", value: "SUB-2024-07 — Arte Latinoamericano" },
          { label: "Método de pago", value: "Tarjeta Visa ···· 4242" },
          { label: "Precio de martillo", value: formatCurrency(hammerPrice) },
          { label: "Buyer Premium", value: formatCurrency(buyerPremium) },
          { label: "IVA", value: formatCurrency(tax) },
        ].map((d) => (
          <div key={d.label} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
            <span className="text-gray-500">{d.label}</span>
            <span className="font-semibold text-[oklch(0.25_0.12_265)] text-right max-w-[60%] truncate">{d.value}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-base pt-1">
          <span className="text-[oklch(0.25_0.12_265)]">Total</span>
          <span className="text-[oklch(0.72_0.14_72)]" style={{ fontFamily: "'Playfair Display', serif" }}>{formatCurrency(total)}</span>
        </div>
      </div>

      <div
        onClick={() => setAgreed(!agreed)}
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
          agreed ? "border-[oklch(0.72_0.14_72)] bg-amber-50" : "border-gray-100 bg-white"
        )}
      >
        <div className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
          agreed ? "bg-[oklch(0.72_0.14_72)] border-[oklch(0.72_0.14_72)]" : "border-gray-300"
        )}>
          {agreed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
        </div>
        <p className="text-sm text-gray-600">
          He leído y acepto los{" "}
          <span className="text-[oklch(0.72_0.14_72)] font-semibold">Términos y Condiciones</span>,{" "}
          la <span className="text-[oklch(0.72_0.14_72)] font-semibold">Política de Privacidad</span> y las{" "}
          <span className="text-[oklch(0.72_0.14_72)] font-semibold">Condiciones de Venta</span> de RapidVenta.
          Entiendo que esta transacción es vinculante y no reembolsable.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 rv-btn-outline px-4 py-3 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Atrás
        </button>
        <button
          onClick={() => { if (agreed) onNext(); else toast.error("Debes aceptar los términos para continuar"); }}
          className={cn("flex-1 py-3 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all",
            agreed ? "rv-btn-primary" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          <Lock className="w-4 h-4" />
          Confirmar y pagar {formatCurrency(total)}
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Invoice ────────────────────────────────────────────────────────────
function Step4() {
  return (
    <div className="space-y-5">
      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-green-800 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>¡Pago confirmado!</h2>
          <p className="text-sm text-green-700 mt-1">
            Tu pago de <strong>{formatCurrency(total)}</strong> ha sido procesado exitosamente.
            Recibirás un correo de confirmación en <strong>juan@email.com</strong>.
          </p>
        </div>
      </div>

      {/* Invoice */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" id="invoice-print">
        {/* Invoice header */}
        <div className="bg-[oklch(0.25_0.12_265)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[oklch(0.72_0.14_72)] rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-[oklch(0.18_0.08_265)]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>RapidVenta</p>
                <p className="text-white/40 text-[0.55rem] uppercase tracking-widest">Subastas de Lujo</p>
              </div>
            </div>
            <p className="text-white/50 text-xs">soporte@rapidventa.com</p>
            <p className="text-white/50 text-xs">+1 800 555 0100</p>
          </div>
          <div className="text-right">
            <p className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-widest">Factura</p>
            <p className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{invoiceData.invoiceNumber}</p>
            <p className="text-white/50 text-xs mt-1">Emitida: {invoiceData.date}</p>
            <p className="text-white/50 text-xs">Vence: {invoiceData.dueDate}</p>
          </div>
        </div>

        <div className="p-6">
          {/* Buyer info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest mb-2">Facturar a</p>
              <p className="font-bold text-sm text-[oklch(0.25_0.12_265)]">{invoiceData.buyer.name}</p>
              <p className="text-xs text-gray-500">{invoiceData.buyer.email}</p>
              <p className="text-xs text-gray-500">{invoiceData.buyer.address}</p>
              <p className="text-xs text-gray-500">RFC: {invoiceData.buyer.rfc}</p>
            </div>
            <div>
              <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest mb-2">Referencia de subasta</p>
              <p className="text-sm text-gray-600">{invoiceData.auctionRef}</p>
              <p className="text-xs text-gray-500 mt-1">Vendedor: {invoiceData.seller}</p>
              <div className="mt-2">
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">PAGADO</span>
              </div>
            </div>
          </div>

          {/* Lot */}
          <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-4 mb-4 flex items-center gap-4">
            <img src={lot.image} alt={lot.title} className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>{lot.title}</p>
              <p className="text-xs text-gray-400">{lot.lotNumber} · {lot.category}</p>
            </div>
            <p className="font-bold text-[oklch(0.72_0.14_72)]">{formatCurrency(hammerPrice)}</p>
          </div>

          {/* Line items */}
          <div className="overflow-x-auto">
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">Concepto</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">Importe</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.lines.map((line) => (
                <tr key={line.desc} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-600">{line.desc}</td>
                  <td className="py-2.5 text-right font-semibold text-[oklch(0.25_0.12_265)]">{formatCurrency(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[oklch(0.25_0.12_265)]">
                <td className="py-3 font-bold text-[oklch(0.25_0.12_265)] text-base">TOTAL</td>
                <td className="py-3 text-right font-bold text-xl text-[oklch(0.72_0.14_72)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          </table>

          </div>
          {/* Footer note */}
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 space-y-1">
            <p>Esta factura fue generada automáticamente por RapidVenta S.A. de C.V. · RFC: RVSA240101XYZ</p>
            <p>El buyer premium incluye verificación experta, gestión de subasta y soporte al comprador.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => { window.print(); }}
          className="flex-1 flex items-center justify-center gap-2 rv-btn-outline py-3 text-sm"
        >
          <Printer className="w-4 h-4" />
          Imprimir factura
        </button>
        <button
          onClick={() => toast.success("Factura descargada como PDF")}
          className="flex-1 flex items-center justify-center gap-2 rv-btn-primary py-3 text-sm"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[oklch(0.25_0.12_265)] hover:text-[oklch(0.72_0.14_72)] transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Ir a mi dashboard
          </span>
        </Link>
        <Link href="/catalog">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[oklch(0.72_0.14_72)] hover:underline cursor-pointer">
            Seguir explorando
            <ChevronRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}

// ── Main Checkout Page ─────────────────────────────────────────────────────────
export default function Checkout() {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.008_220)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/lot/patek-philippe-nautilus-5711">
            <span className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[oklch(0.25_0.12_265)] transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Volver al lote
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[oklch(0.25_0.12_265)] rounded-lg flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-[oklch(0.72_0.14_72)]" />
            </div>
            <span className="font-bold text-[oklch(0.25_0.12_265)] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
              Pago seguro
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <StepIndicator current={step} />

        {step === 0 && <Step1 onNext={() => setStep(1)} />}
        {step === 1 && <Step2 onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <Step3 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step4 />}
      </div>
    </div>
  );
}
