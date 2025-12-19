import { useState } from "react";
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
import { StockMovement, StockMovementMaterial } from "@/types/stockMovement";
import { MaterialListEditor } from "./MaterialListEditor";

interface StockMovementFormProps {
  stockMovement?: StockMovement;
  onSubmit: (data: Partial<StockMovement>) => void;
  onCancel: () => void;
  spareParts: Array<{ id: string; name: string }>;
  requests: Array<{ id: string; name: string; createdAt: string }>;
  readOnly?: boolean;
}

export function StockMovementForm({
  stockMovement,
  onSubmit,
  onCancel,
  spareParts,
  requests,
  readOnly = false,
}: StockMovementFormProps) {
  const [materials, setMaterials] = useState<StockMovementMaterial[]>(
    stockMovement?.materials || [{ materialId: "", materialName: "", quantity: 0 }]
  );

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      operationDate: stockMovement?.operationDate || new Date().toISOString().split('T')[0],
      operationType: stockMovement?.operationType || "приход",
      relatedRequestId: stockMovement?.relatedRequestId || "",
      comment: stockMovement?.comment || "",
    },
  });

  // Sort requests by creation date (newest first)
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      materials,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="operationType">Тип операции</Label>
        <Select
          defaultValue={stockMovement?.operationType || "приход"}
          onValueChange={(value) => setValue("operationType", value as any)}
          disabled={readOnly}
        >
          <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
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
        <Label htmlFor="operationDate">Дата операции</Label>
        <Input
          id="operationDate"
          type="date"
          {...register("operationDate")}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      <div>
        <Label htmlFor="relatedRequestId">Связанная заявка</Label>
        <Select
          defaultValue={stockMovement?.relatedRequestId || undefined}
          onValueChange={(value) => setValue("relatedRequestId", value)}
          disabled={readOnly}
        >
          <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
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
        <Label>Материалы</Label>
        {readOnly ? (
          <div className="space-y-2 mt-2">
            {materials.map((m, i) => (
              <div key={i} className="p-3 bg-input-readonly rounded-md">
                <div className="font-medium">{m.materialName}</div>
                <div className="text-sm text-muted-foreground">Количество: {m.quantity}</div>
              </div>
            ))}
          </div>
        ) : (
          <MaterialListEditor
            materials={materials}
            onChange={setMaterials}
            spareParts={spareParts}
          />
        )}
      </div>

      <div>
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          {...register("comment")}
          rows={3}
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
            {stockMovement ? "Сохранить" : "Создать"}
          </Button>
        </div>
      )}
    </form>
  );
}
