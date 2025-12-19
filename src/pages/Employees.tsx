import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { Employee } from "@/types/employee";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { Loader2 } from "lucide-react";

export default function Employees() {
  const { data: employees = [], isLoading, error } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const config: EntityListConfig<Employee> = {
    fields: [
      { key: 'fullName', label: 'ФИО', type: 'text', sortable: true },
      { key: 'phone', label: 'Телефон', type: 'phone', sortable: true },
      { key: 'position', label: 'Должность', type: 'text', sortable: true },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingEmployee(item),
    onEdit: (item) => {
      setEditingEmployee(item);
      setIsDialogOpen(true);
    },
    onDelete: (id) => deleteEmployee.mutate(id),
  };

  const handleSubmit = async (data: Omit<Employee, 'id' | 'createdAt'>) => {
    if (editingEmployee) {
      await updateEmployee.mutateAsync({ id: editingEmployee.id, ...data });
    } else {
      await createEmployee.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingEmployee(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Ошибка загрузки: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Сотрудники"
          description="Управление сотрудниками компании"
          buttonLabel="Добавить сотрудника"
          onButtonClick={() => setIsDialogOpen(true)}
        />
        <EntityList items={employees} config={config} emptyMessage="Нет сотрудников. Добавьте первого сотрудника." />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEmployee(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            initialData={editingEmployee || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setIsDialogOpen(false); setEditingEmployee(null); }}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingEmployee}
        open={!!viewingEmployee}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
        config={config}
        title={viewingEmployee?.fullName}
      />
    </>
  );
}
