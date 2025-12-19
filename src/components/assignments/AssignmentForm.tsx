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
import { Assignment, ASSIGNMENT_STATUSES } from "@/types/assignment";
import { calculateWorkBlockTotal, calculateAllBlocksTotal, calculateWorkRowTotal } from "@/types/estimate";

interface AssignmentFormProps {
  assignment?: Assignment;
  onSubmit: (data: Partial<Assignment>) => void;
  onCancel: () => void;
  teams: Array<{ id: string; teamName: string }>;
  readOnly?: boolean;
}

export function AssignmentForm({
  assignment,
  onSubmit,
  onCancel,
  teams,
  readOnly = false,
}: AssignmentFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      assignmentNumber: assignment?.assignmentNumber || "",
      status: assignment?.status || "new",
      teamId: assignment?.teamId || "",
      comments: assignment?.comments || "",
    },
  });

  const status = watch("status");
  const teamId = watch("teamId");

  const handleFormSubmit = (data: any) => {
    const team = teams.find(t => t.id === data.teamId);
    onSubmit({
      ...data,
      teamName: team?.teamName || "",
    });
  };

  const worksTotal = assignment?.workBlocks ? calculateAllBlocksTotal(assignment.workBlocks) : 0;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="bg-form-section p-4 rounded-lg space-y-4">
        <h3 className="font-semibold text-form-label">Основные данные</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="assignmentNumber">Номер задания</Label>
            <Input
              id="assignmentNumber"
              {...register("assignmentNumber")}
              readOnly={readOnly}
              className={readOnly ? "bg-muted/50" : ""}
            />
          </div>
          <div>
            <Label htmlFor="status">Статус</Label>
            <Select
              value={status}
              onValueChange={(value) => setValue("status", value as any)}
              disabled={readOnly}
            >
              <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="teamId">Бригада *</Label>
          <Select
            value={teamId}
            onValueChange={(value) => setValue("teamId", value)}
            disabled={readOnly}
          >
            <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
              <SelectValue placeholder="Выберите бригаду" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.teamName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {assignment && (
        <>
          <div className="bg-form-section p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-form-label">Связанные объекты</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Заявка:</span>
                <span className="ml-2 font-medium">{assignment.requestNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Расчёт:</span>
                <span className="ml-2 font-medium">{assignment.estimateName}</span>
              </div>
              {assignment.clientName && (
                <div>
                  <span className="text-muted-foreground">Клиент:</span>
                  <span className="ml-2 font-medium">{assignment.clientName}</span>
                </div>
              )}
              {assignment.objectName && (
                <div>
                  <span className="text-muted-foreground">Объект:</span>
                  <span className="ml-2 font-medium">{assignment.objectName}</span>
                </div>
              )}
            </div>
          </div>

          {assignment.workBlocks && assignment.workBlocks.length > 0 && (
            <div className="bg-form-section p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-form-label">Работы</h3>
              <div className="space-y-2">
                {assignment.workBlocks.map((block, blockIndex) => (
                  <div key={block.id} className="flex justify-between items-center py-2 px-3 bg-background/50 rounded text-sm">
                    <span>{blockIndex + 1}. {block.description || "Без описания"}</span>
                    <span className="font-medium">{Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')} ₽</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Итого по работам:</span>
                  <span className="font-medium">{Math.round(worksTotal).toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </div>
          )}

          {assignment.materials && assignment.materials.length > 0 && (
            <div className="bg-form-section p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-form-label">Материалы</h3>
              <div className="space-y-2">
                {assignment.materials.map((material, index) => (
                  <div key={material.id || index} className="flex justify-between items-center py-2 px-3 bg-background/50 rounded text-sm">
                    <span>{material.materialName}</span>
                    <span className="text-muted-foreground">{material.quantity} шт</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-form-section p-4 rounded-lg">
        <Label htmlFor="comments">Комментарии</Label>
        <Textarea
          id="comments"
          {...register("comments")}
          rows={3}
          placeholder="Дополнительные указания для бригады..."
          readOnly={readOnly}
          className={readOnly ? "bg-muted/50" : ""}
        />
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {assignment ? "Сохранить" : "Создать"}
          </Button>
        </div>
      )}
    </form>
  );
}
