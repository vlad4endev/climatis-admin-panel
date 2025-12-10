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

const mockTeams = [
  { id: "1", teamName: "Бригада №1" },
  { id: "2", teamName: "Бригада №2" },
  { id: "3", teamName: "Бригада №3" },
];

const mockAssignments: Assignment[] = [
  {
    id: "1",
    assignmentNumber: "ЗД-2024-001",
    createdAt: "2024-01-16",
    status: "assigned",
    requestId: "1",
    requestNumber: "ЗВ-001",
    estimateId: "1",
    estimateName: "Расчёт по ремонту котла",
    teamId: "1",
    teamName: "Бригада №1",
    clientName: "ООО Ромашка",
    objectName: "Офис на Ленина 15",
    workBlocks: [
      {
        id: "1",
        description: "Диагностика котла",
        rows: [
          { category: "Инженер", planHours: 2, quantity: 1, rate: 1500 },
          { category: "Мастер", planHours: 0, quantity: 0, rate: 0 },
          { category: "Монтажник 6 разр.", planHours: 0, quantity: 0, rate: 0 },
          { category: "Монтажник 5 разр.", planHours: 0, quantity: 0, rate: 0 },
        ],
      },
      {
        id: "2",
        description: "Замена теплообменника",
        rows: [
          { category: "Инженер", planHours: 1, quantity: 1, rate: 1500 },
          { category: "Мастер", planHours: 2, quantity: 1, rate: 1200 },
          { category: "Монтажник 6 разр.", planHours: 4, quantity: 2, rate: 900 },
          { category: "Монтажник 5 разр.", planHours: 0, quantity: 0, rate: 0 },
        ],
      },
    ],
    materials: [
      { id: "1", materialName: "Теплообменник", quantity: 1, pricePerUnit: 25000 },
      { id: "2", materialName: "Прокладка", quantity: 2, pricePerUnit: 120 },
    ],
    comments: "Обратить внимание на состояние труб",
  },
];

export default function Assignments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>();
  const [newAssignmentData, setNewAssignmentData] = useState<Partial<Assignment> | null>(null);
  const [printingAssignment, setPrintingAssignment] = useState<Assignment | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if coming from Estimates page with data to create assignment
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
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return { bg: "bg-blue-500", text: "text-white" };
      case "assigned":
        return { bg: "bg-orange-500", text: "text-white" };
      case "completed":
        return { bg: "bg-green-500", text: "text-white" };
      default:
        return { bg: "bg-gray-400", text: "text-white" };
    }
  };

  const config: EntityListConfig<Assignment> = {
    getItemId: (item) => item.id,
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
      {
        key: "teamName",
        label: "Бригада",
        type: "text",
        searchable: true,
      },
      {
        key: "requestNumber",
        label: "Заявка",
        type: "text",
        searchable: true,
      },
      {
        key: "estimateName",
        label: "Расчёт",
        type: "text",
        searchable: true,
      },
      {
        key: "clientName",
        label: "Клиент",
        type: "text",
        searchable: true,
      },
      {
        key: "createdAt",
        label: "Дата создания",
        type: "date",
        sortable: true,
      },
    ],
    onUpdate: (id, field, value) => {
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === id ? { ...assignment, [field]: value } : assignment
        )
      );
      toast({
        title: "Задание обновлено",
        description: "Изменения сохранены",
      });
    },
    onDelete: (id) => {
      setAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
      toast({
        title: "Задание удалено",
      });
    },
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
      // Creating new assignment from estimate
      const newAssignment: Assignment = {
        id: Date.now().toString(),
        assignmentNumber: newAssignmentData.assignmentNumber || "",
        createdAt: newAssignmentData.createdAt || new Date().toISOString().split('T')[0],
        status: data.status as any || "new",
        requestId: newAssignmentData.requestId || "",
        requestNumber: newAssignmentData.requestNumber || "",
        estimateId: newAssignmentData.estimateId || "",
        estimateName: newAssignmentData.estimateName || "",
        teamId: data.teamId || "",
        teamName: data.teamName || "",
        workBlocks: newAssignmentData.workBlocks || [],
        materials: newAssignmentData.materials || [],
        comments: data.comments || "",
      };
      setAssignments((prev) => [newAssignment, ...prev]);
      toast({
        title: "Задание создано",
        description: `Задание ${newAssignment.assignmentNumber} успешно создано`,
      });
      setNewAssignmentData(null);
    } else if (editingAssignment?.id) {
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === editingAssignment.id
            ? { ...assignment, ...data }
            : assignment
        )
      );
      toast({
        title: "Задание обновлено",
      });
    }
    setIsFormOpen(false);
    setEditingAssignment(undefined);
  };

  const isNewAssignment = !!newAssignmentData;

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Задания"
        description="Управление заданиями для бригад"
      />

      <EntityList
        items={assignments}
        config={config}
        defaultViewMode="table"
      />

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerPrint(editingAssignment)}
                >
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
            teams={mockTeams}
          />
        </DialogContent>
      </Dialog>

      {/* Hidden print view */}
      <div className="hidden">
        {printingAssignment && (
          <AssignmentPrintView ref={printRef} assignment={printingAssignment} />
        )}
      </div>
    </div>
  );
}
