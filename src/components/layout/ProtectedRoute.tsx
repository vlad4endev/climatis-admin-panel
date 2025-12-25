import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useMyPermissions, useIsAdmin, PermissionLevel, SECTIONS } from "@/hooks/useUserRoles";
import { AppLayout } from "./AppLayout";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: "view" | "edit";
}

// Map routes to section keys
const routeToSectionKey = (pathname: string): string | null => {
  const path = pathname.replace("/", "").split("/")[0];
  const validSections = [
    "clients", "service-objects", "documents", "requests", "estimates",
    "invoices", "assignments", "tasks", "employees", "teams",
    "spare-parts", "warehouse-categories", "stock-movements"
  ];
  return validSections.includes(path) ? path : null;
};

// Get first accessible section for redirect
const getFirstAccessibleSection = (permissions: Map<string, PermissionLevel> | undefined): string | null => {
  if (!permissions) return null;
  
  for (const section of SECTIONS) {
    const perm = permissions.get(section.key);
    if (perm === "view" || perm === "edit") {
      return `/${section.key}`;
    }
  }
  return null;
};

export function ProtectedRoute({ children, requiredPermission = "view" }: ProtectedRouteProps) {
  const { loading, user } = useAuth();
  const location = useLocation();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions();

  // Wait for all auth and permission data to load
  if (loading || isAdminLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check section permission
  const sectionKey = routeToSectionKey(location.pathname);
  
  // If it's a protected section (not users page or other admin routes)
  if (sectionKey && permissions) {
    const userPermission = permissions.get(sectionKey);
    
    // No access at all - show message but keep sidebar visible
    if (!userPermission || userPermission === "none") {
      // Try to redirect to first accessible section
      const firstAccessible = getFirstAccessibleSection(permissions);
      if (firstAccessible && location.pathname !== firstAccessible) {
        return <Navigate to={firstAccessible} replace />;
      }
      
      // No accessible sections - show message with sidebar
      return (
        <AppLayout>
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground py-20">
            <ShieldAlert className="h-16 w-16" />
            <h1 className="text-xl font-semibold">Нет доступа</h1>
            <p className="text-sm">У вас нет прав для просмотра этого раздела</p>
          </div>
        </AppLayout>
      );
    }
    
    // Check if edit permission is required but user only has view
    if (requiredPermission === "edit" && userPermission === "view") {
      return (
        <AppLayout>
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground py-20">
            <ShieldAlert className="h-16 w-16" />
            <h1 className="text-xl font-semibold">Только просмотр</h1>
            <p className="text-sm">У вас нет прав для редактирования в этом разделе</p>
          </div>
        </AppLayout>
      );
    }
  }

  return <>{children}</>;
}
