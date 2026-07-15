import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ChatbotWidget } from "./components/ChatbotWidget";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import LotDetail from "./pages/LotDetail";
import Auctions from "./pages/Auctions";
import Dashboard from "./pages/Dashboard";
import SellerPortal from "./pages/SellerPortal";
import ExpertPanel from "./pages/ExpertPanel";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HowToBid from "./pages/HowToBid";
import UserProfile from "./pages/UserProfile";
import Checkout from "./pages/Checkout";
import Invoices from "./pages/Invoices";
import Favorites from "./pages/Favorites";

// Public layout: Navbar + Footer + Chatbot
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}

// Dashboard layout: Navbar only (no footer) + Chatbot
function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <ChatbotWidget />
    </div>
  );
}

// Admin layout: no Navbar/Footer (uses internal sidebar)
function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

// Auth layout: no Navbar/Footer (full-screen auth pages)
function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={() => <PublicLayout><Home /></PublicLayout>} />
      <Route path="/catalog" component={() => <PublicLayout><Catalog /></PublicLayout>} />
      <Route path="/lot/:slug" component={() => <PublicLayout><LotDetail /></PublicLayout>} />
      <Route path="/auctions" component={() => <PublicLayout><Auctions /></PublicLayout>} />
      <Route path="/how-to-bid" component={() => <PublicLayout><HowToBid /></PublicLayout>} />

      {/* Auth pages (full-screen, no navbar) */}
      <Route path="/login" component={() => <AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" component={() => <AuthLayout><Register /></AuthLayout>} />

      {/* User profiles */}
      <Route path="/profile/:id" component={() => <PublicLayout><UserProfile /></PublicLayout>} />
      <Route path="/profile" component={() => <PublicLayout><UserProfile /></PublicLayout>} />

      {/* Checkout — minimal layout */}
      <Route path="/checkout" component={() => <AuthLayout><Checkout /></AuthLayout>} />

      {/* Dashboard pages */}
      <Route path="/invoices" component={() => <DashLayout><Invoices /></DashLayout>} />
      <Route path="/favorites" component={() => <DashLayout><Favorites /></DashLayout>} />
      <Route path="/dashboard" component={() => <DashLayout><Dashboard /></DashLayout>} />
      <Route path="/sell" component={() => <DashLayout><SellerPortal /></DashLayout>} />
      <Route path="/expert" component={() => <DashLayout><ExpertPanel /></DashLayout>} />

      {/* Admin — uses its own sidebar layout */}
      <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
