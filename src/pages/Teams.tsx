import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { Team } from "@/types/team";
import { Employee } from "@/types/employee";
import { TeamForm } from "@/components/teams/TeamForm";
import { PageHeader } from "@/components/layout/PageHeader";

const mockEmployees: Employee[] = [
  {
    id: '1',
    fullName: 'Иванов Иван Иванович',
    phone: '+7 (999) 123-45-67',
    position: 'Мастер',
    createdAt: new Date(),
  },
  {
    id: '2',
    fullName: 'Петров Петр Петрович',
    phone: '+7 (999) 234-56-78',
    position: 'Техник',
    createdAt: new Date(),
  },
  {
    id: '3',
    fullName: 'Сидоров Сидор Сидорович',
    phone: '+7 (999) 345-67-89',
    position: 'Монтажник',
    createdAt: new Date(),
  },
];

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([
    {
      id: '1',
      name: 'Бригада №1 (Монтаж)',
      leaderId: '1',
      leaderName: 'Иванов Иван Иванович',
      memberIds: ['1', '2'],
      memberNames: ['Иванов Иван Иванович', 'Петров Петр Петрович'],
      competencies: 'Монтаж кондиционеров, установка систем вентиляции',
      notes: 'Работает по будням',
      createdAt: new Date(),
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const config: EntityListConfig<Team> = {
    fields: [
      {
        key: 'name',
        label: 'Название бригады',
        type: 'text',
        sortable: true,
      },
      {
        key: 'leaderName',
        label: 'Ответственный',
        type: 'text',
        sortable: true,
      },
      {
        key: 'memberNames',
        label: 'Состав',
        type: 'text',
        render: (value) => {
          if (!value || !Array.isArray(value)) return '—';
          return value.join(', ');
        },
      },
      {
        key: 'competencies',
        label: 'Компетенции',
        type: 'textarea',
        render: (value) => value || '—',
      },
      {
        key: 'notes',
        label: 'Примечания',
        type: 'textarea',
      },
    ],
    getItemId: (item) => item.id,
    onEdit: (item) => {
      setEditingTeam(item);
      setIsDialogOpen(true);
    },
    onDelete: (id) => {
      setTeams(teams.filter((team) => team.id !== id));
    },
  };

  const handleSubmit = (data: Omit<Team, 'id' | 'createdAt' | 'leaderName' | 'memberNames'>) => {
    const leader = mockEmployees.find(e => e.id === data.leaderId);
    const members = mockEmployees.filter(e => data.memberIds.includes(e.id));

    if (editingTeam) {
      setTeams(
        teams.map((team) =>
          team.id === editingTeam.id
            ? {
                ...data,
                id: editingTeam.id,
                leaderName: leader?.fullName,
                memberNames: members.map(m => m.fullName),
                createdAt: editingTeam.createdAt,
              }
            : team
        )
      );
    } else {
      const newTeam: Team = {
        ...data,
        id: Date.now().toString(),
        leaderName: leader?.fullName,
        memberNames: members.map(m => m.fullName),
        createdAt: new Date(),
      };
      setTeams([...teams, newTeam]);
    }
    setIsDialogOpen(false);
    setEditingTeam(null);
  };

  return (
    <>
      <div className="container mx-auto py-6">
        <PageHeader
          title="Бригады"
          description="Управление рабочими бригадами"
          buttonLabel="Добавить бригаду"
          onButtonClick={() => setIsDialogOpen(true)}
        />

        <EntityList
          items={teams}
          config={config}
          emptyMessage="Нет бригад. Добавьте первую бригаду."
        />
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTeam(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Редактировать бригаду' : 'Новая бригада'}
            </DialogTitle>
          </DialogHeader>
          <TeamForm
            initialData={editingTeam || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingTeam(null);
            }}
            employees={mockEmployees}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
