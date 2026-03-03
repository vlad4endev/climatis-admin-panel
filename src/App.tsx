import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMyPermissions, useIsAdmin, SECTIONS } from "@/hooks/useUserRoles";
import { Loader2 } from "lucide-react";
import Auth from "./pages/Auth";
import Clients from "./pages/Clients";
import Contacts from "./pages/Contacts";
import ServiceObjects from "./pages/ServiceObjects";
import Documents from "./pages/Documents";
import Employees from "./pages/Employees";
import Teams from "./pages/Teams";
import Requests from "./pages/Requests";
import Estimates from "./pages/Estimates";
import Assignments from "./pages/Assignments";
import SpareParts from "./pages/SpareParts";
import StockMovements from "./pages/StockMovements";
import WarehouseCategories from "./pages/WarehouseCategories";
import Tasks from "./pages/Tasks";
import Trash from "./pages/Trash";
import Users from "./pages/Users";
import ActivityLogs from "./pages/ActivityLogs";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Component to redirect to first accessible section
function RedirectToFirstAccessible() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions();
  
  if (isAdminLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Admin goes to clients
  if (isAdmin) {
    return <Navigate to="/clients" replace />;
  }
  
  // Find first accessible section
  if (permissions) {
    for (const section of SECTIONS) {
      const perm = permissions.get(section.key);
      if (perm === "view" || perm === "edit") {
        return <Navigate to={`/${section.key}`} replace />;
      }
    }
  }
  
  // No accessible sections - redirect to clients (will show access denied)
  return <Navigate to="/clients" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<ProtectedRoute><AppLayout><RedirectToFirstAccessible /></AppLayout></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/clients" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><AppLayout><Contacts /></AppLayout></ProtectedRoute>} />
            <Route path="/service-objects" element={<ProtectedRoute><AppLayout><ServiceObjects /></AppLayout></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><AppLayout><Documents /></AppLayout></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><AppLayout><Employees /></AppLayout></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><AppLayout><Teams /></AppLayout></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><AppLayout><Requests /></AppLayout></ProtectedRoute>} />
            <Route path="/estimates" element={<ProtectedRoute><AppLayout><Estimates /></AppLayout></ProtectedRoute>} />
            <Route path="/assignments" element={<ProtectedRoute><AppLayout><Assignments /></AppLayout></ProtectedRoute>} />
            <Route path="/spare-parts" element={<ProtectedRoute><AppLayout><SpareParts /></AppLayout></ProtectedRoute>} />
            <Route path="/stock-movements" element={<ProtectedRoute><AppLayout><StockMovements /></AppLayout></ProtectedRoute>} />
            <Route path="/warehouse-categories" element={<ProtectedRoute><AppLayout><WarehouseCategories /></AppLayout></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><AppLayout><Trash /></AppLayout></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><AppLayout><Users /></AppLayout></ProtectedRoute>} />
            <Route path="/activity-logs" element={<ProtectedRoute><AppLayout><ActivityLogs /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
