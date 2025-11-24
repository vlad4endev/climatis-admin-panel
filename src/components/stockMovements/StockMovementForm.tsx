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
import { StockMovement } from "@/types/stockMovement";

interface StockMovementFormProps {
  stockMovement?: StockMovement;
  onSubmit: (data: Partial<StockMovement>) => void;
  onCancel: () => void;
  spareParts: Array<{ id: string; name: string }>;
  requests: Array<{ id: string; name: string }>;
}

export function StockMovementForm({
  stockMovement,
  onSubmit,
  onCancel,
  spareParts,
  requests,
}: StockMovementFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      operationDate: stockMovement?.operationDate || new Date().toISOString().split('T')[0],
      materialId: stockMovement?.materialId || "",
      operationType: stockMovement?.operationType || "приход",
      quantity: stockMovement?.quantity || 0,
      relatedRequestId: stockMovement?.relatedRequestId || "",
      comment: stockMovement?.comment || "",
    },
  });

  const operationType = watch("operationType");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="operationDate">Дата операции</Label>
        <Input
          id="operationDate"
          type="date"
          {...register("operationDate")}
        />
      </div>

      <div>
        <Label htmlFor="materialId">Материал</Label>
        <Select
          defaultValue={stockMovement?.materialId}
          onValueChange={(value) => setValue("materialId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите материал" />
          </SelectTrigger>
          <SelectContent>
            {spareParts.map((part) => (
              <SelectItem key={part.id} value={part.id}>
                {part.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="operationType">Тип операции</Label>
        <Select
          defaultValue={stockMovement?.operationType || "приход"}
          onValueChange={(value) => setValue("operationType", value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="приход">Приход</SelectItem>
            <SelectItem value="расход">Расход</SelectItem>
            <SelectItem value="возврат">Возврат</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="quantity">Количество</Label>
        <Input
          id="quantity"
          type="number"
          {...register("quantity", { valueAsNumber: true })}
        />
      </div>

      <div>
        <Label htmlFor="relatedRequestId">Связанная заявка</Label>
        <Select
          defaultValue={stockMovement?.relatedRequestId || undefined}
          onValueChange={(value) => setValue("relatedRequestId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите заявку (необязательно)" />
          </SelectTrigger>
          <SelectContent>
            {requests.map((request) => (
              <SelectItem key={request.id} value={request.id}>
                {request.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          {...register("comment")}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit">
          {stockMovement ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
