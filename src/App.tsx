import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Clients from "./pages/Clients";
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
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/clients" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/clients" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
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
            <Route path="/users" element={<ProtectedRoute><AppLayout><Users /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
