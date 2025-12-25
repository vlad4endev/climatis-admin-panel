import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { Team } from "@/types/team";
import { TeamForm } from "@/components/teams/TeamForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from "@/hooks/useTeams";
import { useEmployees } from "@/hooks/useEmployees";
import { useCanEdit } from "@/hooks/useUserRoles";
import { Loader2 } from "lucide-react";

export default function Teams() {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { canEdit } = useCanEdit("teams");
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);

  const config: EntityListConfig<Team> = {
    fields: [
      { key: 'name', label: 'Название бригады', type: 'text', sortable: true },
      { key: 'leaderName', label: 'Ответственный', type: 'text', sortable: true },
      {
        key: 'memberNames',
        label: 'Состав',
        type: 'text',
        render: (value) => {
          if (!value || !Array.isArray(value)) return '—';
          return value.join(', ');
        },
      },
      { key: 'competencies', label: 'Компетенции', type: 'textarea', render: (value) => value || '—' },
      { key: 'notes', label: 'Примечания', type: 'textarea' },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingTeam(item),
    onEdit: canEdit ? (item) => { setEditingTeam(item); setIsDialogOpen(true); } : undefined,
    onDelete: canEdit ? (id) => deleteTeam.mutate(id) : undefined,
  };

  const handleSubmit = async (data: Omit<Team, 'id' | 'createdAt' | 'leaderName' | 'memberNames'>) => {
    if (editingTeam) {
      await updateTeam.mutateAsync({ id: editingTeam.id, ...data });
    } else {
      await createTeam.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingTeam(null);
  };

  if (teamsLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Бригады"
          description="Управление рабочими бригадами"
          buttonLabel={canEdit ? "Добавить бригаду" : undefined}
          onButtonClick={canEdit ? () => setIsDialogOpen(true) : undefined}
        />
        <EntityList items={teams} config={config} emptyMessage="Нет бригад. Добавьте первую бригаду." />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTeam(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Редактировать бригаду' : 'Новая бригада'}</DialogTitle>
          </DialogHeader>
          <TeamForm
            initialData={editingTeam || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setIsDialogOpen(false); setEditingTeam(null); }}
            employees={employees}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingTeam}
        open={!!viewingTeam}
        onOpenChange={(open) => !open && setViewingTeam(null)}
        config={config}
        title={viewingTeam?.name}
      />
    </>
  );
}
