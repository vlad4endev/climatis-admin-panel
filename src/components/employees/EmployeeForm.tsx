import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "@/types/employee";

interface EmployeeFormProps {
  initialData?: Partial<Employee>;
  onSubmit: (data: Omit<Employee, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function EmployeeForm({ initialData, onSubmit, onCancel, readOnly = false }: EmployeeFormProps) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      position: initialData?.position || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="fullName">ФИО</Label>
        <Input 
          id="fullName" 
          {...register('fullName', { required: !readOnly })} 
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      <div>
        <Label htmlFor="phone">Телефон</Label>
        <Input 
          id="phone" 
          type="tel" 
          placeholder="+7 (999) 123-45-67"
          {...register('phone', { required: !readOnly })} 
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      <div>
        <Label htmlFor="position">Должность</Label>
        <Input 
          id="position" 
          {...register('position', { required: !readOnly })} 
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {initialData ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      )}
    </form>
  );
}
