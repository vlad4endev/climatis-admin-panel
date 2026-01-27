import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCreateEstimate, useUpdateEstimate } from "@/hooks/useEstimates";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  calculateWorkBlockTotal,
} from "@/types/estimate";
import { MaterialListEditor } from "./MaterialListEditor";
import { WorkBlockEditor } from "./WorkBlockEditor";
import { EstimateAttachments } from "./EstimateAttachments";

interface EstimateFormProps {
  estimate?: Estimate;
  onSubmit: (data: Partial<Estimate>) => void;
  onCancel: () => void;
  requests: Array<{ id: string; name: string; createdAt: string; clientName?: string; serviceObjectName?: string; serviceObjectAddress?: string }>;
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

  // Auto-save setup
  const createMutation = useCreateEstimate();
  const updateMutation = useUpdateEstimate();

  const { handleFieldChange, setCurrentId, currentId } = useAutoSave<Partial<Estimate>>({
    queryKey: ["estimates"],
    createFn: async (data) => {
      return new Promise((resolve, reject) => {
        createMutation.mutate({
          name: data.name || "Новый расчёт",
          estimateDate: data.estimateDate || new Date().toISOString().split("T")[0],
          status: (data.status as any) || "черновик",
          type: (data.type as any) || "простой ремонт",
          createdById: data.createdById || "",
          createdByName: employees.find(e => e.id === data.createdById)?.fullName || "",
          requestId: data.requestId,
          engineerComment: data.engineerComment,
        }, {
          onSuccess: (result: any) => resolve({ id: result?.id || "" }),
          onError: reject,
        });
      });
    },
    updateFn: async (id, data) => {
      return new Promise((resolve, reject) => {
        updateMutation.mutate({
          id,
          ...data,
          createdByName: data.createdById ? employees.find(e => e.id === data.createdById)?.fullName : undefined,
        }, {
          onSuccess: () => resolve(),
          onError: reject,
        });
      });
    },
    debounceMs: 800,
  });

  // Initialize currentId if editing existing estimate
  useEffect(() => {
    if (estimate?.id) {
      setCurrentId(estimate.id);
    }
  }, [estimate?.id, setCurrentId]);

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

  const selectedRequest = requests.find((r) => r.id === requestId);
  const selectedEmployee = employees.find((e) => e.id === createdById);

  const pdfContentRef = useRef<HTMLDivElement>(null);

