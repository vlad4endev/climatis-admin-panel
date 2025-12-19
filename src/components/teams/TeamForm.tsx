import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Team } from "@/types/team";
import { Employee } from "@/types/employee";

interface TeamFormProps {
  initialData?: Partial<Team>;
  onSubmit: (data: Omit<Team, 'id' | 'createdAt' | 'leaderName' | 'memberNames'>) => void;
  onCancel: () => void;
  employees: Employee[];
  readOnly?: boolean;
}

export function TeamForm({ initialData, onSubmit, onCancel, employees, readOnly = false }: TeamFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      leaderId: initialData?.leaderId || '',
      memberIds: initialData?.memberIds || [],
      competencies: initialData?.competencies || '',
      notes: initialData?.notes || '',
    },
  });

  const selectedMemberIds = watch('memberIds') as string[];

  const toggleMember = (memberId: string) => {
    const current = selectedMemberIds || [];
    if (current.includes(memberId)) {
      setValue('memberIds', current.filter(id => id !== memberId));
    } else {
      setValue('memberIds', [...current, memberId]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Название бригады</Label>
        <Input 
          id="name" 
          {...register('name', { required: !readOnly })} 
          readOnly={readOnly}
          className={readOnly ? "bg-muted/50" : ""}
        />
      </div>

      <div>
        <Label htmlFor="leaderId">Ответственный (руководитель)</Label>
        <Select
          value={watch('leaderId')}
          onValueChange={(value) => setValue('leaderId', value)}
          disabled={readOnly}
        >
          <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
            <SelectValue placeholder="Выберите ответственного" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.fullName} — {employee.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Состав бригады</Label>
        <div className={`border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto ${readOnly ? "bg-muted/50" : ""}`}>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет доступных сотрудников</p>
          ) : (
            employees.map((employee) => (
              <div key={employee.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`member-${employee.id}`}
                  checked={selectedMemberIds?.includes(employee.id)}
                  onCheckedChange={() => !readOnly && toggleMember(employee.id)}
                  disabled={readOnly}
                />
                <label
                  htmlFor={`member-${employee.id}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {employee.fullName} — {employee.position}
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="competencies">Компетенции (необязательно)</Label>
        <Textarea
          id="competencies"
          {...register('competencies')}
          placeholder="Установка кондиционеров, ремонт систем вентиляции..."
          readOnly={readOnly}
          className={readOnly ? "bg-muted/50" : ""}
        />
      </div>

      <div>
        <Label htmlFor="notes">Примечания</Label>
        <Textarea 
          id="notes" 
          {...register('notes')} 
          readOnly={readOnly}
          className={readOnly ? "bg-muted/50" : ""}
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
