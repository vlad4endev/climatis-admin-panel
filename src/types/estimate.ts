export interface Work {
  id: string;
  description: string;
  hours: number;
  pricePerHour: number;
}

export interface Estimate {
  id: string;
  name: string;
  requestId?: string;
  requestName?: string;
  estimateNumber: string;
  estimateDate: string;
  status: "черновик" | "готов" | "согласован с заказчиком";
  type: "простой ремонт" | "сложный ремонт" | "по договору ТО";
  engineerComment?: string;
  works?: Work[];
}

export const ESTIMATE_STATUSES = [
  { value: "черновик", label: "Черновик" },
  { value: "готов", label: "Готов" },
  { value: "согласован с заказчиком", label: "Согласован с заказчиком" },
];

export const ESTIMATE_TYPES = [
  { value: "простой ремонт", label: "Простой ремонт" },
  { value: "сложный ремонт", label: "Сложный ремонт" },
  { value: "по договору ТО", label: "По договору ТО" },
];
