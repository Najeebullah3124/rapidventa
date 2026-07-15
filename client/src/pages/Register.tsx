import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import {
  User, Building2, ShieldCheck, CheckCircle,
  Eye, EyeOff, Upload, ChevronRight, ChevronLeft, Gavel
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Role = "buyer" | "seller" | "expert";

const roles = [
  {
    id: "buyer" as Role,
    icon: User,
    title: "Comprador",
    subtitle: "Puja y adquiere piezas excepcionales",
    features: ["Acceso a todas las subastas", "Historial de pujas", "Alertas de precio", "Facturas automáticas"],
    color: "border-blue-200 bg-blue-50",
    activeColor: "border-[oklch(0.25_0.12_265)] bg-[oklch(0.25_0.12_265)]",
  },
  {
    id: "seller" as Role,
    icon: Building2,
    title: "Vendedor",
    subtitle: "Consigna y vende a compradores globales",
    features: ["Consignación de lotes", "Seguimiento en tiempo real", "Reporte de comisiones", "Soporte dedicado"],
    color: "border-purple-200 bg-purple-50",
    activeColor: "border-[oklch(0.25_0.12_265)] bg-[oklch(0.25_0.12_265)]",
  },
  {
    id: "expert" as Role,
    icon: ShieldCheck,
    title: "Experto",
    subtitle: "Valúa y certifica piezas de colección",
    features: ["Panel de valuación", "Certificación de autenticidad", "Historial de revisiones", "Honorarios por lote"],
    color: "border-amber-200 bg-amber-50",
    activeColor: "border-[oklch(0.25_0.12_265)] bg-[oklch(0.25_0.12_265)]",
  },
];

const steps = ["Tipo de cuenta", "Datos personales", "Verificación KYC", "Confirmación"];

export default function Register() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
    country: "", idType: "passport", idFile: null as File | null,
    selfie: null as File | null, company: "", specialty: "",
    acceptTerms: false, acceptPrivacy: false,
  });

  const update = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  const nextStep = () => {
    if (step === 0 && !role) { toast.error("Selecciona un tipo de cuenta."); return; }
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        toast.error("Completa todos los campos obligatorios."); return;
      }
    }
    if (step === 2) {
      if (!form.acceptTerms || !form.acceptPrivacy) {
        toast.error("Debes aceptar los términos y la política de privacidad."); return;
      }
    }
    if (step < steps.length - 1) setStep(step + 1);
    else {
      toast.success("¡Cuenta creada! Revisa tu correo para verificar.");
      setTimeout(() => navigate("/dashboard"), 1500);
    }
  };

  const selectedRole = roles.find((r) => r.id === role);

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.008_220)] flex flex-col">
      {/* Top bar */}
      <div className="bg-[oklch(0.25_0.12_265)] py-4 px-6 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-[oklch(0.72_0.14_72)] rounded-lg flex items-center justify-center">
              <Gavel className="w-4 h-4 text-[oklch(0.18_0.08_265)]" />
            </div>
            <span className="text-white font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>RapidVenta</span>
          </div>
        </Link>
        <p className="text-white/50 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login">
            <span className="text-[oklch(0.72_0.14_72)] font-semibold hover:underline cursor-pointer">Ingresar</span>
          </Link>
        </p>
      </div>

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {/* Progress stepper */}
          <div className="flex items-center justify-between mb-8 sm:mb-10 overflow-x-auto">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    i < step ? "bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)]" :
                    i === step ? "bg-[oklch(0.25_0.12_265)] text-white" :
                    "bg-gray-200 text-gray-400"
                  )}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <p className={cn("text-[0.55rem] sm:text-[0.6rem] mt-1 uppercase tracking-wide font-semibold whitespace-nowrap hidden sm:block", i === step ? "text-[oklch(0.25_0.12_265)]" : "text-gray-400")}>
                    {s}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2 mt-[-1rem]", i < step ? "bg-[oklch(0.72_0.14_72)]" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Step header */}
            <div className="bg-[oklch(0.25_0.12_265)] px-5 sm:px-8 py-4 sm:py-5">
              <p className="text-[oklch(0.72_0.14_72)] text-[0.65rem] font-semibold uppercase tracking-[0.2em] mb-1">
                Paso {step + 1} de {steps.length}
              </p>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                {steps[step]}
              </h2>
            </div>

            <div className="p-5 sm:p-8">
              {/* STEP 0: Role selection */}
              {step === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-6">Selecciona el tipo de cuenta que mejor describe tu actividad en RapidVenta.</p>
                  {roles.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all",
                        role === r.id
                          ? "border-[oklch(0.25_0.12_265)] bg-[oklch(0.97_0.008_220)]"
                          : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        role === r.id ? "bg-[oklch(0.25_0.12_265)]" : "bg-gray-100"
                      )}>
                        <r.icon className={cn("w-5 h-5", role === r.id ? "text-[oklch(0.72_0.14_72)]" : "text-gray-500")} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {r.title}
                          </p>
                          {role === r.id && (
                            <span className="text-[0.6rem] bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Seleccionado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{r.subtitle}</p>
                        <div className="flex flex-wrap gap-2">
                          {r.features.map((f) => (
                            <span key={f} className="text-[0.65rem] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        role === r.id ? "border-[oklch(0.25_0.12_265)] bg-[oklch(0.25_0.12_265)]" : "border-gray-300"
                      )}>
                        {role === r.id && <div className="w-2 h-2 bg-[oklch(0.72_0.14_72)] rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 1: Personal data */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre *</label>
                      <input
                        value={form.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        placeholder="Juan"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Apellido *</label>
                      <input
                        value={form.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                        placeholder="García"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Correo electrónico *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Teléfono</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+52 55 1234 5678"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">País de residencia</label>
                    <select
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] bg-white"
                    >
                      <option value="">Seleccionar país</option>
                      <option>México</option>
                      <option>Colombia</option>
                      <option>Argentina</option>
                      <option>España</option>
                      <option>Estados Unidos</option>
                      <option>Otro</option>
                    </select>
                  </div>

                  {role === "seller" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre de galería / empresa</label>
                      <input
                        value={form.company}
                        onChange={(e) => update("company", e.target.value)}
                        placeholder="Galería Sur S.A."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                      />
                    </div>
                  )}

                  {role === "expert" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Especialidad</label>
                      <select
                        value={form.specialty}
                        onChange={(e) => update("specialty", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] bg-white"
                      >
                        <option value="">Seleccionar especialidad</option>
                        <option>Arte latinoamericano</option>
                        <option>Relojes de lujo</option>
                        <option>Deportes y coleccionables</option>
                        <option>Joyería y gemas</option>
                        <option>Numismática</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Contraseña *</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-[oklch(0.72_0.14_72)] transition-colors"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password strength */}
                    {form.password && (
                      <div className="mt-2 flex gap-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={cn("flex-1 h-1 rounded-full transition-colors",
                            form.password.length >= i * 2 + 4
                              ? i <= 2 ? "bg-amber-400" : "bg-green-500"
                              : "bg-gray-100"
                          )} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: KYC */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[oklch(0.72_0.14_72)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[oklch(0.25_0.12_265)]">Verificación de identidad (KYC)</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Requerida por regulaciones anti-lavado. Tus datos están protegidos y encriptados.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Tipo de documento</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: "passport", label: "Pasaporte" },
                        { value: "id", label: "INE / Cédula" },
                        { value: "license", label: "Licencia" },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="idType"
                            value={opt.value}
                            checked={form.idType === opt.value}
                            onChange={() => update("idType", opt.value)}
                            className="accent-[oklch(0.72_0.14_72)]"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Foto del documento (frente)
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[oklch(0.72_0.14_72)] transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Haz clic o arrastra la imagen</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG — máx. 5 MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Selfie sosteniendo el documento
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[oklch(0.72_0.14_72)] transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Haz clic o arrastra la imagen</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG — máx. 5 MB</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.acceptTerms}
                        onChange={(e) => update("acceptTerms", e.target.checked)}
                        className="w-4 h-4 accent-[oklch(0.72_0.14_72)] mt-0.5"
                      />
                      <span className="text-sm text-gray-600">
                        Acepto los{" "}
                        <span className="text-[oklch(0.72_0.14_72)] font-semibold underline cursor-pointer">Términos y Condiciones</span>{" "}
                        de RapidVenta
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.acceptPrivacy}
                        onChange={(e) => update("acceptPrivacy", e.target.checked)}
                        className="w-4 h-4 accent-[oklch(0.72_0.14_72)] mt-0.5"
                      />
                      <span className="text-sm text-gray-600">
                        He leído y acepto la{" "}
                        <span className="text-[oklch(0.72_0.14_72)] font-semibold underline cursor-pointer">Política de Privacidad</span>{" "}
                        y el tratamiento de mis datos
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: Confirmation */}
              {step === 3 && (
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-[oklch(0.25_0.12_265)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    ¡Registro completado!
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
                    Tu cuenta de <strong>{selectedRole?.title}</strong> ha sido creada. Revisa tu correo para verificar tu dirección y activar tu cuenta.
                  </p>

                  <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-5 text-left max-w-sm mx-auto mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Resumen de registro</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tipo de cuenta</span>
                        <span className="font-semibold text-[oklch(0.25_0.12_265)]">{selectedRole?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nombre</span>
                        <span className="font-semibold text-[oklch(0.25_0.12_265)]">{form.firstName} {form.lastName}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500 flex-shrink-0">Correo</span>
                        <span className="font-semibold text-[oklch(0.25_0.12_265)] truncate text-right">{form.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">KYC</span>
                        <span className="text-amber-600 font-semibold">En revisión (24-48h)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                {step > 0 && step < 3 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex-1 rv-btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5"
                >
                  {step === 3 ? "Ir a mi cuenta" : step === 2 ? "Crear cuenta" : "Continuar"}
                  {step < 3 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
