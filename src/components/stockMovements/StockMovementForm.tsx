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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockMovement } from "@/types/stockMovement";

interface StockMovementFormProps {
  stockMovement?: StockMovement;
  onSubmit: (data: Partial<StockMovement>) => void;
  onCancel: () => void;
  spareParts: Array<{ id: string; name: string }>;
  requests: Array<{ id: string; name: string; createdAt: string }>;
}

export function StockMovementForm({
  stockMovement,
  onSubmit,
  onCancel,
  spareParts,
  requests,
}: StockMovementFormProps) {
  const [openMaterial, setOpenMaterial] = useState(false);
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
  const materialId = watch("materialId");

  // Sort requests by creation date (newest first)
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Label htmlFor="operationDate">Дата операции</Label>
        <Input
          id="operationDate"
          type="date"
          {...register("operationDate")}
        />
      </div>

      <div>
        <Label htmlFor="materialId">Материал</Label>
        <Popover open={openMaterial} onOpenChange={setOpenMaterial}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openMaterial}
              className="w-full justify-between"
            >
              {materialId
                ? spareParts.find((part) => part.id === materialId)?.name
                : "Выберите материал..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Поиск материала..." />
              <CommandList>
                <CommandEmpty>Материал не найден.</CommandEmpty>
                <CommandGroup>
                  {spareParts.map((part) => (
                    <CommandItem
                      key={part.id}
                      value={part.name}
                      onSelect={() => {
                        setValue("materialId", part.id);
                        setOpenMaterial(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          materialId === part.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {part.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
            {sortedRequests.map((request) => (
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
