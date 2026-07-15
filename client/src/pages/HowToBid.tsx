import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import {
  Gavel, UserCheck, Search, TrendingUp, CreditCard, Package,
  ChevronDown, ChevronUp, Calculator, ShieldCheck, Clock, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Buyer Premium Calculator ──────────────────────────────────────────────────
function PremiumCalculator() {
  const [hammer, setHammer] = useState(10000);

  const calcPremium = (h: number) => {
    // Christie's-style tiered premium
    if (h <= 100000) return h * 0.26;
    if (h <= 2000000) return 100000 * 0.26 + (h - 100000) * 0.21;
    return 100000 * 0.26 + 1900000 * 0.21 + (h - 2000000) * 0.145;
  };

  const premium = calcPremium(hammer);
  const total = hammer + premium;
  const pct = ((premium / hammer) * 100).toFixed(1);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[oklch(0.25_0.12_265)] rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-[oklch(0.72_0.14_72)]" />
        </div>
        <div>
          <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest">Herramienta interactiva</p>
          <h3 className="font-bold text-[oklch(0.25_0.12_265)] text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            Calculadora de Buyer Premium
          </h3>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          Precio de martillo estimado (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
          <input
            type="number"
            value={hammer}
            onChange={(e) => setHammer(Math.max(0, Number(e.target.value)))}
            className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-[oklch(0.25_0.12_265)] outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
          />
        </div>
        <input
          type="range"
          min={1000}
          max={500000}
          step={1000}
          value={hammer}
          onChange={(e) => setHammer(Number(e.target.value))}
          className="w-full mt-3 accent-[oklch(0.72_0.14_72)]"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>$1,000</span>
          <span>$500,000</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-4 text-center">
          <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest mb-1">Precio martillo</p>
          <p className="text-lg font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {fmt(hammer)}
          </p>
        </div>
        <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-4 text-center">
          <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest mb-1">Buyer premium ({pct}%)</p>
          <p className="text-lg font-bold text-[oklch(0.72_0.14_72)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {fmt(premium)}
          </p>
        </div>
        <div className="bg-[oklch(0.25_0.12_265)] rounded-xl p-4 text-center">
          <p className="text-[0.6rem] text-white/50 uppercase tracking-widest mb-1">Total a pagar</p>
          <p className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            {fmt(total)}
          </p>
        </div>
      </div>

      <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Estructura de comisiones</p>
        <div className="space-y-2">
          {[
            { range: "Hasta $100,000", rate: "26%" },
            { range: "$100,001 – $2,000,000", rate: "21%" },
            { range: "Más de $2,000,000", rate: "14.5%" },
          ].map((tier) => (
            <div key={tier.range} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{tier.range}</span>
              <span className="font-bold text-[oklch(0.25_0.12_265)]">{tier.rate}</span>
            </div>
          ))}
        </div>
        <p className="text-[0.65rem] text-gray-400 mt-3">* No incluye IVA ni gastos de envío. Aplican condiciones de la subasta.</p>
      </div>
    </div>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "¿Necesito registrarme para pujar?",
    a: "Sí. Debes crear una cuenta verificada (KYC) antes de participar en cualquier subasta. El proceso toma entre 24 y 48 horas hábiles.",
  },
  {
    q: "¿Qué es el Buyer Premium?",
    a: "Es una comisión que se añade al precio de martillo (precio final de puja). Cubre los costos operativos de la plataforma, la verificación experta y el soporte al comprador. Se calcula de forma escalonada según el monto adjudicado.",
  },
  {
    q: "¿Puedo pujar desde cualquier país?",
    a: "RapidVenta opera en 47 países. Algunos lotes tienen restricciones de exportación por regulaciones locales o CITES. Estas restricciones se indican claramente en la ficha del lote.",
  },
  {
    q: "¿Qué sucede si soy el mejor postor?",
    a: "Recibirás una notificación inmediata al cierre de la subasta. Tendrás 48 horas para completar el pago. Pasado ese plazo, el lote puede ser ofrecido al siguiente postor.",
  },
  {
    q: "¿Puedo establecer un límite máximo de puja automática?",
    a: "Sí. La función de Puja Automática (Auto-bid) te permite fijar un tope máximo. El sistema pujará en tu nombre de forma incremental hasta alcanzar ese límite, sin revelar tu máximo a otros participantes.",
  },
  {
    q: "¿Cómo se verifican los lotes?",
    a: "Cada lote es revisado por un experto certificado antes de publicarse. El experto valúa la pieza, confirma su autenticidad y emite un dictamen que queda registrado en la ficha del lote.",
  },
  {
    q: "¿Qué formas de pago se aceptan?",
    a: "Transferencia bancaria internacional, tarjeta de crédito/débito (Visa, Mastercard, Amex) y criptomonedas estables (USDC, USDT). Los métodos disponibles varían según el monto y el país del comprador.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border-b border-gray-100 last:border-0", open && "bg-[oklch(0.98_0.005_220)]")}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
      >
        <span className="text-sm font-semibold text-[oklch(0.25_0.12_265)]">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[oklch(0.72_0.14_72)] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const steps = [
  {
    number: "01",
    icon: UserCheck,
    title: "Crea y verifica tu cuenta",
    desc: "Regístrate como comprador y completa la verificación KYC (identidad). El proceso toma 24-48 horas y es requerido por regulaciones anti-lavado.",
    tip: "Ten a mano tu pasaporte o INE y una selfie sosteniendo el documento.",
  },
  {
    number: "02",
    icon: Search,
    title: "Explora el catálogo",
    desc: "Navega por subastas activas, próximas y finalizadas. Filtra por categoría, precio estimado, estado o vendedor. Guarda tus favoritos.",
    tip: "Activa alertas de precio para recibir notificaciones cuando un lote alcance tu rango de interés.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Revisa la ficha del lote",
    desc: "Cada lote incluye: galería de imágenes, dictamen del experto, estimación, precio de reserva (si aplica), historial de pujas y condiciones de venta.",
    tip: "Lee siempre las condiciones específicas de la subasta antes de pujar.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Realiza tu puja",
    desc: "Ingresa tu oferta manualmente o activa la Puja Automática fijando un máximo. El sistema pujará en tu nombre de forma incremental y confidencial.",
    tip: "Las pujas en los últimos 3 minutos extienden el tiempo en 3 minutos adicionales (anti-sniping).",
  },
  {
    number: "05",
    icon: Bell,
    title: "Monitorea en tiempo real",
    desc: "Recibe notificaciones push, por correo y SMS cuando seas superado. Desde tu dashboard puedes ver el estado de todas tus pujas activas.",
    tip: "Activa las notificaciones del navegador para no perderte ninguna actualización.",
  },
  {
    number: "06",
    icon: CreditCard,
    title: "Completa el pago",
    desc: "Si ganas, recibirás una factura automática con el desglose: precio de martillo + buyer premium + impuestos. Tienes 48 horas para pagar.",
    tip: "Los pagos superiores a $50,000 USD requieren transferencia bancaria o cripto.",
  },
  {
    number: "07",
    icon: Package,
    title: "Recibe tu pieza",
    desc: "Coordinamos el embalaje especializado, seguro y envío internacional con nuestros socios logísticos certificados. Seguimiento en tiempo real.",
    tip: "Algunas piezas pueden retirarse en persona en nuestra sede. Consulta disponibilidad.",
  },
];

export default function HowToBid() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[oklch(0.25_0.12_265)] py-10 sm:py-16">
        <div className="container">
          <p className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            Guía del comprador
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight max-w-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            Cómo pujar en RapidVenta
          </h1>
          <p className="text-white/60 text-base mt-4 max-w-xl leading-relaxed">
            Todo lo que necesitas saber para participar con confianza en nuestras subastas de lujo: desde el registro hasta recibir tu pieza.
          </p>
          <span className="rv-rule-wide mt-6" />
        </div>
      </div>

      {/* Steps */}
      <div className="container py-16">
        <div className="flex items-center gap-3 mb-10">
          <span className="rv-rule" />
          <h2 className="rv-section-title text-2xl">Proceso paso a paso</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.number} className="group relative bg-white border border-gray-100 rounded-2xl p-6 rv-card-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl font-bold text-gray-100 leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {s.number}
                </div>
                <div className="w-10 h-10 bg-[oklch(0.25_0.12_265)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-5 h-5 text-[oklch(0.72_0.14_72)]" />
                </div>
              </div>
              <h3 className="font-bold text-[oklch(0.25_0.12_265)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                {s.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{s.desc}</p>
              <div className="bg-[oklch(0.97_0.008_220)] rounded-lg p-3 border-l-2 border-[oklch(0.72_0.14_72)]">
                <p className="text-xs text-gray-600"><span className="font-bold text-[oklch(0.72_0.14_72)]">Consejo: </span>{s.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-[oklch(0.97_0.008_220)] py-16">
        <div className="container">
          <div className="flex items-center gap-3 mb-10">
            <span className="rv-rule" />
            <h2 className="rv-section-title text-2xl">Calcula tu costo total</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-gray-600 leading-relaxed mb-6">
                El <strong>Buyer Premium</strong> es la comisión que RapidVenta cobra al comprador sobre el precio de martillo. Se calcula de forma escalonada: cuanto mayor es el precio de adjudicación, menor es el porcentaje marginal aplicado.
              </p>
              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, title: "Verificación experta incluida", desc: "El costo de la valuación y certificación de autenticidad está cubierto por el buyer premium." },
                  { icon: Clock, title: "Sin cargos ocultos", desc: "El total que muestra la calculadora es lo que pagas. Los impuestos locales pueden aplicar según tu país." },
                  { icon: Package, title: "Envío cotizado por separado", desc: "El embalaje especializado y el seguro de transporte se cotizan individualmente según destino y tipo de pieza." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[oklch(0.25_0.12_265)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-[oklch(0.72_0.14_72)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[oklch(0.25_0.12_265)]">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <PremiumCalculator />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="container py-16">
        <div className="flex items-center gap-3 mb-10">
          <span className="rv-rule" />
          <h2 className="rv-section-title text-2xl">Preguntas frecuentes</h2>
        </div>
        <div className="max-w-3xl bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[oklch(0.25_0.12_265)] py-16">
        <div className="container text-center">
          <p className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em] mb-3">¿Listo para empezar?</p>
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Únete a más de 38,000 coleccionistas
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
            Crea tu cuenta gratuita y accede a subastas exclusivas de arte, relojes, deportes y coleccionables.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a href="/register" className="rv-btn-primary px-8 py-3 w-full sm:w-auto text-center">Crear cuenta gratis</a>
            <a href="/catalog" className="rv-btn-outline px-8 py-3 w-full sm:w-auto text-center">Ver catálogo</a>
          </div>
        </div>
      </div>
    </div>
  );
}
