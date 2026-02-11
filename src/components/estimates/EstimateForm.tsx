import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCreateEstimate, useUpdateEstimate } from "@/hooks/useEstimates";
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
  VatRate,
  calculateAllBlocksTotal,
  calculateWorkBlockTotal,
  calculateWorksVat,
  calculateMaterialsVat,
  calculateGrandTotalWithVat,
} from "@/types/estimate";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MaterialListEditor } from "./MaterialListEditor";
import { WorkBlockEditor } from "./WorkBlockEditor";
import { EstimateAttachments } from "./EstimateAttachments";
import { generateCustomerEstimatePDF } from "@/lib/generateCustomerEstimatePDF";

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

  // Company options for executor selection
  const COMPANY_OPTIONS = [
    { value: "ooo", label: 'ООО "Климатис"' },
    { value: "ip", label: "ИП Щеткин А.Г." },
  ];
  const [selectedCompany, setSelectedCompany] = useState<string>(
    (estimate?.customerCalculation as any)?.executorCompany || "ooo"
  );

  // Handler for company selection - automatically sets VAT rate
  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
    // ООО → НДС 22%, ИП → НДС 0%
    const newVatRate: VatRate = company === "ooo" ? 22 : 0;
    setCustomerCalc(prev => ({ ...prev, vatRate: newVatRate }));
  };

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

  // VAT calculations (дополнительный слой, не меняющий базовые расчёты)
  const worksVat = calculateWorksVat(worksCustomerTotal, customerCalc.vatRate);
  const materialsVat = calculateMaterialsVat(materialsCustomerTotal, customerCalc.vatRate);
  const totalVat = worksVat + materialsVat;
  const customerGrandTotalWithVat = calculateGrandTotalWithVat(customerGrandTotal, worksVat, customerCalc.vatRate);

  const handleFormSubmit = (data: any) => {
    const employee = employees.find((e) => e.id === data.createdById);
    onSubmit({
      ...data,
      createdByName: employee?.fullName || "",
      workBlocks,
      materials,
      customerCalculation: { ...customerCalc, executorCompany: selectedCompany },
    });
  };

  const getExecutorName = () => {
    return COMPANY_OPTIONS.find(c => c.value === selectedCompany)?.label || 'ООО "Климатис"';
  };

  const selectedRequest = requests.find((r) => r.id === requestId);
  const selectedEmployee = employees.find((e) => e.id === createdById);
  
  // Find first engineer for document signature
  const engineerEmployee = employees.find((e) => 
    e.position?.toLowerCase().includes("инженер")
  );
  
  // Extract surname + initials (Фамилия И.О.)
  const getEngineerNameWithInitials = () => {
    if (!engineerEmployee?.fullName) return "____________________";
    const parts = engineerEmployee.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const surname = parts[0];
    const initials = parts.slice(1).map(p => p.charAt(0).toUpperCase() + ".").join("");
    return `${surname} ${initials}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Format number with 2 decimal places
  const formatCurrency = (value: number): string => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ").replace(".", ",");
  };

  const getDocumentContent = () => {
    const estimateNumber = watch("estimateNumber");
    const estimateDate = watch("estimateDate");
    
    const vatRateLabel = customerCalc.vatRate === 22 ? "22%" : "";
    const worksWithVat = worksCustomerTotal + worksVat;
    const grandTotalWithoutVat = worksCustomerTotal + materialsCustomerTotal;

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
          <w:Sections>
            <w:Section>
              <w:SectionProperties>
                <w:PaperSize w:Width="11906" w:Height="16838"/>
                <w:PageMargin w:Top="567" w:Right="567" w:Bottom="567" w:Left="851"/>
              </w:SectionProperties>
            </w:Section>
          </w:Sections>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 210mm 297mm;
            margin: 15mm 15mm 15mm 20mm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
          }
          table { border-collapse: collapse; }
          p { margin: 0; }

          .data-table { width: 100%; border: 0.5pt solid #000; }
          .data-table th,
          .data-table td {
            padding: 1.5mm 2mm;
            border: 0.5pt solid #000;
            vertical-align: middle;
            font-size: 9pt;
          }
          .data-table th {
            font-weight: normal;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <!-- HEADER -->
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 50%; vertical-align: top; border: none; padding: 0;">
              <p style="font-weight: bold; font-size: 10pt;">СОГЛАСОВАНО:</p>
              <p style="font-size: 10pt; margin-top: 6mm;">"____"______________2026 г.</p>
              <p style="margin-top: 4mm;">
                <span style="display: inline-block; border-bottom: 0.5pt solid #000; width: 35mm;">&nbsp;</span>
                &nbsp;&nbsp;
                <span style="display: inline-block; border-bottom: 0.5pt solid #000; width: 25mm;">&nbsp;</span>
              </p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right; border: none; padding: 0;">
              <p style="font-size: 10pt;">к Договору № ___ от ________</p>
            </td>
          </tr>
        </table>

        <!-- TITLE -->
        <p style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 10mm; letter-spacing: 0.5pt;">РАСЧЕТ СТОИМОСТИ</p>
        <p style="text-align: center; font-size: 10pt; margin-top: 2mm;">№ ${estimateNumber || "б/н"} от ${formatDate(estimateDate)}</p>

        <!-- REQUISITES -->
        <table style="width: 100%; border: none; margin-top: 6mm; line-height: 1.4;">
          <tr>
            <td style="width: 30mm; font-weight: bold; border: none; padding: 1mm 0; vertical-align: top;">Заказчик:</td>
            <td style="border: none; padding: 1mm 0; vertical-align: top;">${estimate?.clientName || selectedRequest?.clientName || "—"}</td>
          </tr>
          <tr>
            <td style="width: 30mm; font-weight: bold; border: none; padding: 1mm 0; vertical-align: top;">Объект:</td>
            <td style="border: none; padding: 1mm 0; vertical-align: top;">${estimate?.objectName || selectedRequest?.serviceObjectName || "—"}${(estimate?.objectAddress || selectedRequest?.serviceObjectAddress) ? `, ${estimate?.objectAddress || selectedRequest?.serviceObjectAddress}` : ""}</td>
          </tr>
          <tr>
            <td style="width: 30mm; font-weight: bold; border: none; padding: 1mm 0; vertical-align: top;">Исполнитель:</td>
            <td style="border: none; padding: 1mm 0; vertical-align: top;">${getExecutorName()}</td>
          </tr>
        </table>

        <p style="font-weight: bold; font-size: 10pt; margin-top: 5mm; margin-bottom: 2mm;">1. РАБОТЫ</p>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 8mm;">№</th>
              <th>Перечень выполняемых работ</th>
              <th style="width: 28mm;">Стоимость, руб</th>
            </tr>
          </thead>
          <tbody>
            ${workBlocks.map((block, index) => {
              const blockBase = calculateWorkBlockTotal(block);
              const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
              return `<tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${block.description || "Работа"} (с учетом накладных, сметной прибыли)</td>
                <td style="text-align: right;">${formatCurrency(blockCustomerPrice)}</td>
              </tr>`;
            }).join("") || '<tr><td colspan="3" style="text-align: center; font-style: italic;">Работы не указаны</td></tr>'}
            <tr>
              <td></td>
              <td style="text-align: right; font-weight: bold;">ИТОГО:</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(worksCustomerTotal)}</td>
            </tr>
            <tr>
              <td></td>
              <td style="text-align: right;">${vatRateLabel ? `НДС ${vatRateLabel}:` : "НДС:"}</td>
              <td style="text-align: right;">${formatCurrency(worksVat)}</td>
            </tr>
            <tr>
              <td></td>
              <td style="text-align: right; font-weight: bold;">ВСЕГО, по статье РАБОТЫ:</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(worksWithVat)}</td>
            </tr>
          </tbody>
        </table>

        <!-- 2. Материалы -->
        <p style="font-weight: bold; font-size: 10pt; margin-top: 4mm; margin-bottom: 2mm;">2. Материалы</p>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 8mm;">№</th>
              <th>Спецификация используемых материалов</th>
              <th style="width: 15mm;">Ед. изм.</th>
              <th style="width: 15mm;">Кол-во</th>
              <th style="width: 24mm;">Цена за ед.</th>
              <th style="width: 28mm;">Стоимость, руб</th>
            </tr>
          </thead>
          <tbody>
            ${materials.map((material, index) => {
              const unitPriceWithMarkup = material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
              const materialPrice = material.quantity * unitPriceWithMarkup;
              return `<tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${material.materialName} (с учетом транспортных и заготовительно складских расходов)</td>
                <td style="text-align: center;">шт</td>
                <td style="text-align: center;">${material.quantity}</td>
                <td style="text-align: right;">${formatCurrency(unitPriceWithMarkup)}</td>
                <td style="text-align: right;">${formatCurrency(materialPrice)}</td>
              </tr>`;
            }).join("") || '<tr><td colspan="6" style="text-align: center; font-style: italic;">Материалы не указаны</td></tr>'}
            <tr>
              <td></td>
              <td colspan="4" style="text-align: right; font-weight: bold;">ВСЕГО по статье МАТЕРИАЛЫ:</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(materialsCustomerTotal)}</td>
            </tr>
            <tr>
              <td></td>
              <td colspan="4" style="text-align: right;">${vatRateLabel ? `в т.ч. НДС ${vatRateLabel}:` : "в т.ч. НДС:"}</td>
              <td style="text-align: right;">${formatCurrency(materialsVat)}</td>
            </tr>
          </tbody>
        </table>

        <!-- FINAL TOTALS -->
        <p style="border-bottom: 0.5pt solid #000; margin-top: 6mm;">&nbsp;</p>
        <table style="width: 100%; border: none; margin-top: 2mm;">
          <tr>
            <td style="text-align: right; font-size: 10pt; border: none; padding: 1.5mm 0;">ИТОГО, по расчету без НДС:</td>
            <td style="width: 28mm; text-align: right; font-size: 10pt; border: none; padding: 1.5mm 0;">${formatCurrency(grandTotalWithoutVat)}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold; font-size: 10pt; border: none; padding: 1.5mm 0;">${vatRateLabel ? `НДС ${vatRateLabel}:` : "НДС:"}</td>
            <td style="width: 28mm; text-align: right; font-size: 10pt; border: none; padding: 1.5mm 0;">${formatCurrency(totalVat)}</td>
          </tr>
        </table>
        <p style="border-bottom: 0.5pt solid #000;">&nbsp;</p>
        <table style="width: 100%; border: none;">
          <tr>
            <td style="text-align: right; font-weight: bold; font-style: italic; font-size: 10pt; border: none; padding: 1.5mm 0;">ВСЕГО по расчету:</td>
            <td style="width: 28mm; text-align: right; font-weight: bold; font-size: 10pt; border: none; padding: 1.5mm 0;">${formatCurrency(customerGrandTotalWithVat)}</td>
          </tr>
        </table>

        <!-- SIGNATURE -->
        <table style="width: 100%; border: none; margin-top: 20mm;">
          <tr>
            <td style="border: none; padding: 0; font-size: 10pt; vertical-align: bottom;">Расчет составил</td>
            <td style="border: none; padding: 0; font-size: 10pt; text-align: right; vertical-align: bottom;">${getEngineerNameWithInitials()}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  const generateCustomerPDF = async () => {
    await generateCustomerEstimatePDF({
      estimateNumber: watch("estimateNumber"),
      estimateDate: watch("estimateDate"),
      clientName: estimate?.clientName || selectedRequest?.clientName || "",
      objectName: estimate?.objectName || selectedRequest?.serviceObjectName || "",
      objectAddress: estimate?.objectAddress || selectedRequest?.serviceObjectAddress,
      workBlocks,
      materials,
      customerCalc,
      engineerName: getEngineerNameWithInitials(),
      executorCompany: getExecutorName(),
    });
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
                <span>Стоимость для заказчика{customerCalc.vatRate === 22 ? " (с НДС)" : ""}:</span>
                <span>{Math.round(customerGrandTotalWithVat).toLocaleString("ru-RU")} ₽</span>
              </div>
              {customerCalc.vatRate === 22 && (
                <div className="flex justify-between items-center py-1 px-3 text-xs text-muted-foreground">
                  <span>В том числе НДС:</span>
                  <span>{Math.round(totalVat).toLocaleString("ru-RU")} ₽</span>
                </div>
              )}
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
            <h3 className="font-semibold text-form-label">Исполнитель</h3>
            <div>
              <Label>Организация-исполнитель</Label>
              <Select
                value={selectedCompany}
                onValueChange={handleCompanyChange}
                disabled={readOnly}
              >
                <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Выбранная организация будет указана в документах как исполнитель
              </p>
            </div>
          </div>

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

            {/* Materials list with amounts - always render to avoid DOM reconciliation issues */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Наименование</th>
                    <th className="text-center p-2 font-medium w-20">Кол-во</th>
                    <th className="text-right p-2 font-medium w-28">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length > 0 ? (
                    materials.map((material) => {
                      const baseAmount = material.quantity * material.pricePerUnit;
                      const totalAmount = baseAmount * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
                      return (
                        <tr key={material.id || `material-${Math.random()}`} className="border-t">
                          <td className="p-2">{material.materialName || "—"}</td>
                          <td className="p-2 text-center">{material.quantity}</td>
                          <td className="p-2 text-right tabular-nums">
                            {Math.round(totalAmount).toLocaleString("ru-RU")} ₽
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground">
                        Материалы не добавлены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
            <h3 className="font-semibold text-form-label">НДС</h3>
            <div>
              <Label>Ставка НДС</Label>
              <ToggleGroup 
                type="single" 
                value={String(customerCalc.vatRate)}
                onValueChange={(value) => {
                  if (value === "0" || value === "22") {
                    setCustomerCalc(prev => ({
                      ...prev,
                      vatRate: Number(value) as VatRate
                    }));
                  }
                }}
                disabled={readOnly}
                className="justify-start mt-2"
              >
                <ToggleGroupItem value="0" aria-label="Без НДС" className="px-4">
                  0% (без НДС)
                </ToggleGroupItem>
                <ToggleGroupItem value="22" aria-label="НДС 22%" className="px-4">
                  22%
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground mt-2">
                НДС по работам начисляется сверху. НДС по материалам уже включён в цену.
              </p>
            </div>
            {customerCalc.vatRate === 22 && (
              <div className="bg-background/50 p-3 rounded space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>НДС по работам (22% сверху):</span>
                  <span>{Math.round(worksVat).toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>НДС по материалам (в т.ч. 22/122):</span>
                  <span>{Math.round(materialsVat).toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Итого НДС:</span>
                  <span>{Math.round(totalVat).toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
            )}
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
                  placeholder="Например: Доп. расходы"
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
              {customerCalc.vatRate === 22 && (
                <div className="flex justify-between items-center py-2 px-3 bg-background/50 rounded">
                  <span className="text-muted-foreground">НДС по работам (22%):</span>
                  <span className="font-medium">{Math.round(worksVat).toLocaleString("ru-RU")} ₽</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 px-3 border-t-2 border-primary/30 mt-2">
                <span className="text-lg font-semibold">ИТОГО к оплате:</span>
                <span className="text-xl font-bold text-primary">
                  {Math.round(customerGrandTotalWithVat).toLocaleString("ru-RU")} ₽
                </span>
              </div>
              {customerCalc.vatRate === 22 && (
                <div className="flex justify-between items-center py-1 px-3 text-sm text-muted-foreground">
                  <span>В том числе НДС:</span>
                  <span>{Math.round(totalVat).toLocaleString("ru-RU")} ₽</span>
                </div>
              )}
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
    </form>
  );
}
