export const WORKER_CATEGORIES = [
  "Инженер",
  "Мастер",
  "Монтажник 6 разр.",
  "Монтажник 5 разр.",
] as const;

export type WorkerCategory = typeof WORKER_CATEGORIES[number];

export interface WorkRow {
  category: WorkerCategory;
  planHours: number;
  quantity: number;
  rate: number;
}

export type WorkBlockMode = "manual" | "price";

export interface WorkBlock {
  id: string;
  description: string;
  rows: WorkRow[];
  priceWorks?: PriceWork[];
  mode?: WorkBlockMode;
  quantity?: number; // сколько раз выполняется блок (одна и та же услуга на неск. единицах) — множитель суммы блока
}

// Блок может выполняться несколько раз — сумма блока умножается на это количество.
export function getWorkBlockQuantity(block: WorkBlock): number {
  return block.quantity && block.quantity > 0 ? block.quantity : 1;
}

export interface Material {
  id: string;
  materialId?: string;
  materialName: string;
  quantity: number;
  pricePerUnit: number;
}

export interface PriceWork {
  id: string;
  priceItemId?: string;
  name: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
}

export function calculatePriceWorksTotal(items: PriceWork[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.pricePerUnit, 0);
}

export type VatRate = 0 | 22;

export interface CustomerCalculation {
  overheadPercent: number; // Накладные расходы (работа)
  estimatedProfitPercent: number; // Сметная прибыль (работа)
  transportPercent: number; // Транспортные расходы (материалы)
  warehousePercent: number; // Заготовительно-складские расходы (материалы)
  otherName?: string; // Название дополнительного расхода
  otherPercent?: number; // Процент к общей сумме
  vatRate: VatRate; // Ставка НДС: только 0 или 22
}

export const DEFAULT_CUSTOMER_CALCULATION: CustomerCalculation = {
  overheadPercent: 95,
  estimatedProfitPercent: 58,
  transportPercent: 6,
  warehousePercent: 3,
  otherName: "",
  otherPercent: undefined,
  vatRate: 0, // По умолчанию без НДС
};

// Расчёт НДС по работам (начисляется сверху)
export function calculateWorksVat(worksCustomerTotal: number, vatRate: VatRate): number {
  return vatRate === 22 ? Math.round(worksCustomerTotal * 0.22 * 100) / 100 : 0;
}

// Расчёт НДС по материалам (выделяется из суммы, т.к. уже включён в цену)
export function calculateMaterialsVat(materialsCustomerTotal: number, vatRate: VatRate): number {
  return vatRate === 22 ? Math.round(materialsCustomerTotal * 22 / 122 * 100) / 100 : 0;
}

// Итоговая сумма с НДС (worksVat добавляется, materialsVat уже включён)
export function calculateGrandTotalWithVat(
  customerGrandTotal: number,
  worksVat: number,
  vatRate: VatRate
): number {
  return vatRate === 22 ? Math.round((customerGrandTotal + worksVat) * 100) / 100 : customerGrandTotal;
}

export interface Estimate {
  id: string;
  name: string;
  requestId?: string;
  requestName?: string;
  clientName?: string;
  objectName?: string;
  objectAddress?: string;
  estimateNumber: string;
  estimateDate: string;
  status: "черновик" | "готов" | "согласован";
  type: "простой ремонт" | "сложный ремонт" | "по договору ТО" | "изготовление (производство)";
  createdById: string;
  createdByName: string;
  engineerComment?: string;
  workBlocks?: WorkBlock[];
  materials?: Material[];
  priceWorks?: PriceWork[];
  customerCalculation?: CustomerCalculation;
}

export const ESTIMATE_STATUSES = [
  { value: "черновик", label: "Черновик" },
  { value: "готов", label: "Готов" },
  { value: "согласован", label: "Согласован" },
];

export const ESTIMATE_TYPES = [
  { value: "простой ремонт", label: "Простой ремонт" },
  { value: "сложный ремонт", label: "Сложный ремонт" },
  { value: "по договору ТО", label: "По договору ТО" },
  { value: "изготовление (производство)", label: "Изготовление (производство)" },
];

export function createEmptyWorkBlock(): WorkBlock {
  return {
    id: Date.now().toString(),
    description: "",
    mode: "manual",
    quantity: 1,
    rows: WORKER_CATEGORIES.map(category => ({
      category,
      planHours: 0,
      quantity: 0,
      rate: 0,
    })),
    priceWorks: [],
  };
}

export function calculateWorkRowTotal(row: WorkRow): number {
  return row.planHours * row.quantity * row.rate;
}

export function calculateWorkBlockRowsTotal(block: WorkBlock): number {
  if (block.mode === "price") return 0;
  const rowsSum = block.rows.reduce((sum, row) => sum + calculateWorkRowTotal(row), 0);
  return rowsSum * getWorkBlockQuantity(block);
}

export function calculateWorkBlockPriceWorksTotal(block: WorkBlock): number {
  if (block.mode && block.mode !== "price") return 0;
  const itemsSum = (block.priceWorks || []).reduce((sum, p) => sum + p.quantity * p.pricePerUnit, 0);
  return itemsSum * getWorkBlockQuantity(block);
}

export function calculateWorkBlockTotal(block: WorkBlock): number {
  return calculateWorkBlockRowsTotal(block) + calculateWorkBlockPriceWorksTotal(block);
}

export function calculateAllBlocksRowsTotal(blocks: WorkBlock[]): number {
  return blocks.reduce((sum, block) => sum + calculateWorkBlockRowsTotal(block), 0);
}

