import { useState, useRef, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  from: "user" | "bot";
}

const botResponses: Record<string, Record<"es" | "en", string>> = {
  buy: {
    es: "¡Perfecto! Para comprar en RapidVenta: 1) Regístrate gratis, 2) Explora el catálogo, 3) Regístrate en la subasta de tu interés, 4) ¡Puja! El buyer premium es del 20% sobre el precio de martillo. ¿Necesitas más información?",
    en: "Great! To buy on RapidVenta: 1) Register for free, 2) Browse the catalog, 3) Register for the auction you're interested in, 4) Bid! The buyer premium is 20% on the hammer price. Need more info?",
  },
  sell: {
    es: "Para vender en RapidVenta: 1) Crea tu cuenta de vendedor, 2) Sube las fotos de tu pieza, 3) Completa la información del lote, 4) Envía a revisión experta. Nuestros expertos evaluarán tu pieza en 48h. ¿Tienes preguntas?",
    en: "To sell on RapidVenta: 1) Create your seller account, 2) Upload photos of your piece, 3) Complete the lot information, 4) Submit for expert review. Our experts will evaluate your piece within 48h. Any questions?",
  },
  premium: {
    es: "El buyer premium es una comisión del 20% que se añade al precio de martillo (precio final de subasta). Ejemplo: si ganas un lote en $10,000, pagarás $10,000 + $2,000 (20%) = $12,000 total. Siempre se muestra antes de pujar.",
    en: "The buyer premium is a 20% commission added to the hammer price (final auction price). Example: if you win a lot at $10,000, you'll pay $10,000 + $2,000 (20%) = $12,000 total. Always shown before bidding.",
  },
  lot: {
    es: "Para registrar tu primer lote: Ve a 'Vender un lote', completa el formulario con título, descripción, fotos y estimación. Nuestros expertos revisarán la pieza y te notificaremos en 24-48 horas.",
    en: "To register your first lot: Go to 'Sell a Lot', complete the form with title, description, photos and estimate. Our experts will review the piece and notify you within 24-48 hours.",
  },
  support: {
    es: "Te conectaré con un agente de soporte. Mientras tanto, puedes escribirnos a soporte@rapidventa.com o llamar al +1 800 555 0100. Horario: Lun-Vie 9am-6pm EST.",
    en: "I'll connect you with a support agent. In the meantime, you can email us at support@rapidventa.com or call +1 800 555 0100. Hours: Mon-Fri 9am-6pm EST.",
  },
};

export function ChatbotWidget() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      text: lang === "es"
        ? "¡Hola! Soy el asistente de RapidVenta. ¿En qué puedo ayudarte hoy?"
        : "Hello! I'm the RapidVenta assistant. How can I help you today?",
      from: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (text: string, from: "user" | "bot") => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), text, from }]);
  };

  const handleChip = (key: keyof typeof botResponses) => {
    const chipLabels: Record<string, string> = {
      buy: t("chat.buy"),
      sell: t("chat.sell"),
      premium: t("chat.premium"),
      lot: t("chat.first_lot"),
      support: t("chat.support"),
    };
    addMessage(chipLabels[key], "user");
    setTimeout(() => {
      addMessage(botResponses[key][lang], "bot");
    }, 600);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage(input, "user");
    setInput("");
    setTimeout(() => {
      addMessage(
        lang === "es"
          ? "Gracias por tu mensaje. Un agente revisará tu consulta pronto. También puedes escribirnos a soporte@rapidventa.com."
          : "Thank you for your message. An agent will review your inquiry soon. You can also email us at support@rapidventa.com.",
        "bot"
      );
    }, 800);
  };

  const chips = [
    { key: "buy" as const, label: t("chat.buy") },
    { key: "sell" as const, label: t("chat.sell") },
    { key: "premium" as const, label: t("chat.premium") },
    { key: "lot" as const, label: t("chat.first_lot") },
    { key: "support" as const, label: t("chat.support") },
  ];

  return (
    <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-[calc(100vw-1.5rem)] max-w-[20rem] sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden rv-slide-up">
          {/* Header */}
          <div className="bg-[oklch(0.25_0.12_265)] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[oklch(0.72_0.14_72)] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[oklch(0.18_0.08_265)]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{t("chat.title")}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full rv-live-dot" />
                  <span className="text-white/60 text-[0.65rem]">En línea</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.from === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                    msg.from === "user"
                      ? "bg-[oklch(0.25_0.12_265)] text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips */}
          <div className="px-3 py-2 border-t border-gray-100 bg-white">
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => handleChip(chip.key)}
                  className="text-[0.65rem] font-medium bg-[oklch(0.97_0.008_220)] text-[oklch(0.25_0.12_265)] border border-[oklch(0.90_0.01_220)] rounded-full px-2.5 py-1 hover:bg-[oklch(0.94_0.015_220)] transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("chat.placeholder")}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
            />
            <button
              onClick={handleSend}
              className="w-8 h-8 bg-[oklch(0.72_0.14_72)] rounded-lg flex items-center justify-center hover:bg-[oklch(0.78_0.12_72)] transition-colors active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-[oklch(0.18_0.08_265)]" />
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-[oklch(0.72_0.14_72)] rounded-full shadow-xl flex items-center justify-center hover:bg-[oklch(0.78_0.12_72)] transition-all duration-200 active:scale-95"
        aria-label="Abrir chat"
      >
        {open ? (
          <X className="w-6 h-6 text-[oklch(0.18_0.08_265)]" />
        ) : (
          <MessageCircle className="w-6 h-6 text-[oklch(0.18_0.08_265)]" />
        )}
      </button>
    </div>
  );
}
