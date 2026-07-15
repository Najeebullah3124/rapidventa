/**
 * useRoleView — Hook para vistas dinámicas por rol en RapidVenta
 * Determina qué puede ver/hacer el usuario según su rol autenticado
 */
import { useAuth } from "@/_core/hooks/useAuth";

export type UserRole = "buyer" | "seller" | "expert" | "admin" | null;

export interface RolePermissions {
  // Rol actual
  role: UserRole;
  isAuthenticated: boolean;

  // Capacidades de compra
  canBid: boolean;
  canWatchlist: boolean;
  canViewOrders: boolean;

  // Capacidades de venta
  canConsign: boolean;
  canViewMyLots: boolean;
  canViewSellerPortal: boolean;

  // Capacidades de experto
  canReviewLots: boolean;
  canViewExpertPanel: boolean;

  // Capacidades de admin
  canManageAuctions: boolean;
  canManageUsers: boolean;
  canViewAdminDashboard: boolean;
  canApproveKyc: boolean;
  canViewAuditLog: boolean;
  canSetConfig: boolean;

  // Navegación — qué dashboards mostrar
  dashboardLinks: Array<{ label: string; href: string; icon: string }>;
}

export function useRoleView(): RolePermissions {
  const { user, isAuthenticated } = useAuth();
  const role = (user?.role as UserRole) ?? null;

  const isBuyer = role === "buyer";
  const isSeller = role === "seller";
  const isExpert = role === "expert";
  const isAdmin = role === "admin";

  const dashboardLinks: Array<{ label: string; href: string; icon: string }> = [];

  if (isBuyer || isAuthenticated) {
    dashboardLinks.push({ label: "Mi Dashboard", href: "/dashboard", icon: "LayoutDashboard" });
  }
  if (isSeller || isAdmin) {
    dashboardLinks.push({ label: "Portal Vendedor", href: "/sell", icon: "Package" });
  }
  if (isExpert || isAdmin) {
    dashboardLinks.push({ label: "Panel Experto", href: "/expert", icon: "Award" });
  }
  if (isAdmin) {
    dashboardLinks.push({ label: "Administración", href: "/admin", icon: "Shield" });
  }

  return {
    role,
    isAuthenticated,

    // Compra: cualquier usuario autenticado con KYC puede pujar
    canBid: isAuthenticated,
    canWatchlist: isAuthenticated,
    canViewOrders: isAuthenticated,

    // Venta: seller o admin
    canConsign: isSeller || isAdmin,
    canViewMyLots: isSeller || isAdmin,
    canViewSellerPortal: isSeller || isAdmin,

    // Experto: expert o admin
    canReviewLots: isExpert || isAdmin,
    canViewExpertPanel: isExpert || isAdmin,

    // Admin: solo admin
    canManageAuctions: isAdmin,
    canManageUsers: isAdmin,
    canViewAdminDashboard: isAdmin,
    canApproveKyc: isAdmin,
    canViewAuditLog: isAdmin,
    canSetConfig: isAdmin,

    dashboardLinks,
  };
}
