import { useLang } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Mail, Phone, Instagram, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const { t } = useLang();

  const columns = [
    {
      title: t("footer.auctions"),
      links: [
        { label: "En vivo", href: "/auctions" },
        { label: "Próximas", href: "/auctions" },
        { label: "Catálogo", href: "/catalog" },
        { label: "Categorías", href: "/catalog" },
      ],
    },
    {
      title: t("footer.account"),
      links: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Favoritos", href: "/favorites" },
        { label: "Facturas", href: "/dashboard" },
        { label: "Alertas", href: "/dashboard" },
      ],
    },
    {
      title: t("footer.sellers"),
      links: [
        { label: "Vender un lote", href: "/sell" },
        { label: "Proceso de revisión", href: "#" },
        { label: "Comisiones", href: "#" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: "FAQ", href: "#" },
        { label: "Contacto", href: "#" },
        { label: "Privacidad", href: "#" },
        { label: "Términos", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-[oklch(0.25_0.12_265)] text-white">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                <img src="/manus-storage/rv-logo-icon_698b0fa5.png" alt="RapidVenta" className="w-8 h-8 object-contain" />
              </div>
              <span className="font-bold text-xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                RapidVenta
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              {t("footer.tagline")}
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[oklch(0.72_0.14_72)] hover:text-[oklch(0.18_0.08_265)] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-[oklch(0.72_0.14_72)] uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>
                      <span className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © 2024 RapidVenta. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <a href="mailto:soporte@rapidventa.com" className="flex items-center gap-1.5 hover:text-white/70 transition-colors">
              <Mail className="w-3 h-3" />
              soporte@rapidventa.com
            </a>
            <a href="tel:+18005550100" className="flex items-center gap-1.5 hover:text-white/70 transition-colors">
              <Phone className="w-3 h-3" />
              +1 800 555 0100
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