  const getDocumentContent = () => {
    const estimateName = watch("name");
    const estimateNumber = watch("estimateNumber");
    const estimateDate = watch("estimateDate");

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Расчёт стоимости</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            margin: 2cm 2.5cm 2cm 2.5cm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            width: 100%;
            max-width: 100%;
          }
          h1 {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin: 0 0 20px 0;
            padding: 0;
          }
          h2 {
            font-size: 12pt;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            margin: 20px 0 10px 0;
          }
          .info {
            margin-bottom: 15px;
          }
          .info p {
            margin: 2px 0;
            font-size: 10pt;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            table-layout: fixed;
          }
          td {
            padding: 3px 0;
            vertical-align: top;
            word-wrap: break-word;
          }
          td.desc {
            width: 75%;
          }
          td.price {
            width: 25%;
            text-align: right;
            white-space: nowrap;
          }
          .bold {
            font-weight: bold;
          }
          .border-top td {
            border-top: 1px solid #000;
            padding-top: 5px;
          }
          .total-section {
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .total-section table td {
            font-size: 12pt;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>РАСЧЁТ СТОИМОСТИ</h1>
        <div class="info">
          <p><strong>Расчёт:</strong> ${estimateName || "—"} № ${estimateNumber || "—"}</p>
          <p><strong>Дата:</strong> ${estimateDate ? new Date(estimateDate).toLocaleDateString("ru-RU") : "—"}</p>
          <p><strong>Заказчик:</strong> ${selectedRequest?.clientName || "—"}</p>
          <p><strong>Объект:</strong> ${selectedRequest?.serviceObjectName || "—"}${selectedRequest?.serviceObjectAddress ? `, ${selectedRequest.serviceObjectAddress}` : ""}</p>
          <p><strong>Исполнитель:</strong> ООО «Климатис»</p>
        </div>
        <h2>РАБОТЫ</h2>
        <table>
          ${workBlocks.map((block, index) => {
            const blockBase = calculateWorkBlockTotal(block);
            const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
            return `<tr><td class="desc">${index + 1}. ${block.description || "Работа без названия"}</td><td class="price">${Math.round(blockCustomerPrice).toLocaleString("ru-RU")} р.</td></tr>`;
          }).join("")}
          <tr class="border-top bold"><td class="desc">Итого по работам:</td><td class="price">${Math.round(worksCustomerTotal).toLocaleString("ru-RU")} р.</td></tr>
        </table>
        <h2>МАТЕРИАЛЫ</h2>
        <table>
          ${materials.map((material, index) => 
            `<tr><td class="desc">${index + 1}. ${material.materialName} (${material.quantity} шт.)</td><td class="price">${Math.round(material.quantity * material.pricePerUnit).toLocaleString("ru-RU")} р.</td></tr>`
          ).join("")}
          <tr><td class="desc">Базовая стоимость материалов:</td><td class="price">${Math.round(materialsTotal).toLocaleString("ru-RU")} р.</td></tr>
          <tr><td class="desc">+ Транспортные расходы (${customerCalc.transportPercent}%):</td><td class="price">${Math.round(materialsTransport).toLocaleString("ru-RU")} р.</td></tr>
          <tr><td class="desc">+ Заготовительно-складские (${customerCalc.warehousePercent}%):</td><td class="price">${Math.round(materialsWarehouse).toLocaleString("ru-RU")} р.</td></tr>
          <tr class="border-top bold"><td class="desc">Итого по материалам:</td><td class="price">${Math.round(materialsCustomerTotal).toLocaleString("ru-RU")} р.</td></tr>
        </table>
        ${customerCalc.otherPercent && customerCalc.otherPercent > 0 ? `
          <table><tr><td class="desc">+ ${customerCalc.otherName || "Другое"} (${customerCalc.otherPercent}%):</td><td class="price">${Math.round(otherAmount).toLocaleString("ru-RU")} р.</td></tr></table>
        ` : ""}
        <div class="total-section">
          <table><tr><td class="desc">ИТОГО:</td><td class="price">${Math.round(customerGrandTotal).toLocaleString("ru-RU")} р.</td></tr></table>
        </div>
      </body>
      </html>
    `;
  };

  const generateCustomerPDF = async () => {
    if (!pdfContentRef.current) return;

    const canvas = await html2canvas(pdfContentRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // A4 dimensions: 210mm x 297mm; margins: 12mm on all sides
    const margin = 12;
    const contentWidth = pdfWidth - 2 * margin;
    const contentHeight = pdfHeight - 2 * margin;

    // Calculate image dimensions in mm (canvas pixels / 96 dpi * 25.4 mm/inch)
    const imgWidthMM = (canvas.width / 2) * 25.4 / 96; // scale=2 in html2canvas
    const imgHeightMM = (canvas.height / 2) * 25.4 / 96;

    // Scale to fit within content area while preserving aspect ratio
    const scaleRatio = Math.min(contentWidth / imgWidthMM, contentHeight / imgHeightMM);
    const renderW = Math.round(imgWidthMM * scaleRatio * 100) / 100;
    const renderH = Math.round(imgHeightMM * scaleRatio * 100) / 100;

    pdf.addImage(imgData, "PNG", margin, margin, renderW, renderH);

    const estimateName = watch("name");
    const estimateNumber = watch("estimateNumber");
    const fileName = `Raschet_${estimateNumber || estimateName || "bez_nomera"}_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.pdf`;
    pdf.save(fileName);
  };

  const generateCustomerDOCX = () => {
    const content = getDocumentContent();
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const estimateName = watch("name");
    const estimateNumber = watch("estimateNumber");
    link.href = url;
    link.download = `Raschet_${estimateNumber || estimateName || "bez_nomera"}_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="works">Работы</TabsTrigger>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="attachments">Документы</TabsTrigger>
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
                tabIndex={readOnly ? -1 : undefined}
                className={readOnly ? "bg-input-readonly" : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimateNumber">
                  Номер расчёта
                </Label>
                <Input
                  id="estimateNumber"
                  {...register("estimateNumber")}
                  placeholder={estimate?.id ? "" : "Присвоится автоматически"}
                  readOnly
                  tabIndex={-1}
                  className="bg-input-readonly"
                />
              </div>
              <div>
                <Label htmlFor="estimateDate">Дата расчёта</Label>
                <Input
                  id="estimateDate"
                  type="date"
                  {...register("estimateDate")}
                  readOnly={readOnly}
                  tabIndex={readOnly ? -1 : undefined}
                  className={readOnly ? "bg-input-readonly" : ""}
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
                  <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
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
                  <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
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
                <Label htmlFor="createdById">Расчёт составил *</Label>
                <Select
                  value={createdById}
                  onValueChange={(value) => setValue("createdById", value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
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
                tabIndex={readOnly ? -1 : undefined}
                className={readOnly ? "bg-input-readonly" : ""}
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

        <TabsContent value="attachments" className="space-y-4 mt-4">
          <EstimateAttachments estimateId={currentId || estimate?.id} readOnly={readOnly} />
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
                  tabIndex={readOnly ? -1 : undefined}
                  className={readOnly ? "bg-input-readonly" : ""}
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
                  tabIndex={readOnly ? -1 : undefined}
                  className={readOnly ? "bg-input-readonly" : ""}
                />
              </div>
            </div>
            <div className="bg-background/50 p-3 rounded space-y-1 text-sm">
              {workBlocks.map((block, index) => {
                const blockBase = calculateWorkBlockTotal(block);
                const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
                return (
                  <div key={block.id} className="flex justify-between">
                    <span>{index + 1}. {block.description || "Работа без названия"}</span>
                    <span>{Math.round(blockCustomerPrice).toLocaleString("ru-RU")} ₽</span>
                  </div>
                );
              })}
              <div className="flex justify-between font-medium border-t pt-1 mt-2">
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
                  tabIndex={readOnly ? -1 : undefined}
                  className={readOnly ? "bg-input-readonly" : ""}
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
                  tabIndex={readOnly ? -1 : undefined}
                  className={readOnly ? "bg-input-readonly" : ""}
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
                  tabIndex={readOnly ? -1 : undefined}
                  className={readOnly ? "bg-input-readonly" : ""}
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
                  tabIndex={readOnly ? -1 : undefined}
                  className={readOnly ? "bg-input-readonly" : ""}
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
                  <span className="text-muted-foreground">{customerCalc.otherName || "Другое"} ({customerCalc.otherPercent}%):</span>
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

          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Скачать для заказчика
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={generateCustomerPDF} className="gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4" />
                  Скачать PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={generateCustomerDOCX} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Скачать DOC (Word)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {/* Hidden PDF Content - A4 proportions with proper margins */}
      <div 
        ref={pdfContentRef} 
        className="fixed left-[-9999px] top-0 bg-white text-black"
        style={{ 
          fontFamily: "Arial, sans-serif",
          width: "740px", // A4 width at 96dpi (210mm * 96dpi / 25.4mm)
          padding: "48px", // 12mm margins at 96dpi
          boxSizing: "border-box"
        }}
      >
        <h1 style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "20px" }}>
          РАСЧЁТ СТОИМОСТИ
        </h1>
        
        <div style={{ marginBottom: "16px", fontSize: "11px", lineHeight: "1.5" }}>
          <p style={{ margin: "2px 0" }}><strong>Расчёт:</strong> {watch("name") || "—"} № {watch("estimateNumber") || "—"}</p>
          <p style={{ margin: "2px 0" }}><strong>Дата:</strong> {watch("estimateDate") ? new Date(watch("estimateDate")).toLocaleDateString("ru-RU") : "—"}</p>
          <p style={{ margin: "2px 0" }}><strong>Заказчик:</strong> {selectedRequest?.clientName || "—"}</p>
          <p style={{ margin: "2px 0" }}><strong>Объект:</strong> {selectedRequest?.serviceObjectName || "—"}{selectedRequest?.serviceObjectAddress ? `, ${selectedRequest.serviceObjectAddress}` : ""}</p>
          <p style={{ margin: "2px 0" }}><strong>Исполнитель:</strong> ООО «Климатис»</p>
        </div>

        <h2 style={{ fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "4px", marginTop: "20px", marginBottom: "10px" }}>
          РАБОТЫ
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", tableLayout: "fixed" }}>
          <tbody>
            {workBlocks.map((block, index) => {
              const blockBase = calculateWorkBlockTotal(block);
              const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
              return (
                <tr key={block.id}>
                  <td style={{ padding: "3px 0", width: "75%", wordWrap: "break-word" }}>
                    {index + 1}. {block.description || "Работа без названия"}
                  </td>
                  <td style={{ padding: "3px 0", width: "25%", textAlign: "right", whiteSpace: "nowrap" }}>
                    {Math.round(blockCustomerPrice).toLocaleString("ru-RU")} р.
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "1px solid #000" }}>
              <td style={{ padding: "5px 0 3px 0", fontWeight: "bold" }}>Итого по работам:</td>
              <td style={{ padding: "5px 0 3px 0", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>
                {Math.round(worksCustomerTotal).toLocaleString("ru-RU")} р.
              </td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "4px", marginTop: "20px", marginBottom: "10px" }}>
          МАТЕРИАЛЫ
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", tableLayout: "fixed" }}>
          <tbody>
            {materials.map((material, index) => (
              <tr key={material.id}>
                <td style={{ padding: "3px 0", width: "75%", wordWrap: "break-word" }}>
                  {index + 1}. {material.materialName} ({material.quantity} шт.)
                </td>
                <td style={{ padding: "3px 0", width: "25%", textAlign: "right", whiteSpace: "nowrap" }}>
                  {Math.round(material.quantity * material.pricePerUnit).toLocaleString("ru-RU")} р.
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid #ccc" }}>
              <td style={{ padding: "5px 0 3px 0" }}>Базовая стоимость материалов:</td>
              <td style={{ padding: "5px 0 3px 0", textAlign: "right", whiteSpace: "nowrap" }}>
                {Math.round(materialsTotal).toLocaleString("ru-RU")} р.
              </td>
            </tr>
            <tr>
              <td style={{ padding: "2px 0", color: "#666" }}>+ Транспортные расходы ({customerCalc.transportPercent}%):</td>
              <td style={{ padding: "2px 0", textAlign: "right", color: "#666", whiteSpace: "nowrap" }}>
                {Math.round(materialsTransport).toLocaleString("ru-RU")} р.
              </td>
            </tr>
            <tr>
              <td style={{ padding: "2px 0", color: "#666" }}>+ Заготовительно-складские ({customerCalc.warehousePercent}%):</td>
              <td style={{ padding: "2px 0", textAlign: "right", color: "#666", whiteSpace: "nowrap" }}>
                {Math.round(materialsWarehouse).toLocaleString("ru-RU")} р.
              </td>
            </tr>
            <tr style={{ borderTop: "1px solid #000" }}>
              <td style={{ padding: "5px 0 3px 0", fontWeight: "bold" }}>Итого по материалам:</td>
              <td style={{ padding: "5px 0 3px 0", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>
                {Math.round(materialsCustomerTotal).toLocaleString("ru-RU")} р.
              </td>
            </tr>
          </tbody>
        </table>

        {customerCalc.otherPercent && customerCalc.otherPercent > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginTop: "8px", tableLayout: "fixed" }}>
            <tbody>
              <tr>
                <td style={{ padding: "2px 0", color: "#666", width: "75%" }}>
                  + {customerCalc.otherName || "Другое"} ({customerCalc.otherPercent}%):
                </td>
                <td style={{ padding: "2px 0", textAlign: "right", color: "#666", width: "25%", whiteSpace: "nowrap" }}>
                  {Math.round(otherAmount).toLocaleString("ru-RU")} р.
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <div style={{ marginTop: "20px", paddingTop: "10px", borderTop: "2px solid #000" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <tbody>
              <tr>
                <td style={{ fontSize: "14px", fontWeight: "bold", width: "75%" }}>ИТОГО:</td>
                <td style={{ fontSize: "14px", fontWeight: "bold", textAlign: "right", width: "25%", whiteSpace: "nowrap" }}>
                  {Math.round(customerGrandTotal).toLocaleString("ru-RU")} р.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
