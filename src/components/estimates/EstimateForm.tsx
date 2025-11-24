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
import { Estimate, ESTIMATE_STATUSES, ESTIMATE_TYPES } from "@/types/estimate";

interface EstimateFormProps {
  estimate?: Estimate;
  onSubmit: (data: Partial<Estimate>) => void;
  onCancel: () => void;
  requests: Array<{ id: string; name: string; createdAt: string }>;
}

export function EstimateForm({
  estimate,
  onSubmit,
  onCancel,
  requests,
}: EstimateFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      name: estimate?.name || "",
      requestId: estimate?.requestId || "",
      estimateNumber: estimate?.estimateNumber || "",
      estimateDate: estimate?.estimateDate || new Date().toISOString().split('T')[0],
      status: estimate?.status || "черновик",
      type: estimate?.type || "простой ремонт",
      engineerComment: estimate?.engineerComment || "",
    },
  });

  const status = watch("status");
  const type = watch("type");
  const requestId = watch("requestId");

  // Sort requests by creation date (newest first)
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Расчёт (смета)</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Название расчёта"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimateNumber">Номер / обозначение расчёта</Label>
          <Input
            id="estimateNumber"
            {...register("estimateNumber")}
            placeholder="РС-001"
          />
        </div>
        <div>
          <Label htmlFor="estimateDate">Дата расчёта</Label>
          <Input
            id="estimateDate"
            type="date"
            {...register("estimateDate")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Статус расчёта</Label>
          <Select
            value={status}
            onValueChange={(value) => setValue("status", value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTIMATE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Тип расчёта</Label>
          <Select
            value={type}
            onValueChange={(value) => setValue("type", value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTIMATE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="requestId">Связанная заявка</Label>
        <Select
          value={requestId}
          onValueChange={(value) => setValue("requestId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите заявку (необязательно)" />
          </SelectTrigger>
          <SelectContent>
            {sortedRequests.map((request) => (
              <SelectItem key={request.id} value={request.id}>
                {request.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="engineerComment">Комментарий инженера</Label>
        <Textarea
          id="engineerComment"
          {...register("engineerComment")}
          rows={3}
          placeholder="Дополнительные комментарии..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit">
          {estimate ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
