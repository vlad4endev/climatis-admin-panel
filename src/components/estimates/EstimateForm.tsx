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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Estimate, ESTIMATE_STATUSES, ESTIMATE_TYPES, Work, Material } from "@/types/estimate";
import { EntityListEditor, EntityListEditorConfig } from "@/components/entity/EntityListEditor";
import { MaterialListEditor } from "./MaterialListEditor";

interface EstimateFormProps {
  estimate?: Estimate;
  onSubmit: (data: Partial<Estimate>) => void;
  onCancel: () => void;
  requests: Array<{ id: string; name: string; createdAt: string }>;
  availableMaterials?: Array<{ id: string; name: string; price?: number }>;
}

export function EstimateForm({
  estimate,
  onSubmit,
  onCancel,
  requests,
  availableMaterials = [],
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

  const [works, setWorks] = useState<Work[]>(estimate?.works || []);
  const [materials, setMaterials] = useState<Material[]>(estimate?.materials || []);

  const status = watch("status");
  const type = watch("type");
  const requestId = watch("requestId");

  // Sort requests by creation date (newest first)
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const worksConfig: EntityListEditorConfig<Work> = {
    fields: [
      {
        key: "description",
        label: "Описание работы",
        type: "text",
        placeholder: "Название работы",
        width: "1fr",
      },
      {
        key: "hours",
        label: "Часов",
        type: "number",
        placeholder: "0",
        width: "80px",
        step: "0.5",
        min: "0",
      },
      {
        key: "pricePerHour",
        label: "Цена/час",
        type: "number",
        placeholder: "0",
        width: "80px",
        step: "0.01",
        min: "0",
      },
    ],
    createEmpty: () => ({
      id: Date.now().toString(),
      description: "",
      hours: 0,
      pricePerHour: 0,
    }),
    getValue: (work, key) => work[key as keyof Work] as string | number,
    setValue: (work, key, value) => ({ ...work, [key]: value }),
    getId: (work) => work.id,
    calculateTotal: (items) =>
      items.reduce((sum, work) => sum + work.hours * work.pricePerHour, 0),
    totalLabel: "Итого:",
    emptyMessage: "Добавить первую работу",
  };

  const worksTotal = works.reduce(
    (sum, work) => sum + work.hours * work.pricePerHour,
    0
  );

  const materialsTotal = materials.reduce(
    (sum, material) => sum + material.quantity * material.pricePerUnit,
    0
  );

  const grandTotal = worksTotal + materialsTotal;

  const handleFormSubmit = (data: any) => {
    onSubmit({ ...data, works, materials });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Основная информация</TabsTrigger>
          <TabsTrigger value="works">Работы</TabsTrigger>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="bg-form-section p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-form-label">Основные данные</h3>
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
          </div>

          <div className="bg-form-section p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-form-label">Классификация</h3>
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
          </div>

          <div className="bg-form-section p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-form-label">Связи</h3>
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
          </div>

          <div className="bg-primary/5 p-4 rounded-lg space-y-3 border-2 border-primary/20">
            <h3 className="font-semibold text-lg">Итоги по расчёту</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-background/50 rounded">
                <span className="text-muted-foreground">Итог по работам:</span>
                <span className="font-medium">
                  {Math.round(worksTotal).toLocaleString('ru-RU')} ₽
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-background/50 rounded">
                <span className="text-muted-foreground">Итог по материалам:</span>
                <span className="font-medium">
                  {Math.round(materialsTotal).toLocaleString('ru-RU')} ₽
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 px-3 border-t-2 border-primary/30 mt-2">
                <span className="text-lg font-semibold">Общая сумма:</span>
                <span className="text-xl font-bold text-primary">
                  {Math.round(grandTotal).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="works" className="space-y-4 mt-4">
          <EntityListEditor
            items={works}
            onChange={setWorks}
            config={worksConfig}
          />
        </TabsContent>

        <TabsContent value="materials" className="space-y-4 mt-4">
          <MaterialListEditor
            materials={materials}
            onChange={setMaterials}
            availableMaterials={availableMaterials}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
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
