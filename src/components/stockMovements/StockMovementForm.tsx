import { useState, useRef, useEffect } from "react";
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
  requests: Array<{ id: string; name: string; createdAt: string }>;
}

export function StockMovementForm({
  stockMovement,
  onSubmit,
  onCancel,
  spareParts,
  requests,
}: StockMovementFormProps) {
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Filter materials by search query
  const filteredMaterials = spareParts.filter((part) =>
    part.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  // Get selected material name
  const selectedMaterial = spareParts.find((part) => part.id === materialId);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !materialInputRef.current?.contains(event.target as Node)
      ) {
        setShowMaterialDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize search with selected material name
  useEffect(() => {
    if (selectedMaterial && !showMaterialDropdown) {
      setMaterialSearch(selectedMaterial.name);
    }
  }, [selectedMaterial, showMaterialDropdown]);

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

      <div className="relative">
        <Label htmlFor="materialSearch">Материал</Label>
        <Input
          ref={materialInputRef}
          id="materialSearch"
          type="text"
          value={materialSearch}
          onChange={(e) => {
            setMaterialSearch(e.target.value);
            setShowMaterialDropdown(true);
          }}
          onFocus={() => setShowMaterialDropdown(true)}
          placeholder="Начните вводить название материала..."
          autoComplete="off"
        />
        {showMaterialDropdown && filteredMaterials.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
          >
            {filteredMaterials.map((part) => (
              <div
                key={part.id}
                className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => {
                  setValue("materialId", part.id);
                  setMaterialSearch(part.name);
                  setShowMaterialDropdown(false);
                }}
              >
                {part.name}
              </div>
            ))}
          </div>
        )}
        {showMaterialDropdown && materialSearch && filteredMaterials.length === 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md px-3 py-2 text-muted-foreground text-sm"
          >
            Материал не найден
          </div>
        )}
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
