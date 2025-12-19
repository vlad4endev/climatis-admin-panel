import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { Assignment, ASSIGNMENT_STATUSES } from "@/types/assignment";
import { AssignmentForm } from "@/components/assignments/AssignmentForm";
import { AssignmentPrintView } from "@/components/assignments/AssignmentPrintView";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReactToPrint } from "react-to-print";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment } from "@/hooks/useAssignments";
import { useTeams } from "@/hooks/useTeams";
import { Skeleton } from "@/components/ui/skeleton";

export default function Assignments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const { data: assignments = [], isLoading } = useAssignments();
  const { data: teamsData = [] } = useTeams();
  
  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();

  const teams = teamsData.map(t => ({ id: t.id, teamName: t.name }));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>();
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [newAssignmentData, setNewAssignmentData] = useState<Partial<Assignment> | null>(null);
  const [printingAssignment, setPrintingAssignment] = useState<Assignment | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      const storedData = sessionStorage.getItem('newAssignmentFromEstimate');
      if (storedData) {
        const data = JSON.parse(storedData);
        const newAssignment: Partial<Assignment> = {
          assignmentNumber: `ЗД-${new Date().getFullYear()}-${String(assignments.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString().split('T')[0],
          status: "new",
          requestId: data.requestId,
          requestNumber: data.requestNumber,
          estimateId: data.estimateId,
          estimateName: data.estimateName,
          workBlocks: data.workBlocks,
          materials: data.materials,
          comments: data.comments,
          teamId: "",
          teamName: "",
        };
        setNewAssignmentData(newAssignment);
        setEditingAssignment(newAssignment as Assignment);
        setIsFormOpen(true);
        sessionStorage.removeItem('newAssignmentFromEstimate');
        setSearchParams({});
      }
    }
  }, [searchParams, assignments.length, setSearchParams]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingAssignment ? `Задание_${printingAssignment.assignmentNumber}` : "Задание",
    onAfterPrint: () => {
      setPrintingAssignment(null);
      toast({ title: "Документ отправлен на печать" });
    },
  });

  const triggerPrint = (assignment: Assignment) => {
    setPrintingAssignment(assignment);
    setTimeout(() => handlePrint(), 100);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new": return { bg: "bg-blue-500", text: "text-white" };
      case "assigned": return { bg: "bg-orange-500", text: "text-white" };
      case "completed": return { bg: "bg-green-500", text: "text-white" };
      default: return { bg: "bg-gray-400", text: "text-white" };
    }
  };

  const config: EntityListConfig<Assignment> = {
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingAssignment(item),
    fields: [
      {
        key: "assignmentNumber",
        label: "Номер задания",
        type: "text",
        searchable: true,
        render: (value) => <span className="font-medium">{value}</span>,
      },
      {
        key: "status",
        label: "Статус",
        type: "select",
        options: ASSIGNMENT_STATUSES,
        filterable: true,
        editable: true,
        render: (value) => {
          const status = ASSIGNMENT_STATUSES.find((s) => s.value === value);
          const variant = getStatusBadgeVariant(value);
          return (
            <Badge className={`${variant.bg} ${variant.text} border-transparent`}>
              {status?.label || value}
            </Badge>
          );
        },
      },
      { key: "teamName", label: "Бригада", type: "text", searchable: true },
      { key: "requestNumber", label: "Заявка", type: "text", searchable: true },
      { key: "estimateName", label: "Расчёт", type: "text", searchable: true },
      { key: "clientName", label: "Клиент", type: "text", searchable: true },
      { key: "createdAt", label: "Дата создания", type: "date", sortable: true },
    ],
    onUpdate: (id, field, value) => {
      const assignment = assignments.find(a => a.id === id);
      if (assignment) {
        updateMutation.mutate({ id, ...assignment, [field]: value });
      }
    },
    onDelete: (id) => deleteMutation.mutate(id),
    onEdit: (assignment) => {
      setNewAssignmentData(null);
      setEditingAssignment(assignment);
      setIsFormOpen(true);
    },
    customActions: (item) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          triggerPrint(item);
        }}
        title="Распечатать"
      >
        <Printer className="h-4 w-4" />
      </Button>
    ),
  };

  const handleSubmit = (data: Partial<Assignment>) => {
    if (newAssignmentData) {
      createMutation.mutate({
        status: data.status || "new",
        requestId: newAssignmentData.requestId,
        estimateId: newAssignmentData.estimateId,
        teamId: data.teamId,
        comments: data.comments || "",
      }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingAssignment(undefined);
          setNewAssignmentData(null);
        }
      });
    } else if (editingAssignment?.id) {
      updateMutation.mutate({ id: editingAssignment.id, ...data }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingAssignment(undefined);
        }
      });
    }
  };

  const isNewAssignment = !!newAssignmentData;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Задания" description="Управление заданиями для бригад" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Задания" description="Управление заданиями для бригад" />

      <EntityList items={assignments} config={config} defaultViewMode="table" />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) {
          setNewAssignmentData(null);
          setEditingAssignment(undefined);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isNewAssignment ? "Создать задание" : `Задание ${editingAssignment?.assignmentNumber}`}</span>
              {editingAssignment && !isNewAssignment && (
                <Button variant="outline" size="sm" onClick={() => triggerPrint(editingAssignment)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Распечатать
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <AssignmentForm
            assignment={editingAssignment}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingAssignment(undefined);
              setNewAssignmentData(null);
            }}
            teams={teams}
          />
        </DialogContent>
      </Dialog>

      <div className="hidden">
        {printingAssignment && (
          <AssignmentPrintView ref={printRef} assignment={printingAssignment} />
        )}
      </div>

      <Dialog open={!!viewingAssignment} onOpenChange={(open) => !open && setViewingAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Просмотр задания {viewingAssignment?.assignmentNumber}</DialogTitle>
          </DialogHeader>
          {viewingAssignment && (
            <AssignmentForm
              assignment={viewingAssignment}
              onSubmit={() => {}}
              onCancel={() => setViewingAssignment(null)}
              teams={teams}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
