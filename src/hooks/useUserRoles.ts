import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type AppRole = "admin" | "user";
export type PermissionLevel = "none" | "view" | "edit";

export interface UserWithRole {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
  createdAt: string;
}

export interface SectionPermission {
  id: string;
  userId: string;
  section: string;
  permission: PermissionLevel;
}

export const SECTIONS = [
  { key: "clients", label: "Клиенты" },
  { key: "service-objects", label: "Объекты обслуживания" },
  { key: "documents", label: "Документы" },
  { key: "requests", label: "Заявки" },
  { key: "estimates", label: "Сметы" },
  { key: "invoices", label: "Счета" },
  { key: "assignments", label: "Наряды" },
  { key: "tasks", label: "Задачи" },
  { key: "employees", label: "Сотрудники" },
  { key: "teams", label: "Бригады" },
  { key: "spare-parts", label: "Запчасти" },
  { key: "warehouse-categories", label: "Категории склада" },
  { key: "stock-movements", label: "Движение товаров" },
] as const;

export function useIsAdmin() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .rpc("is_admin", { _user_id: user.id });
      
      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      return data ?? false;
    },
    enabled: !!user?.id,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ["all_users"],
    queryFn: async () => {
      // Get profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at");
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);

      return (profiles || []).map((p): UserWithRole => ({
        id: p.id,
        email: "", // Will be filled if needed
        fullName: p.full_name,
        role: rolesMap.get(p.id) || "user",
        createdAt: p.created_at,
      }));
    },
  });
}

export function useUserPermissions(userId: string | null) {
  return useQuery({
    queryKey: ["user_permissions", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("section_permissions")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;

      return (data || []).map((p): SectionPermission => ({
        id: p.id,
        userId: p.user_id,
        section: p.section,
        permission: p.permission as PermissionLevel,
      }));
    },
    enabled: !!userId,
  });
}

export function useMyPermissions() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  
  return useQuery({
    queryKey: ["my_permissions", user?.id, isAdmin],
    queryFn: async () => {
      if (!user?.id) return new Map<string, PermissionLevel>();
      
      // Admins have full edit access to everything
      if (isAdmin) {
        const permMap = new Map<string, PermissionLevel>();
        SECTIONS.forEach(s => permMap.set(s.key, "edit"));
        return permMap;
      }
      
      const { data, error } = await supabase
        .from("section_permissions")
        .select("section, permission")
        .eq("user_id", user.id);
      
      if (error) throw error;

      const permMap = new Map<string, PermissionLevel>();
      (data || []).forEach(p => {
        permMap.set(p.section, p.permission as PermissionLevel);
      });
      return permMap;
    },
    // Wait for isAdmin to be loaded before running this query
    enabled: !!user?.id && !isAdminLoading,
  });
}

// Hook to check if user can edit a specific section
export function useCanEdit(section: string) {
  const { data: permissions, isLoading } = useMyPermissions();
  
  if (isLoading || !permissions) return { canEdit: false, canView: false, isLoading };
  
  const permission = permissions.get(section);
  return {
    canEdit: permission === "edit",
    canView: permission === "view" || permission === "edit",
    isLoading,
  };
}

export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First try to update, if no rows affected then insert
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_users"] });
      queryClient.invalidateQueries({ queryKey: ["is_admin"] });
      toast.success("Роль обновлена");
    },
    onError: () => toast.error("Ошибка при обновлении роли"),
  });
}

export function useSetSectionPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, section, permission }: { userId: string; section: string; permission: PermissionLevel }) => {
      const { data: existing } = await supabase
        .from("section_permissions")
        .select("id")
        .eq("user_id", userId)
        .eq("section", section)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("section_permissions")
          .update({ permission })
          .eq("user_id", userId)
          .eq("section", section);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("section_permissions")
          .insert({ user_id: userId, section, permission });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user_permissions", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["my_permissions"] });
      toast.success("Доступ обновлён");
    },
    onError: () => toast.error("Ошибка при обновлении доступа"),
  });
}
