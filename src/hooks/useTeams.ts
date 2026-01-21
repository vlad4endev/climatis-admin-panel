import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Team } from "@/types/team";
import { toast } from "sonner";

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          *,
          leader:employees!teams_leader_id_fkey(id, full_name),
          team_members(
            employee:employees(id, full_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (teamsError) throw teamsError;

      return teamsData.map((row): Team => ({
        id: row.id,
        name: row.name,
        leaderId: row.leader_id || "",
        leaderName: row.leader?.full_name || "",
        memberIds: row.team_members?.map((m: any) => m.employee?.id).filter(Boolean) || [],
        memberNames: row.team_members?.map((m: any) => m.employee?.full_name).filter(Boolean) || [],
        competencies: row.competencies || "",
        notes: row.notes || "",
        createdAt: new Date(row.created_at),
      }));
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: Omit<Team, "id" | "createdAt" | "leaderName" | "memberNames">) => {
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: team.name,
          leader_id: team.leaderId || null,
          competencies: team.competencies,
          notes: team.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Add team members
      if (team.memberIds.length > 0) {
        const { error: membersError } = await supabase
          .from("team_members")
          .insert(team.memberIds.map(employeeId => ({
            team_id: data.id,
            employee_id: employeeId,
          })));
        if (membersError) throw membersError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Бригада создана");
    },
    onError: () => toast.error("Ошибка при создании бригады"),
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...team }: Omit<Team, "createdAt" | "leaderName" | "memberNames">) => {
      const { error } = await supabase
        .from("teams")
        .update({
          name: team.name,
          leader_id: team.leaderId || null,
          competencies: team.competencies,
          notes: team.notes,
        })
        .eq("id", id);

      if (error) throw error;

      // Update team members - delete old and insert new
      await supabase.from("team_members").delete().eq("team_id", id);
      
      if (team.memberIds.length > 0) {
        const { error: membersError } = await supabase
          .from("team_members")
          .insert(team.memberIds.map(employeeId => ({
            team_id: id,
            employee_id: employeeId,
          })));
        if (membersError) throw membersError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Бригада обновлена");
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Hard delete for teams (no soft delete column)
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Бригада удалена");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