export function calculateAllBlocksPriceWorksTotal(blocks: WorkBlock[]): number {
  return blocks.reduce((sum, block) => sum + calculateWorkBlockPriceWorksTotal(block), 0);
}

export function calculateAllBlocksTotal(blocks: WorkBlock[]): number {
  return blocks.reduce((sum, block) => sum + calculateWorkBlockTotal(block), 0);
}

// Единая формула "Итого для заказчика": раньше независимо считалась в
// EstimateForm.tsx (вкладка "Для заказчика" + отдельно в getDocumentContent
// для Word) и в generateCustomerEstimatePDF.ts — три места легко было
// поправить в одном и забыть остальные (см. коммит ca48608).
export interface EstimateTotals {
  worksTotal: number;
  priceWorksTotal: number;
  materialsTotal: number;
  grandTotal: number; // себестоимость: работы + прайс-работы + материалы

  worksCustomerTotal: number; // работы для заказчика, с наценкой, без НДС
  materialsTransport: number;
  materialsWarehouse: number;
  materialsCustomerTotal: number; // материалы для заказчика, с трансп. и складом

  worksVat: number;
  materialsVat: number;
  materialsWithoutVat: number;
  worksWithVat: number;
  totalVat: number;

  subtotalWithoutVat: number; // worksCustomerTotal + materialsWithoutVat
  otherAmount: number;
  grandTotalWithoutVat: number;
  grandTotalWithVat: number; // ИТОГО к оплате
}

// Множитель наценки (накладные + сметная прибыль), начисляется одинаково
// на ручные блоки и на работы по прайсу.
export function getWorksMarkupMultiplier(customerCalc: CustomerCalculation): number {
  return 1 + (customerCalc.overheadPercent + customerCalc.estimatedProfitPercent) / 100;
}

export function calculateEstimateTotals(
  workBlocks: WorkBlock[],
  materials: Material[],
  customerCalc: CustomerCalculation
): EstimateTotals {
  const worksTotal = calculateAllBlocksRowsTotal(workBlocks);
  const priceWorksTotal = calculateAllBlocksPriceWorksTotal(workBlocks);
  const materialsTotal = materials.reduce((sum, m) => sum + m.quantity * m.pricePerUnit, 0);
  const grandTotal = worksTotal + priceWorksTotal + materialsTotal;

  const worksBase = worksTotal + priceWorksTotal;
  const worksCustomerTotal = worksBase * getWorksMarkupMultiplier(customerCalc);

  const materialsTransport = materialsTotal * (customerCalc.transportPercent / 100);
  const materialsWarehouse = materialsTotal * (customerCalc.warehousePercent / 100);
  const materialsCustomerTotal = materialsTotal + materialsTransport + materialsWarehouse;

  const worksVat = calculateWorksVat(worksCustomerTotal, customerCalc.vatRate);
  const materialsVat = calculateMaterialsVat(materialsCustomerTotal, customerCalc.vatRate);
  const totalVat = worksVat + materialsVat;
  const materialsWithoutVat = materialsCustomerTotal - materialsVat;
  const worksWithVat = worksCustomerTotal + worksVat;

  const subtotalWithoutVat = worksCustomerTotal + materialsWithoutVat;
  const otherAmount = customerCalc.otherPercent ? subtotalWithoutVat * (customerCalc.otherPercent / 100) : 0;
  const grandTotalWithoutVat = subtotalWithoutVat + otherAmount;
  const grandTotalWithVat = grandTotalWithoutVat + totalVat;

  return {
    worksTotal,
    priceWorksTotal,
    materialsTotal,
    grandTotal,
    worksCustomerTotal,
    materialsTransport,
    materialsWarehouse,
    materialsCustomerTotal,
    worksVat,
    materialsVat,
    materialsWithoutVat,
    worksWithVat,
    totalVat,
    subtotalWithoutVat,
    otherAmount,
    grandTotalWithoutVat,
    grandTotalWithVat,
  };
}

// Построчная раскладка работ для документов (Word/PDF) и превью —
// раньше один и тот же цикл был продублирован в EstimateForm.tsx и
// generateCustomerEstimatePDF.ts.
export interface CustomerWorkLine {
  label: string;
  amount: number;
}

export function getCustomerWorkLines(
  workBlocks: WorkBlock[],
  customerCalc: CustomerCalculation
): CustomerWorkLine[] {
  const markup = getWorksMarkupMultiplier(customerCalc);
  const lines: CustomerWorkLine[] = [];
  workBlocks.forEach((block) => {
    if (block.mode === "price") {
      const items = block.priceWorks || [];
      const blockQty = getWorkBlockQuantity(block);
      if (items.length === 0) {
        lines.push({ label: block.description || "Работа", amount: 0 });
      } else {
        items.forEach((pw) => {
          lines.push({ label: pw.name || "Работа", amount: pw.quantity * pw.pricePerUnit * markup * blockQty });
        });
      }
    } else {
      lines.push({ label: block.description || "Работа", amount: calculateWorkBlockTotal(block) * markup });
    }
  });
  return lines;
}

export interface CustomerMaterialLine {
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export function getCustomerMaterialLines(
  materials: Material[],
  customerCalc: CustomerCalculation
): CustomerMaterialLine[] {
  const markup = 1 + (customerCalc.transportPercent + customerCalc.warehousePercent) / 100;
  return materials.map((m) => ({
    name: m.materialName,
    unit: "шт",
    quantity: m.quantity,
    unitPrice: m.pricePerUnit * markup,
    amount: m.quantity * m.pricePerUnit * markup,
  }));
}
