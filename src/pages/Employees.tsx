import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { Employee } from "@/types/employee";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([
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
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const config: EntityListConfig<Employee> = {
    fields: [
      {
        key: 'fullName',
        label: 'ФИО',
        type: 'text',
        sortable: true,
      },
      {
        key: 'phone',
        label: 'Телефон',
        type: 'phone',
        sortable: true,
      },
      {
        key: 'position',
        label: 'Должность',
        type: 'text',
        sortable: true,
      },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingEmployee(item),
    onEdit: (item) => {
      setEditingEmployee(item);
      setIsDialogOpen(true);
    },
    onDelete: (id) => {
      setEmployees(employees.filter((emp) => emp.id !== id));
    },
  };

  const handleSubmit = (data: Omit<Employee, 'id' | 'createdAt'>) => {
    if (editingEmployee) {
      setEmployees(
        employees.map((emp) =>
          emp.id === editingEmployee.id
            ? { ...data, id: editingEmployee.id, createdAt: editingEmployee.createdAt }
            : emp
        )
      );
    } else {
      const newEmployee: Employee = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setEmployees([...employees, newEmployee]);
    }
    setIsDialogOpen(false);
    setEditingEmployee(null);
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Сотрудники"
          description="Управление сотрудниками компании"
          buttonLabel="Добавить сотрудника"
          onButtonClick={() => setIsDialogOpen(true)}
        />

        <EntityList
          items={employees}
          config={config}
          emptyMessage="Нет сотрудников. Добавьте первого сотрудника."
        />
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingEmployee(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            initialData={editingEmployee || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingEmployee(null);
            }}
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
