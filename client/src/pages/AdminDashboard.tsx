import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { mockLots, formatCurrency } from "@/lib/mockData";
import {
  TrendingUp, DollarSign, Users, Clock, Package, Gavel, CreditCard,
  ChevronDown, ShieldCheck, BarChart2, Bell, Settings, LogOut,
  CheckCircle, XCircle, AlertCircle, Search, Filter, Download,
  Eye, Edit, Trash2, UserPlus, RefreshCw, Lock, X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Mock data ──────────────────────────────────────────────────────────────────
const kpis = [
  { icon: DollarSign, label: "GMV Total", value: "$2.84M", change: "+12.4%", up: true },
  { icon: TrendingUp, label: "Ingresos", value: "$568K", change: "+8.2%", up: true },
  { icon: Users, label: "Usuarios", value: "38,241", change: "+5.1%", up: true },
  { icon: Clock, label: "En revisión", value: "5", change: "−2", up: false },
  { icon: Package, label: "Total lotes", value: "12,450", change: "+340", up: true },
  { icon: Gavel, label: "Total pujas", value: "284,120", change: "+1,240", up: true },
  { icon: CreditCard, label: "Pagos pend.", value: "12", change: "+3", up: false },
];

const chartData = [
  { month: "Ene", gmv: 180000, revenue: 36000 },
  { month: "Feb", gmv: 220000, revenue: 44000 },
  { month: "Mar", gmv: 195000, revenue: 39000 },
  { month: "Abr", gmv: 310000, revenue: 62000 },
  { month: "May", gmv: 280000, revenue: 56000 },
  { month: "Jun", gmv: 350000, revenue: 70000 },
  { month: "Jul", gmv: 420000, revenue: 84000 },
];

const categoryData = [
  { name: "Arte", value: 38 },
  { name: "Relojes", value: 27 },
  { name: "Deportes", value: 18 },
  { name: "Joyería", value: 11 },
  { name: "Otros", value: 6 },
];
const PIE_COLORS = ["oklch(0.25 0.12 265)", "oklch(0.72 0.14 72)", "oklch(0.55 0.18 145)", "oklch(0.55 0.22 27)", "oklch(0.65 0.06 265)"];

const mockUsers = [
  { id: "U001", name: "Juan García", email: "juan@email.com", role: "buyer", status: "active", kyc: "approved", joined: "2024-01-15", bids: 47 },
  { id: "U002", name: "Galería Sur", email: "galeria@email.com", role: "seller", status: "active", kyc: "approved", joined: "2024-02-20", bids: 0 },
  { id: "U003", name: "Dr. Martínez", email: "martinez@email.com", role: "expert", status: "active", kyc: "approved", joined: "2024-03-10", bids: 0 },
  { id: "U004", name: "María López", email: "maria@email.com", role: "buyer", status: "suspended", kyc: "pending", joined: "2024-06-01", bids: 3 },
  { id: "U005", name: "Arte Global S.A.", email: "arteglobal@email.com", role: "seller", status: "active", kyc: "approved", joined: "2023-11-15", bids: 0 },
];

const mockPayments = [
  { id: "PAY-001", user: "Juan García", lot: "Patek Philippe Nautilus 5711", amount: 114000, status: "completed", date: "2024-06-15", method: "Wire" },
  { id: "PAY-002", user: "María López", lot: "Óleo abstracto — Torres García", amount: 22200, status: "pending", date: "2024-07-01", method: "Card" },
  { id: "PAY-003", user: "Carlos Ruiz", lot: "Camiseta firmada — Messi 2022", amount: 8400, status: "overdue", date: "2024-06-28", method: "Crypto" },
  { id: "PAY-004", user: "Ana Martínez", lot: "Rolex Daytona 116500LN", amount: 38500, status: "completed", date: "2024-07-03", method: "Wire" },
];

const auditLog = [
  { ts: "2024-07-08 14:32", user: "admin@rapidventa.com", action: "Cambio de rol", detail: "U004 → buyer a suspended", ip: "192.168.1.1" },
  { ts: "2024-07-08 13:15", user: "expert@demo.com", action: "Lote aprobado", detail: "LOT-107 — Patek Philippe", ip: "10.0.0.5" },
  { ts: "2024-07-08 11:50", user: "admin@rapidventa.com", action: "Subasta creada", detail: "SUB-2024-08 — Arte Latinoamericano", ip: "192.168.1.1" },
  { ts: "2024-07-07 18:20", user: "system", action: "Pago vencido", detail: "PAY-003 — 48h sin pago", ip: "—" },
  { ts: "2024-07-07 16:05", user: "admin@rapidventa.com", action: "Comisión ajustada", detail: "Tier 1: 26% → 25%", ip: "192.168.1.1" },
];

const roleLabels: Record<string, string> = { buyer: "Comprador", seller: "Vendedor", expert: "Experto", admin: "Admin" };
const roleColors: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-700",
  seller: "bg-purple-100 text-purple-700",
  expert: "bg-amber-100 text-amber-700",
  admin: "bg-red-100 text-red-700",
};
const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};
const kycColors: Record<string, string> = {
  approved: "text-green-600",
  pending: "text-amber-600",
  rejected: "text-red-600",
};

