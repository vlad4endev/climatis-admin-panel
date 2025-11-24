import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Clients from "./pages/Clients";
import ServiceObjects from "./pages/ServiceObjects";
import Documents from "./pages/Documents";
import Employees from "./pages/Employees";
import Teams from "./pages/Teams";
import Requests from "./pages/Requests";
import Estimates from "./pages/Estimates";
import SpareParts from "./pages/SpareParts";
import StockMovements from "./pages/StockMovements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/clients" replace />} />
          <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
          <Route path="/service-objects" element={<AppLayout><ServiceObjects /></AppLayout>} />
          <Route path="/documents" element={<AppLayout><Documents /></AppLayout>} />
          <Route path="/employees" element={<AppLayout><Employees /></AppLayout>} />
          <Route path="/teams" element={<AppLayout><Teams /></AppLayout>} />
          <Route path="/requests" element={<AppLayout><Requests /></AppLayout>} />
          <Route path="/estimates" element={<AppLayout><Estimates /></AppLayout>} />
          <Route path="/spare-parts" element={<AppLayout><SpareParts /></AppLayout>} />
          <Route path="/stock-movements" element={<AppLayout><StockMovements /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
