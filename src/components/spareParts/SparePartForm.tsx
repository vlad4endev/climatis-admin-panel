import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SparePart } from "@/types/sparePart";

interface SparePartFormProps {
  sparePart?: SparePart;
  onSubmit: (data: Partial<SparePart>) => void;
  onCancel: () => void;
}

export function SparePartForm({ sparePart, onSubmit, onCancel }: SparePartFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: sparePart || {
      name: "",
      internalArticle: "",
      category: "Кондиционирование",
      unit: "шт" as const,
      currentStock: 0,
      minStock: 0,
      purchasePrice: 0,
      notes: "",
    },
  });

  const unit = watch("unit");
  const category = watch("category");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Наименование *</Label>
        <Input id="name" {...register("name", { required: true })} />
      </div>

      <div>
        <Label htmlFor="internalArticle">Внутренний артикул *</Label>
        <Input id="internalArticle" {...register("internalArticle", { required: true })} />
      </div>

      <div>
        <Label htmlFor="category">Раздел *</Label>
        <Select value={category} onValueChange={(value) => setValue("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите раздел" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Кондиционирование">Кондиционирование</SelectItem>
            <SelectItem value="Кабельная продукция">Кабельная продукция</SelectItem>
            <SelectItem value="Вентиляция">Вентиляция</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="unit">Единица измерения *</Label>
        <Select value={unit} onValueChange={(value) => setValue("unit", value as SparePart['unit'])}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите единицу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="шт">шт</SelectItem>
            <SelectItem value="м">м</SelectItem>
            <SelectItem value="мп">мп</SelectItem>
            <SelectItem value="кг">кг</SelectItem>
            <SelectItem value="л">л</SelectItem>
            <SelectItem value="м²">м²</SelectItem>
            <SelectItem value="м³">м³</SelectItem>
            <SelectItem value="пара">пара</SelectItem>
            <SelectItem value="к-т">к-т</SelectItem>
            <SelectItem value="баллон">баллон</SelectItem>
            <SelectItem value="уп">уп</SelectItem>
            <SelectItem value="кор">кор</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="currentStock">Текущий остаток на складе *</Label>
        <Input 
          id="currentStock" 
          type="number" 
          step="0.01"
          {...register("currentStock", { required: true, valueAsNumber: true })} 
        />
      </div>

      <div>
        <Label htmlFor="minStock">Неснижаемый остаток (порог) *</Label>
        <Input 
          id="minStock" 
          type="number" 
          step="0.01"
          {...register("minStock", { required: true, valueAsNumber: true })} 
        />
      </div>

      <div>
        <Label htmlFor="purchasePrice">Закупочная цена (₽) *</Label>
        <Input 
          id="purchasePrice" 
          type="number" 
          step="0.01"
          {...register("purchasePrice", { required: true, valueAsNumber: true })} 
        />
      </div>

      <div>
        <Label htmlFor="notes">Примечания</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Сохранить</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
