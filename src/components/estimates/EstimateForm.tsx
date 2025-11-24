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
import { Estimate, ESTIMATE_STATUSES, ESTIMATE_TYPES, Work } from "@/types/estimate";
import { Plus, Trash2 } from "lucide-react";

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

  const [works, setWorks] = useState<Work[]>(estimate?.works || []);

  const status = watch("status");
  const type = watch("type");
  const requestId = watch("requestId");

  // Sort requests by creation date (newest first)
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const addWork = () => {
    setWorks([
      ...works,
      {
        id: Date.now().toString(),
        description: "",
        hours: 0,
        pricePerHour: 0,
      },
    ]);
  };

  const removeWork = (id: string) => {
    setWorks(works.filter((work) => work.id !== id));
  };

  const updateWork = (id: string, field: keyof Work, value: string | number) => {
    setWorks(
      works.map((work) =>
        work.id === id ? { ...work, [field]: value } : work
      )
    );
  };

  const totalAmount = works.reduce(
    (sum, work) => sum + work.hours * work.pricePerHour,
    0
  );

  const handleFormSubmit = (data: any) => {
    onSubmit({ ...data, works });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Основная информация</TabsTrigger>
          <TabsTrigger value="works">Работы</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
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
        </TabsContent>

        <TabsContent value="works" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Label>Список работ</Label>
            <Button type="button" onClick={addWork} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить работу
            </Button>
          </div>

          {works.length > 0 && (
            <div className="grid grid-cols-[1fr_120px_120px_40px] gap-3 text-sm font-medium text-muted-foreground px-3">
              <div>Описание работы</div>
              <div>Часов</div>
              <div>Цена/час</div>
              <div></div>
            </div>
          )}

          <div className="space-y-3">
            {works.map((work) => (
              <div
                key={work.id}
                className="grid grid-cols-[1fr_120px_120px_40px] gap-3 items-center p-3 border rounded-lg"
              >
                <Input
                  value={work.description}
                  onChange={(e) =>
                    updateWork(work.id, "description", e.target.value)
                  }
                  placeholder="Название работы"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={work.hours}
                  onChange={(e) =>
                    updateWork(work.id, "hours", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={work.pricePerHour}
                  onChange={(e) =>
                    updateWork(work.id, "pricePerHour", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWork(work.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {works.length > 0 && (
            <div className="flex justify-end items-center gap-2 pt-4 border-t">
              <span className="text-lg font-semibold">Итого:</span>
              <span className="text-2xl font-bold">
                {totalAmount.toFixed(2)} ₽
              </span>
            </div>
          )}
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
