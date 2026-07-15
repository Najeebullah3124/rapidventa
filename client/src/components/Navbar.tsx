import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoleView } from "@/hooks/useRoleView";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";
import { Link, useLocation } from "wouter";
import {
  Phone, Mail, ChevronDown, Menu, X, Search, User,
  LayoutDashboard, Package, Award, Shield, Bell, LogOut
} from "lucide-react";

const roleIconMap: Record<string, any> = {
  LayoutDashboard, Package, Award, Shield, Bell,
};

const navLinks = [
  { key: "nav.home", href: "/" },
  { key: "nav.auctions", href: "/auctions" },
  { key: "nav.catalog", href: "/catalog" },
  { key: "nav.sell", href: "/sell" },
  { key: "nav.how", href: "/how-to-bid" },
  { key: "nav.help", href: "#" },
];

// accountMenuItems reemplazado por roleView.dashboardLinks dinámicos

export function Navbar() {
  const { t, lang, setLang } = useLang();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const roleView = useRoleView();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });
  // Conteo de notificaciones no leídas
  const { data: notifData } = trpc.notifications.list.useQuery(
    { unreadOnly: true, limit: 5 },
    { enabled: isAuthenticated }
  );
  const unreadCount = notifData?.length ?? 0;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Topbar — desktop only */}
      <div className="hidden md:block bg-[oklch(0.25_0.12_265)] text-white text-xs">
        <div className="container flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <a href="mailto:soporte@rapidventa.com" className="flex items-center gap-1.5 hover:text-[oklch(0.72_0.14_72)] transition-colors">
              <Mail className="w-3 h-3" />
              soporte@rapidventa.com
            </a>
            <a href="tel:+18005550100" className="flex items-center gap-1.5 hover:text-[oklch(0.72_0.14_72)] transition-colors">
              <Phone className="w-3 h-3" />
              {t("topbar.support")}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[oklch(0.72_0.14_72)] transition-colors">{t("topbar.how")}</a>
            <a href="/sell" className="hover:text-[oklch(0.72_0.14_72)] transition-colors">{t("topbar.sell")}</a>
            {/* Language toggle */}
            <div className="flex items-center gap-1 border border-white/20 rounded px-2 py-0.5">
              <button
                onClick={() => setLang("es")}
                className={cn("text-xs font-medium transition-colors", lang === "es" ? "text-[oklch(0.72_0.14_72)]" : "text-white/60 hover:text-white")}
              >
                ES
              </button>
              <span className="text-white/30">|</span>
              <button
                onClick={() => setLang("en")}
                className={cn("text-xs font-medium transition-colors", lang === "en" ? "text-[oklch(0.72_0.14_72)]" : "text-white/60 hover:text-white")}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav
        className={cn(
          "sticky top-0 z-50 bg-white border-b transition-shadow duration-200",
          scrolled ? "shadow-md border-gray-200" : "border-gray-100"
        )}
      >
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-[oklch(0.25_0.12_265)] flex items-center justify-center">
                <img src="/manus-storage/rv-logo-icon_698b0fa5.png" alt="RapidVenta" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <span className="font-bold text-[oklch(0.25_0.12_265)] text-lg leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  RapidVenta
                </span>
                <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest leading-none">Subastas de Lujo</p>
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.key} href={link.href}>
                <span
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded transition-colors",
                    location === link.href
                      ? "text-[oklch(0.25_0.12_265)] bg-[oklch(0.97_0.008_220)]"
                      : "text-gray-600 hover:text-[oklch(0.25_0.12_265)] hover:bg-gray-50"
                  )}
                >
                  {t(link.key)}
                </span>
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors">
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-xs">Buscar lotes...</span>
            </button>

            {/* Account dropdown */}
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-1.5 bg-[oklch(0.25_0.12_265)] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.32_0.10_265)] transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{t("nav.account")}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", accountOpen && "rotate-180")} />
              </button>

              {accountOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-1 rv-slide-up"
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Panel de acceso</p>
                  </div>
                  <div className="flex gap-1 p-2 border-b border-gray-100">
                    <Link href="/login">
                      <div className="flex-1 text-center text-xs font-semibold text-[oklch(0.25_0.12_265)] bg-[oklch(0.97_0.008_220)] hover:bg-[oklch(0.94_0.015_220)] px-3 py-1.5 rounded-lg transition-colors cursor-pointer" onClick={() => setAccountOpen(false)}>
                        Ingresar
                      </div>
                    </Link>
                    <Link href="/register">
                      <div className="flex-1 text-center text-xs font-semibold text-[oklch(0.18_0.08_265)] bg-[oklch(0.72_0.14_72)] hover:bg-[oklch(0.78_0.12_72)] px-3 py-1.5 rounded-lg transition-colors cursor-pointer" onClick={() => setAccountOpen(false)}>
                        Registrarse
                      </div>
                    </Link>
                  </div>
                  {/* Usuario autenticado: mostrar nombre y dashboards por rol */}
                  {isAuthenticated ? (
                    <>
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-[oklch(0.25_0.12_265)] truncate">{user?.name ?? "Usuario"}</p>
                        <p className="text-[0.65rem] text-gray-400 capitalize">{user?.role ?? "buyer"}</p>
                      </div>
                      {roleView.dashboardLinks.map((link) => {
                        const Icon = roleIconMap[link.icon] ?? LayoutDashboard;
                        return (
                          <Link key={link.href} href={link.href}>
                            <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[oklch(0.25_0.12_265)] transition-colors" onClick={() => setAccountOpen(false)}>
                              <Icon className="w-4 h-4" />
                              {link.label}
                            </div>
                          </Link>
                        );
                      })}
                      <div className="border-t border-gray-100 mt-1">
                        <button
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => { setAccountOpen(false); logoutMutation.mutate(); }}
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white rv-slide-up">
            <div className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.key} href={link.href}>
                  <span
                    className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-[oklch(0.25_0.12_265)] hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(link.key)}
                  </span>
                </Link>
              ))}
              {/* Mobile auth buttons */}
              <div className="border-t border-gray-100 mt-2 pt-3 flex gap-2">
                <Link href="/login">
                  <div className="flex-1 text-center text-sm font-semibold text-[oklch(0.25_0.12_265)] bg-[oklch(0.97_0.008_220)] px-4 py-2 rounded-lg" onClick={() => setMobileOpen(false)}>
                    Ingresar
                  </div>
                </Link>
                <Link href="/register">
                  <div className="flex-1 text-center text-sm font-semibold text-[oklch(0.18_0.08_265)] bg-[oklch(0.72_0.14_72)] px-4 py-2 rounded-lg" onClick={() => setMobileOpen(false)}>
                    Registrarse
                  </div>
                </Link>
              </div>
              {/* Mobile dashboards — dinámicos por rol */}
              {isAuthenticated && roleView.dashboardLinks.length > 0 && (
                <div className="border-t border-gray-100 mt-2 pt-3 space-y-1">
                  <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest px-3 mb-1">Mis Paneles</p>
                  {roleView.dashboardLinks.map((link) => {
                    const Icon = roleIconMap[link.icon] ?? LayoutDashboard;
                    return (
                      <Link key={link.href} href={link.href}>
                        <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                          <Icon className="w-4 h-4 text-gray-400" />
                          {link.label}
                        </div>
                      </Link>
                    );
                  })}
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => { setMobileOpen(false); logoutMutation.mutate(); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
              <div className="border-t border-gray-100 mt-2 pt-3 flex items-center gap-3">
                <span className="text-xs text-gray-500">Idioma:</span>
                <button
                  onClick={() => setLang("es")}
                  className={cn("text-sm font-medium", lang === "es" ? "text-[oklch(0.25_0.12_265)]" : "text-gray-400")}
                >ES</button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setLang("en")}
                  className={cn("text-sm font-medium", lang === "en" ? "text-[oklch(0.25_0.12_265)]" : "text-gray-400")}
                >EN</button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
