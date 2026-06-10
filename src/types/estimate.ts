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

export interface WorkBlock {
  id: string;
  description: string;
  rows: WorkRow[];
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
    rows: WORKER_CATEGORIES.map(category => ({
      category,
      planHours: 0,
      quantity: 0,
      rate: 0,
    })),
  };
}

export function calculateWorkRowTotal(row: WorkRow): number {
  return row.planHours * row.quantity * row.rate;
}

export function calculateWorkBlockTotal(block: WorkBlock): number {
  return block.rows.reduce((sum, row) => sum + calculateWorkRowTotal(row), 0);
}

export function calculateAllBlocksTotal(blocks: WorkBlock[]): number {
  return blocks.reduce((sum, block) => sum + calculateWorkBlockTotal(block), 0);
}