// ── Sidebar nav items ──────────────────────────────────────────────────────────
const navItems = [
  { id: "overview", icon: BarChart2, label: "Resumen" },
  { id: "users", icon: Users, label: "Usuarios" },
  { id: "lots", icon: Package, label: "Lotes" },
  { id: "auctions", icon: Gavel, label: "Subastas" },
  { id: "payments", icon: CreditCard, label: "Pagos" },
  { id: "kyc", icon: ShieldCheck, label: "KYC / Revisión" },
  { id: "audit", icon: Clock, label: "Auditoría" },
  { id: "settings", icon: Settings, label: "Configuración" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[oklch(0.97_0.008_220)]">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-[oklch(0.25_0.12_265)] flex flex-col z-50">
            <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[oklch(0.72_0.14_72)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gavel className="w-4 h-4 text-[oklch(0.18_0.08_265)]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>RapidVenta</p>
                  <p className="text-white/40 text-[0.55rem] uppercase tracking-widest">Admin</p>
                </div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 px-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === item.id
                      ? "bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex bg-[oklch(0.25_0.12_265)] flex-col transition-all duration-200",
        sidebarOpen ? "w-56" : "w-14"
      )}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-[oklch(0.72_0.14_72)] rounded-lg flex items-center justify-center flex-shrink-0">
            <Gavel className="w-4 h-4 text-[oklch(0.18_0.08_265)]" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white font-bold text-sm leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>RapidVenta</p>
              <p className="text-white/40 text-[0.55rem] uppercase tracking-widest">Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === item.id
                  ? "bg-[oklch(0.72_0.14_72)] text-[oklch(0.18_0.08_265)]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 space-y-0.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-sm"
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Colapsar</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-red-300 hover:bg-white/10 text-sm">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Filter className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest">Panel de administración</p>
              <h1 className="font-bold text-[oklch(0.25_0.12_265)] text-base sm:text-lg leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {navItems.find((n) => n.id === activeTab)?.label ?? "Resumen"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="w-8 h-8 rounded-full bg-[oklch(0.25_0.12_265)] flex items-center justify-center text-[oklch(0.72_0.14_72)] font-bold text-xs">
                A
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 overflow-auto">

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="rv-kpi-card">
                    <kpi.icon className="w-4 h-4 text-[oklch(0.72_0.14_72)] mb-2" />
                    <p className="text-xl font-bold text-[oklch(0.25_0.12_265)] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {kpi.value}
                    </p>
                    <p className="text-[0.6rem] text-gray-400 mt-0.5 uppercase tracking-wide">{kpi.label}</p>
                    <p className={cn("text-[0.65rem] font-bold mt-1.5", kpi.up ? "text-green-600" : "text-red-500")}>
                      {kpi.change}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100">
                  <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-1">Volumen bruto mensual</p>
                  <h3 className="rv-section-title text-base mb-4">GMV & Revenue</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={18} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n === "gmv" ? "GMV" : "Revenue"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                      <Bar dataKey="gmv" fill="oklch(0.25 0.12 265)" radius={[3,3,0,0]} name="GMV" />
                      <Bar dataKey="revenue" fill="oklch(0.72 0.14 72)" radius={[3,3,0,0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest mb-1">Distribución</p>
                  <h3 className="rv-section-title text-base mb-4">GMV por categoría</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: "11px" }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 pt-5 pb-0">
                  <h3 className="rv-editorial-heading text-base">Actividad reciente</h3>
                </div>
                <div>
                  {auditLog.slice(0, 4).map((log, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 sm:px-6 py-3 rv-record-row text-sm">
                      <span className="text-[0.65rem] font-mono text-gray-400 sm:w-32 flex-shrink-0">{log.ts}</span>
                      <span className="font-semibold text-[oklch(0.25_0.12_265)] sm:w-28 flex-shrink-0 truncate">{log.action}</span>
                      <span className="text-gray-600 flex-1 truncate">{log.detail}</span>
                      <span className="hidden sm:block text-[0.65rem] text-gray-400 flex-shrink-0">{log.user}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar usuario..."
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[oklch(0.72_0.14_72)] w-full"
                  />
                </div>
                <button
                  onClick={() => toast.info("Función disponible en producción")}
                  className="flex items-center gap-1.5 rv-btn-primary text-xs px-4 py-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Nuevo usuario
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[oklch(0.97_0.008_220)]">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">ID</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Usuario</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Rol</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Estado</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">KYC</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Cambiar rol</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="rv-record-row">
                          <td className="px-5 py-3 font-mono text-xs text-gray-400">{user.id}</td>
                          <td className="px-3 py-3">
                            <div>
                              <p className="font-semibold text-[oklch(0.25_0.12_265)]">{user.name}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-sm", roleColors[user.role])}>
                              {roleLabels[user.role]}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-sm capitalize", statusColors[user.status])}>
                              {user.status === "active" ? "Activo" : user.status === "suspended" ? "Suspendido" : "Pendiente"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={cn("text-xs font-semibold capitalize", kycColors[user.kyc])}>
                              {user.kyc === "approved" ? "Aprobado" : user.kyc === "pending" ? "Pendiente" : "Rechazado"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="relative inline-block">
                              <select
                                defaultValue={user.role}
                                onChange={() => toast.success(`Rol actualizado`)}
                                className="appearance-none text-xs border border-gray-200 rounded px-2 py-1.5 pr-6 bg-white outline-none focus:border-[oklch(0.72_0.14_72)] cursor-pointer"
                              >
                                <option value="buyer">Comprador</option>
                                <option value="seller">Vendedor</option>
                                <option value="expert">Experto</option>
                                <option value="admin">Admin</option>
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => toast.info("Ver perfil")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[oklch(0.25_0.12_265)]">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => toast.info("Editar usuario")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[oklch(0.72_0.14_72)]">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => toast.info("Suspender usuario")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-amber-600">
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => toast.error("Eliminar usuario")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── LOTS ── */}
          {activeTab === "lots" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 pt-5 pb-0 flex items-center justify-between">
                <h3 className="rv-editorial-heading text-base">Gestión de lotes</h3>
                <button onClick={() => toast.info("Exportar CSV")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[oklch(0.25_0.12_265)] border border-gray-200 px-3 py-1.5 rounded-lg">
                  <Download className="w-3.5 h-3.5" />
                  Exportar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[oklch(0.97_0.008_220)]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Lote</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Categoría</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Puja actual</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Estado</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Pujas</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLots.map((lot) => (
                      <tr key={lot.id} className="rv-record-row">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img src={lot.image} alt="" className="w-10 h-8 object-cover rounded flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-[oklch(0.25_0.12_265)] text-xs truncate max-w-[180px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {lot.title}
                              </p>
                              <p className="text-[0.6rem] text-gray-400 font-mono">{lot.lotNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-600 text-xs">{lot.category}</td>
                        <td className="px-3 py-3 text-right font-bold text-[oklch(0.72_0.14_72)] text-xs">
                          {lot.status === "UPCOMING" ? <span className="text-gray-400">—</span> : formatCurrency(lot.currentBid)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {lot.status === "LIVE" && <span className="rv-badge-live"><span className="w-1.5 h-1.5 bg-white rounded-full rv-live-dot" />EN VIVO</span>}
                          {lot.status === "UPCOMING" && <span className="rv-badge-upcoming">PRÓXIMO</span>}
                          {lot.status === "ENDED" && <span className="rv-badge-ended">FINALIZADO</span>}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600 text-xs font-medium">{lot.bidCount}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => toast.info("Ver lote")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => toast.info("Editar lote")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => toast.error("Eliminar lote")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {activeTab === "payments" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 pt-5 pb-0">
                <h3 className="rv-editorial-heading text-base">Gestión de pagos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[oklch(0.97_0.008_220)]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">ID</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Comprador</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Lote</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Monto</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Método</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Estado</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPayments.map((p) => (
                      <tr key={p.id} className="rv-record-row">
                        <td className="px-5 py-3 font-mono text-xs text-gray-400">{p.id}</td>
                        <td className="px-3 py-3 font-semibold text-[oklch(0.25_0.12_265)] text-sm">{p.user}</td>
                        <td className="px-3 py-3 text-gray-600 text-xs max-w-[180px] truncate">{p.lot}</td>
                        <td className="px-3 py-3 text-right font-bold text-[oklch(0.72_0.14_72)]">{formatCurrency(p.amount)}</td>
                        <td className="px-3 py-3 text-center text-xs text-gray-500">{p.method}</td>
                        <td className="px-3 py-3 text-center">
                          {p.status === "completed" && <span className="flex items-center justify-center gap-1 text-xs font-bold text-green-700"><CheckCircle className="w-3 h-3" />Completado</span>}
                          {p.status === "pending" && <span className="flex items-center justify-center gap-1 text-xs font-bold text-amber-600"><AlertCircle className="w-3 h-3" />Pendiente</span>}
                          {p.status === "overdue" && <span className="flex items-center justify-center gap-1 text-xs font-bold text-red-600"><XCircle className="w-3 h-3" />Vencido</span>}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── KYC ── */}
          {activeTab === "kyc" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Pendientes de revisión", value: "5", color: "border-amber-400", icon: Clock, iconColor: "text-amber-600" },
                  { label: "Aprobados este mes", value: "23", color: "border-green-500", icon: CheckCircle, iconColor: "text-green-600" },
                  { label: "Rechazados", value: "3", color: "border-red-500", icon: XCircle, iconColor: "text-red-600" },
                ].map((s) => (
                  <div key={s.label} className={cn("rv-kpi-card border-t-4", s.color)}>
                    <s.icon className={cn("w-5 h-5 mb-2", s.iconColor)} />
                    <p className="text-2xl font-bold text-[oklch(0.25_0.12_265)]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 pt-5 pb-0">
                  <h3 className="rv-editorial-heading text-base">Solicitudes KYC pendientes</h3>
                </div>
                {mockUsers.filter((u) => u.kyc === "pending").map((user) => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 rv-record-row">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-[oklch(0.97_0.008_220)] flex items-center justify-center font-bold text-[oklch(0.25_0.12_265)] flex-shrink-0">
                        {user.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[oklch(0.25_0.12_265)]">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email} · {user.joined}</p>
                      </div>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-sm flex-shrink-0", roleColors[user.role])}>{roleLabels[user.role]}</span>
                    </div>
                    <div className="flex gap-2 sm:flex-shrink-0">
                      <button onClick={() => toast.success("KYC aprobado")} className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 flex-1 sm:flex-none justify-center">
                        <CheckCircle className="w-3 h-3" />Aprobar
                      </button>
                      <button onClick={() => toast.error("KYC rechazado")} className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 flex-1 sm:flex-none justify-center">
                        <XCircle className="w-3 h-3" />Rechazar
                      </button>
                    </div>
                  </div>
                ))}
                {mockUsers.filter((u) => u.kyc === "pending").length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">No hay solicitudes pendientes</div>
                )}
              </div>
            </div>
          )}

          {/* ── AUDIT ── */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 pt-5 pb-0 flex items-center justify-between">
                <h3 className="rv-editorial-heading text-base">Registro de auditoría</h3>
                <button onClick={() => toast.info("Exportar log")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg">
                  <Download className="w-3.5 h-3.5" />Exportar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[oklch(0.97_0.008_220)]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Timestamp</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Usuario</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Acción</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Detalle</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((log, i) => (
                      <tr key={i} className="rv-record-row">
                        <td className="px-5 py-3 font-mono text-xs text-gray-400">{log.ts}</td>
                        <td className="px-3 py-3 text-xs text-gray-600">{log.user}</td>
                        <td className="px-3 py-3 font-semibold text-xs text-[oklch(0.25_0.12_265)]">{log.action}</td>
                        <td className="px-3 py-3 text-xs text-gray-600">{log.detail}</td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-400">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="rv-editorial-heading text-base">Configuración de comisiones</h3>
                <div className="space-y-4">
                  {[
                    { label: "Buyer Premium — Tier 1 (hasta $100K)", value: "26" },
                    { label: "Buyer Premium — Tier 2 ($100K–$2M)", value: "21" },
                    { label: "Buyer Premium — Tier 3 (más de $2M)", value: "14.5" },
                    { label: "Comisión vendedor", value: "10" },
                  ].map((cfg) => (
                    <div key={cfg.label} className="flex items-center justify-between gap-4">
                      <label className="text-sm text-gray-700 flex-1">{cfg.label}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          defaultValue={cfg.value}
                          className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right outline-none focus:border-[oklch(0.72_0.14_72)]"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => toast.success("Configuración guardada")} className="mt-5 rv-btn-primary text-sm px-6 py-2">
                  Guardar cambios
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="rv-editorial-heading text-base">Configuración de subastas</h3>
                <div className="space-y-4">
                  {[
                    { label: "Extensión anti-sniping (minutos)", value: "3" },
                    { label: "Horas para pago tras adjudicación", value: "48" },
                    { label: "Incremento mínimo de puja (%)", value: "2" },
                  ].map((cfg) => (
                    <div key={cfg.label} className="flex items-center justify-between gap-4">
                      <label className="text-sm text-gray-700 flex-1">{cfg.label}</label>
                      <input
                        type="number"
                        defaultValue={cfg.value}
                        className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right outline-none focus:border-[oklch(0.72_0.14_72)]"
                      />
                    </div>
                  ))}
                </div>
                <button onClick={() => toast.success("Configuración guardada")} className="mt-5 rv-btn-primary text-sm px-6 py-2">
                  Guardar cambios
                </button>
              </div>
            </div>
          )}

          {/* ── AUCTIONS ── */}
          {activeTab === "auctions" && (
            <div className="text-center py-20">
              <Gavel className="w-12 h-12 mx-auto mb-4 text-gray-200" />
              <p className="text-sm text-gray-400">Módulo de gestión de subastas — disponible en la versión de producción</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
