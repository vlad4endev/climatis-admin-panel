export interface Work {
  id: string;
  description: string;
  hours: number;
  pricePerHour: number;
}

export interface Material {
  id: string;
  materialId?: string;
  materialName: string;
  quantity: number;
  pricePerUnit: number;
}

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
  workDescription?: string;
  works?: Work[];
  materials?: Material[];
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
