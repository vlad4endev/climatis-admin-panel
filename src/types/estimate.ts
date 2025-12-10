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

export interface CustomerCalculation {
  overheadPercent: number; // Накладные расходы (работа)
  estimatedProfitPercent: number; // Сметная прибыль (работа)
  transportPercent: number; // Транспортные расходы (материалы)
  warehousePercent: number; // Заготовительно-складские расходы (материалы)
  otherName?: string; // Название дополнительного расхода
  otherPercent?: number; // Процент к общей сумме
}

export const DEFAULT_CUSTOMER_CALCULATION: CustomerCalculation = {
  overheadPercent: 95,
  estimatedProfitPercent: 58,
  transportPercent: 6,
  warehousePercent: 3,
  otherName: "",
  otherPercent: undefined,
};

export interface Estimate {
  id: string;
  name: string;
  requestId?: string;
  requestName?: string;
  estimateNumber: string;
  estimateDate: string;
  status: "черновик" | "готов" | "согласован";
  type: "простой ремонт" | "сложный ремонт" | "по договору ТО";
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
