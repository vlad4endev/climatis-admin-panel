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
  employees: Array<{ id: string; fullName: string; position?: string }>;
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
  // Найти инженера из списка сотрудников для подписи в документе
  const engineerForSignature = employees.find((e) => e.position?.toLowerCase() === "инженер");

  const pdfContentRef = useRef<HTMLDivElement>(null);

  const getDocumentContent = () => {
    const estimateName = watch("name");
    const estimateNumber = watch("estimateNumber");
    const estimateDate = watch("estimateDate");
    const formattedDate = estimateDate ? new Date(estimateDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }) + " г." : "";

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
            margin: 20mm 25mm 20mm 25mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
          }
          .container {
            width: 100%;
            max-width: 160mm;
          }
          .doc-header {
            display: table;
            width: 100%;
            margin-bottom: 16px;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
          }
          .doc-header-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
          }
          .doc-header-right {
            display: table-cell;
            width: 50%;
            text-align: right;
            vertical-align: top;
          }
          .company-name {
            font-weight: bold;
            font-size: 11pt;
          }
          .company-role {
            color: #555;
            font-size: 10pt;
          }
          .doc-number {
            font-weight: bold;
            font-size: 11pt;
          }
          .doc-date {
            font-size: 10pt;
          }
          h1 {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin: 16px 0;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .header-info {
            margin-bottom: 24px;
          }
          .header-row {
            display: table;
            width: 100%;
            margin-bottom: 4px;
          }
          .header-label {
            display: table-cell;
            width: 120px;
            font-weight: bold;
            vertical-align: top;
          }
          .header-value {
            display: table-cell;
            vertical-align: top;
            border-bottom: 1px solid #ccc;
          }
          h2 {
            font-size: 14pt;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 6px;
            margin: 24px 0 12px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          td {
            padding: 4px 0;
            vertical-align: top;
          }
          .col-desc {
            width: 75%;
            padding-right: 12px;
            word-wrap: break-word;
          }
          .col-price {
            width: 25%;
            text-align: right;
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
          }
          .row-total td {
            border-top: 1px solid #000;
            padding-top: 8px;
            font-weight: bold;
          }
          .row-subtotal td {
            border-top: 1px solid #ccc;
            padding-top: 6px;
          }
          .row-addon td {
            color: #555;
            font-size: 10pt;
          }
          .grand-total {
            margin-top: 24px;
            border-top: 2px solid #000;
            padding-top: 12px;
          }
          .grand-total td {
            font-size: 12pt;
            font-weight: bold;
          }
          .signatures {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #000;
          }
          .signature-table {
            width: 100%;
          }
          .signature-cell {
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
          }
          .signature-title {
            font-weight: bold;
            margin-bottom: 12px;
          }
          .signature-row {
            margin-bottom: 8px;
          }
          .signature-label {
            display: inline-block;
            width: 70px;
          }
          .signature-value {
            display: inline-block;
            border-bottom: 1px solid #000;
            min-width: 150px;
            padding-bottom: 2px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            height: 25px;
            min-width: 150px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="doc-header">
            <div class="doc-header-left">
              <div class="company-name">ООО «Климатис»</div>
              <div class="company-role">Исполнитель</div>
            </div>
            <div class="doc-header-right">
              <div class="doc-number">Расчёт № ${estimateNumber || "—"}</div>
              <div class="doc-date">от ${formattedDate}</div>
            </div>
          </div>
          
          <h1>РАСЧЁТ СТОИМОСТИ РАБОТ</h1>
          
          <div class="header-info">
            <div class="header-row"><span class="header-label">Заказчик:</span><span class="header-value">${selectedRequest?.clientName || "—"}</span></div>
            <div class="header-row"><span class="header-label">Объект:</span><span class="header-value">${selectedRequest?.serviceObjectName || "—"}${selectedRequest?.serviceObjectAddress ? `, ${selectedRequest.serviceObjectAddress}` : ""}</span></div>
          </div>
          
          <h2>1. РАБОТЫ</h2>
          <table>
            <tbody>
              ${workBlocks.map((block, index) => {
                const blockBase = calculateWorkBlockTotal(block);
                const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
                return `<tr><td class="col-desc">${index + 1}. ${block.description || "Работа без названия"}</td><td class="col-price">${Math.round(blockCustomerPrice).toLocaleString("ru-RU")} р.</td></tr>`;
              }).join("")}
              <tr class="row-total"><td class="col-desc">Итого по работам:</td><td class="col-price">${Math.round(worksCustomerTotal).toLocaleString("ru-RU")} р.</td></tr>
            </tbody>
          </table>
          
          <h2>2. МАТЕРИАЛЫ</h2>
          <table>
            <tbody>
              ${materials.map((material, index) => 
                `<tr><td class="col-desc">${index + 1}. ${material.materialName} (${material.quantity} шт.)</td><td class="col-price">${Math.round(material.quantity * material.pricePerUnit).toLocaleString("ru-RU")} р.</td></tr>`
              ).join("")}
              <tr class="row-subtotal"><td class="col-desc">Базовая стоимость материалов:</td><td class="col-price">${Math.round(materialsTotal).toLocaleString("ru-RU")} р.</td></tr>
              <tr class="row-addon"><td class="col-desc">+ Транспортные расходы (${customerCalc.transportPercent}%)</td><td class="col-price">${Math.round(materialsTransport).toLocaleString("ru-RU")} р.</td></tr>
              <tr class="row-addon"><td class="col-desc">+ Заготовительно-складские (${customerCalc.warehousePercent}%)</td><td class="col-price">${Math.round(materialsWarehouse).toLocaleString("ru-RU")} р.</td></tr>
              <tr class="row-total"><td class="col-desc">Итого по материалам:</td><td class="col-price">${Math.round(materialsCustomerTotal).toLocaleString("ru-RU")} р.</td></tr>
            </tbody>
          </table>
          ${customerCalc.otherPercent && customerCalc.otherPercent > 0 ? `
            <table style="margin-top: 12px;">
              <tbody>
                <tr class="row-addon"><td class="col-desc">+ ${customerCalc.otherName || "Другое"} (${customerCalc.otherPercent}%)</td><td class="col-price">${Math.round(otherAmount).toLocaleString("ru-RU")} р.</td></tr>
              </tbody>
            </table>
          ` : ""}
          
          <table class="grand-total">
            <tbody>
              <tr><td class="col-desc">ИТОГО:</td><td class="col-price">${Math.round(customerGrandTotal).toLocaleString("ru-RU")} р.</td></tr>
            </tbody>
          </table>
          
          <div class="signatures">
            <table style="width: 100%;">
              <tr>
                <td style="width: 80px; vertical-align: bottom;">Инженер</td>
                <td style="width: 150px; border-bottom: 1px solid #000; vertical-align: bottom; text-align: center;"></td>
                <td style="vertical-align: bottom; padding-left: 20px;">${engineerForSignature?.fullName || "______________________"}</td>
              </tr>
              <tr>
                <td style="font-size: 9pt; color: #666;">(должность)</td>
                <td style="font-size: 9pt; color: #666; text-align: center;">(подпись)</td>
                <td style="font-size: 9pt; color: #666; padding-left: 20px;">(ФИО)</td>
              </tr>
            </table>
          </div>
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
          width: "210mm",
          padding: "15mm 20mm",
          boxSizing: "border-box",
          lineHeight: "1.4"
        }}
      >
        {/* Шапка документа */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
          <div style={{ fontSize: "10pt" }}>
            <div style={{ fontWeight: "bold" }}>ООО «Климатис»</div>
            <div style={{ color: "#555" }}>Исполнитель</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "10pt" }}>
            <div style={{ fontWeight: "bold" }}>Расчёт № {watch("estimateNumber") || "—"}</div>
            <div>от {watch("estimateDate") ? new Date(watch("estimateDate")).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }) + " г." : ""}</div>
          </div>
        </div>

        <h1 style={{ 
          fontSize: "14pt", 
          fontWeight: "bold", 
          textAlign: "center", 
          margin: "12px 0",
          letterSpacing: "1px",
          textTransform: "uppercase"
        }}>
          РАСЧЁТ СТОИМОСТИ РАБОТ
        </h1>
        
        <div style={{ marginBottom: "16px", fontSize: "11pt" }}>
          <div style={{ display: "flex", marginBottom: "4px" }}>
            <span style={{ width: "100px", fontWeight: "bold", flexShrink: 0 }}>Заказчик:</span>
            <span style={{ borderBottom: "1px solid #ccc", flex: 1, paddingBottom: "2px" }}>{selectedRequest?.clientName || "—"}</span>
          </div>
          <div style={{ display: "flex", marginBottom: "4px" }}>
            <span style={{ width: "100px", fontWeight: "bold", flexShrink: 0 }}>Объект:</span>
            <span style={{ borderBottom: "1px solid #ccc", flex: 1, paddingBottom: "2px" }}>{selectedRequest?.serviceObjectName || "—"}{selectedRequest?.serviceObjectAddress ? `, ${selectedRequest.serviceObjectAddress}` : ""}</span>
          </div>
        </div>

        <h2 style={{ 
          fontSize: "12pt", 
          fontWeight: "bold", 
          borderBottom: "1px solid #000", 
          paddingBottom: "4px", 
          marginTop: "16px", 
          marginBottom: "8px"
        }}>
          1. РАБОТЫ
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", tableLayout: "fixed" }}>
          <tbody>
            {workBlocks.map((block, index) => {
              const blockBase = calculateWorkBlockTotal(block);
              const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
              return (
                <tr key={block.id}>
                  <td style={{ padding: "3px 8px 3px 0", width: "75%", wordWrap: "break-word", verticalAlign: "top" }}>
                    {index + 1}. {block.description || "Работа без названия"}
                  </td>
                  <td style={{ padding: "3px 0", width: "25%", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(blockCustomerPrice).toLocaleString("ru-RU")} р.
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "1px solid #000" }}>
              <td style={{ padding: "6px 8px 3px 0", fontWeight: "bold" }}>Итого по работам:</td>
              <td style={{ padding: "6px 0 3px 0", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(worksCustomerTotal).toLocaleString("ru-RU")} р.
              </td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ 
          fontSize: "12pt", 
          fontWeight: "bold", 
          borderBottom: "1px solid #000", 
          paddingBottom: "4px", 
          marginTop: "16px", 
          marginBottom: "8px"
        }}>
          2. МАТЕРИАЛЫ
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", tableLayout: "fixed" }}>
          <tbody>
            {materials.map((material, index) => (
              <tr key={material.id}>
                <td style={{ padding: "3px 8px 3px 0", width: "75%", wordWrap: "break-word", verticalAlign: "top" }}>
                  {index + 1}. {material.materialName} ({material.quantity} шт.)
                </td>
                <td style={{ padding: "3px 0", width: "25%", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(material.quantity * material.pricePerUnit).toLocaleString("ru-RU")} р.
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid #ccc" }}>
              <td style={{ padding: "4px 8px 3px 0", fontSize: "9pt" }}>Базовая стоимость материалов:</td>
              <td style={{ padding: "4px 0 3px 0", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontSize: "9pt" }}>
                {Math.round(materialsTotal).toLocaleString("ru-RU")} р.
              </td>
            </tr>
            <tr>
              <td style={{ padding: "2px 8px 2px 0", color: "#555", fontSize: "9pt" }}>+ Транспортные расходы ({customerCalc.transportPercent}%)</td>
              <td style={{ padding: "2px 0", textAlign: "right", color: "#555", whiteSpace: "nowrap", fontSize: "9pt", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(materialsTransport).toLocaleString("ru-RU")} р.
              </td>
            </tr>
            <tr>
              <td style={{ padding: "2px 8px 2px 0", color: "#555", fontSize: "9pt" }}>+ Заготовительно-складские ({customerCalc.warehousePercent}%)</td>
              <td style={{ padding: "2px 0", textAlign: "right", color: "#555", whiteSpace: "nowrap", fontSize: "9pt", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(materialsWarehouse).toLocaleString("ru-RU")} р.
              </td>
            </tr>
            <tr style={{ borderTop: "1px solid #000" }}>
              <td style={{ padding: "6px 8px 3px 0", fontWeight: "bold" }}>Итого по материалам:</td>
              <td style={{ padding: "6px 0 3px 0", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(materialsCustomerTotal).toLocaleString("ru-RU")} р.
              </td>
            </tr>
          </tbody>
        </table>

        {customerCalc.otherPercent && customerCalc.otherPercent > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt", marginTop: "8px", tableLayout: "fixed" }}>
            <tbody>
              <tr>
                <td style={{ padding: "2px 8px 2px 0", color: "#555", width: "75%" }}>
                  + {customerCalc.otherName || "Другое"} ({customerCalc.otherPercent}%)
                </td>
                <td style={{ padding: "2px 0", textAlign: "right", color: "#555", width: "25%", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(otherAmount).toLocaleString("ru-RU")} р.
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px", borderTop: "2px solid #000", tableLayout: "fixed" }}>
          <tbody>
            <tr>
              <td style={{ padding: "10px 8px 0 0", fontSize: "12pt", fontWeight: "bold", width: "75%" }}>ИТОГО:</td>
              <td style={{ padding: "10px 0 0 0", fontSize: "12pt", fontWeight: "bold", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", width: "25%" }}>
                {Math.round(customerGrandTotal).toLocaleString("ru-RU")} р.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Блок подписей */}
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "2px solid #000" }}>
          <table style={{ width: "100%", fontSize: "10pt" }}>
            <tbody>
              <tr>
                <td style={{ width: "80px", verticalAlign: "bottom", paddingBottom: "4px" }}>Инженер</td>
                <td style={{ width: "120px", borderBottom: "1px solid #000", verticalAlign: "bottom", textAlign: "center" }}></td>
                <td style={{ verticalAlign: "bottom", paddingLeft: "16px", paddingBottom: "4px" }}>{engineerForSignature?.fullName || "______________________"}</td>
              </tr>
              <tr>
                <td style={{ fontSize: "8pt", color: "#666" }}>(должность)</td>
                <td style={{ fontSize: "8pt", color: "#666", textAlign: "center" }}>(подпись)</td>
                <td style={{ fontSize: "8pt", color: "#666", paddingLeft: "16px" }}>(ФИО)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
