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
import {
  Estimate,
  ESTIMATE_STATUSES,
  ESTIMATE_TYPES,
  WorkBlock,
  Material,
  CustomerCalculation,
  DEFAULT_CUSTOMER_CALCULATION,
  calculateAllBlocksTotal,
} from "@/types/estimate";
import { MaterialListEditor } from "./MaterialListEditor";
import { WorkBlockEditor } from "./WorkBlockEditor";

interface EstimateFormProps {
  estimate?: Estimate;
  onSubmit: (data: Partial<Estimate>) => void;
  onCancel: () => void;
  requests: Array<{ id: string; name: string; createdAt: string }>;
  employees: Array<{ id: string; fullName: string }>;
  availableMaterials?: Array<{ id: string; name: string; price?: number }>;
  readOnly?: boolean;
}

export function EstimateForm({
  estimate,
  onSubmit,
  onCancel,
  requests,
  employees,
  availableMaterials = [],
  readOnly = false,
}: EstimateFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      name: estimate?.name || "",
      requestId: estimate?.requestId || "",
      estimateNumber: estimate?.estimateNumber || "",
      estimateDate:
        estimate?.estimateDate || new Date().toISOString().split("T")[0],
      status: estimate?.status || "черновик",
      type: estimate?.type || "простой ремонт",
      createdById: estimate?.createdById || "",
      engineerComment: estimate?.engineerComment || "",
    },
  });

  const [workBlocks, setWorkBlocks] = useState<WorkBlock[]>(
    estimate?.workBlocks || []
  );
  const [materials, setMaterials] = useState<Material[]>(
    estimate?.materials || []
  );
  const [customerCalc, setCustomerCalc] = useState<CustomerCalculation>(
    estimate?.customerCalculation || DEFAULT_CUSTOMER_CALCULATION
  );

  const status = watch("status");
  const type = watch("type");
  const requestId = watch("requestId");
  const createdById = watch("createdById");

  // Sort requests by creation date (newest first)
  const sortedRequests = [...requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const worksTotal = calculateAllBlocksTotal(workBlocks);

  const materialsTotal = materials.reduce(
    (sum, material) => sum + material.quantity * material.pricePerUnit,
    0
  );

  const grandTotal = worksTotal + materialsTotal;

  // Customer calculation totals
  const worksOverhead = worksTotal * (customerCalc.overheadPercent / 100);
  const worksProfit = worksTotal * (customerCalc.estimatedProfitPercent / 100);
  const worksCustomerTotal = worksTotal + worksOverhead + worksProfit;

  const materialsTransport = materialsTotal * (customerCalc.transportPercent / 100);
  const materialsWarehouse = materialsTotal * (customerCalc.warehousePercent / 100);
  const materialsCustomerTotal = materialsTotal + materialsTransport + materialsWarehouse;

  const customerSubtotal = worksCustomerTotal + materialsCustomerTotal;
  const otherAmount = customerCalc.otherPercent ? customerSubtotal * (customerCalc.otherPercent / 100) : 0;
  const customerGrandTotal = customerSubtotal + otherAmount;

  const handleFormSubmit = (data: any) => {
    const employee = employees.find((e) => e.id === data.createdById);
    onSubmit({
      ...data,
      createdByName: employee?.fullName || "",
      workBlocks,
      materials,
      customerCalculation: customerCalc,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Основная информация</TabsTrigger>
          <TabsTrigger value="works">Работы</TabsTrigger>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="customer">Для заказчика</TabsTrigger>
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
                readOnly={readOnly}
                className={readOnly ? "bg-muted/50" : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimateNumber">
                  Номер / обозначение расчёта
                </Label>
                <Input
                  id="estimateNumber"
                  {...register("estimateNumber")}
                  placeholder="РС-001"
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="estimateDate">Дата расчёта</Label>
                <Input
                  id="estimateDate"
                  type="date"
                  {...register("estimateDate")}
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
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
                  disabled={readOnly}
                >
                  <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
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
                  disabled={readOnly}
                >
                  <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
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
            <h3 className="font-semibold text-form-label">Связи и автор</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requestId">Связанная заявка</Label>
                <Select
                  value={requestId}
                  onValueChange={(value) => setValue("requestId", value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
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
                <Label htmlFor="createdById">Расчёт составил *</Label>
                <Select
                  value={createdById}
                  onValueChange={(value) => setValue("createdById", value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
                    <SelectValue placeholder="Выберите сотрудника" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="engineerComment">Комментарий инженера</Label>
              <Textarea
                id="engineerComment"
                {...register("engineerComment")}
                rows={3}
                placeholder="Дополнительные комментарии..."
                readOnly={readOnly}
                className={readOnly ? "bg-muted/50" : ""}
              />
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg space-y-3 border-2 border-primary/20">
            <h3 className="font-semibold text-lg">Итоги по расчёту</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-background/50 rounded">
                <span className="text-muted-foreground">Итог по работам:</span>
                <span className="font-medium">
                  {Math.round(worksTotal).toLocaleString("ru-RU")} ₽
                </span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 bg-background/50 rounded">
                <span className="text-muted-foreground">
                  Итог по материалам:
                </span>
                <span className="font-medium">
                  {Math.round(materialsTotal).toLocaleString("ru-RU")} ₽
                </span>
              </div>

              <div className="flex justify-between items-center py-3 px-3 border-t-2 border-primary/30 mt-2">
                <span className="text-lg font-semibold">Общая сумма:</span>
                <span className="text-xl font-bold text-primary">
                  {Math.round(grandTotal).toLocaleString("ru-RU")} ₽
                </span>
              </div>

              <div className="flex justify-between items-center py-1 px-3 text-xs text-muted-foreground">
                <span>Стоимость для заказчика:</span>
                <span>{Math.round(customerGrandTotal).toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="works" className="space-y-4 mt-4">
          <WorkBlockEditor blocks={workBlocks} onChange={setWorkBlocks} readOnly={readOnly} />
        </TabsContent>

        <TabsContent value="materials" className="space-y-4 mt-4">
          <MaterialListEditor
            materials={materials}
            onChange={setMaterials}
            availableMaterials={availableMaterials}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="customer" className="space-y-4 mt-4">
          <div className="bg-form-section p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-form-label">Работа</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Накладные расходы, %</Label>
                <Input
                  type="number"
                  value={customerCalc.overheadPercent}
                  onChange={(e) => setCustomerCalc(prev => ({
                    ...prev,
                    overheadPercent: parseFloat(e.target.value) || 0
                  }))}
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label>Сметная прибыль, %</Label>
                <Input
                  type="number"
                  value={customerCalc.estimatedProfitPercent}
                  onChange={(e) => setCustomerCalc(prev => ({
                    ...prev,
                    estimatedProfitPercent: parseFloat(e.target.value) || 0
                  }))}
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
                />
              </div>
            </div>
            <div className="bg-background/50 p-3 rounded space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Базовая стоимость работ:</span>
                <span>{Math.round(worksTotal).toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>+ Накладные расходы ({customerCalc.overheadPercent}%):</span>
                <span>{Math.round(worksOverhead).toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>+ Сметная прибыль ({customerCalc.estimatedProfitPercent}%):</span>
                <span>{Math.round(worksProfit).toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Итого по работам для заказчика:</span>
                <span>{Math.round(worksCustomerTotal).toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>
          </div>

          <div className="bg-form-section p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-form-label">Материалы</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Транспортные расходы, %</Label>
                <Input
                  type="number"
                  value={customerCalc.transportPercent}
                  onChange={(e) => setCustomerCalc(prev => ({
                    ...prev,
                    transportPercent: parseFloat(e.target.value) || 0
                  }))}
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label>Заготовительно-складские расходы, %</Label>
                <Input
                  type="number"
                  value={customerCalc.warehousePercent}
                  onChange={(e) => setCustomerCalc(prev => ({
                    ...prev,
                    warehousePercent: parseFloat(e.target.value) || 0
                  }))}
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
                />
              </div>
            </div>
            <div className="bg-background/50 p-3 rounded space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Базовая стоимость материалов:</span>
                <span>{Math.round(materialsTotal).toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>+ Транспортные расходы ({customerCalc.transportPercent}%):</span>
                <span>{Math.round(materialsTransport).toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>+ Заготовительно-складские ({customerCalc.warehousePercent}%):</span>
                <span>{Math.round(materialsWarehouse).toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Итого по материалам для заказчика:</span>
                <span>{Math.round(materialsCustomerTotal).toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>
          </div>

          <div className="bg-form-section p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-form-label">Другое</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Наименование</Label>
                <Input
                  value={customerCalc.otherName || ""}
                  onChange={(e) => setCustomerCalc(prev => ({
                    ...prev,
                    otherName: e.target.value
                  }))}
                  placeholder="Например: НДС"
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label>Процент к общей сумме, %</Label>
                <Input
                  type="number"
                  value={customerCalc.otherPercent ?? ""}
                  onChange={(e) => setCustomerCalc(prev => ({
                    ...prev,
                    otherPercent: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  placeholder="0"
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
                />
              </div>
            </div>
            {customerCalc.otherPercent !== undefined && customerCalc.otherPercent > 0 && (
              <div className="bg-background/50 p-3 rounded text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>+ {customerCalc.otherName || "Другое"} ({customerCalc.otherPercent}%):</span>
                  <span>{Math.round(otherAmount).toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-primary/5 p-4 rounded-lg space-y-3 border-2 border-primary/20">
            <h3 className="font-semibold text-lg">Итого для заказчика</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-background/50 rounded">
                <span className="text-muted-foreground">Работы с накладными и прибылью:</span>
                <span className="font-medium">{Math.round(worksCustomerTotal).toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-background/50 rounded">
                <span className="text-muted-foreground">Материалы с транспортом и складом:</span>
                <span className="font-medium">{Math.round(materialsCustomerTotal).toLocaleString("ru-RU")} ₽</span>
              </div>
              {otherAmount > 0 && (
                <div className="flex justify-between items-center py-2 px-3 bg-background/50 rounded">
                  <span className="text-muted-foreground">{customerCalc.otherName || "Другое"}:</span>
                  <span className="font-medium">{Math.round(otherAmount).toLocaleString("ru-RU")} ₽</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 px-3 border-t-2 border-primary/30 mt-2">
                <span className="text-lg font-semibold">ИТОГО для заказчика:</span>
                <span className="text-xl font-bold text-primary">
                  {Math.round(customerGrandTotal).toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {!readOnly && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">{estimate ? "Сохранить" : "Создать"}</Button>
        </div>
      )}
    </form>
  );
}
