import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { Eye, EyeOff, ShieldCheck, Gavel } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Login() {
  const { lang } = useLang();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Demo quick-access roles
  const demoRoles = [
    { label: "Comprador", email: "comprador@demo.com", route: "/dashboard", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Vendedor", email: "vendedor@demo.com", route: "/sell", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { label: "Experto", email: "experto@demo.com", route: "/expert", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Admin", email: "admin@demo.com", route: "/admin", color: "bg-red-50 text-red-700 border-red-200" },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Completa todos los campos."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Sesión iniciada correctamente.");
      navigate("/dashboard");
    }, 1200);
  };

  const handleDemo = (route: string, label: string) => {
    toast.success(`Accediendo como ${label} (demo)`);
    setTimeout(() => navigate(route), 600);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — editorial luxury */}
      <div className="hidden lg:flex lg:w-1/2 bg-[oklch(0.25_0.12_265)] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, oklch(0.72 0.14 72) 0, oklch(0.72 0.14 72) 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

        <div className="relative z-10">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-[oklch(0.72_0.14_72)] rounded-lg flex items-center justify-center">
                <Gavel className="w-5 h-5 text-[oklch(0.18_0.08_265)]" />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>RapidVenta</p>
                <p className="text-white/40 text-[0.6rem] uppercase tracking-widest">Subastas de Lujo</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <span className="block w-10 h-0.5 bg-[oklch(0.72_0.14_72)] mb-6" />
          <blockquote className="text-white/90 text-3xl font-bold leading-snug mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            "La casa donde las piezas excepcionales encuentran a sus verdaderos dueños."
          </blockquote>
          <p className="text-white/50 text-sm">Verificación experta · Buyer premium transparente · Soporte 24/7</p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          {[
            { value: "38,241+", label: "Compradores" },
            { value: "$2.84M", label: "GMV total" },
            { value: "47", label: "Países" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[oklch(0.72_0.14_72)] text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
              <p className="text-white/40 text-xs uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[oklch(0.25_0.12_265)] rounded-lg flex items-center justify-center">
              <Gavel className="w-4 h-4 text-[oklch(0.72_0.14_72)]" />
            </div>
            <span className="font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>RapidVenta</span>
          </div>

          <div className="mb-8">
            <p className="text-[oklch(0.72_0.14_72)] text-xs font-semibold uppercase tracking-[0.2em] mb-2">Bienvenido</p>
            <h1 className="text-3xl font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Iniciar sesión
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              ¿No tienes cuenta?{" "}
              <Link href="/register">
                <span className="text-[oklch(0.72_0.14_72)] font-semibold hover:underline cursor-pointer">Regístrate</span>
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraseña</label>
                <Link href="/forgot-password">
                  <span className="text-xs text-[oklch(0.72_0.14_72)] hover:underline cursor-pointer">¿Olvidaste tu contraseña?</span>
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rv-btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-[oklch(0.18_0.08_265)] border-t-transparent rounded-full animate-spin" />Verificando...</>
              ) : "Ingresar"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wide">Acceso demo rápido</span>
            </div>
          </div>

          {/* Demo role buttons */}
          <div className="grid grid-cols-2 gap-2">
            {demoRoles.map((role) => (
              <button
                key={role.label}
                onClick={() => handleDemo(role.route, role.label)}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-semibold transition-all hover:shadow-sm active:scale-[0.97]",
                  role.color
                )}
              >
                {role.label}
              </button>
            ))}
          </div>

          <p className="text-center text-[0.65rem] text-gray-400 mt-6">
            Al ingresar aceptas nuestros{" "}
            <span className="underline cursor-pointer hover:text-gray-600">Términos de uso</span>{" "}
            y{" "}
            <span className="underline cursor-pointer hover:text-gray-600">Política de privacidad</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
