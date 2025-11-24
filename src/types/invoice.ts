export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientId?: string;
  clientName?: string;
  requestId?: string;
  requestName?: string;
  estimateId?: string;
  estimateName?: string;
  amount: number;
  status: "подготовлен" | "выставлен" | "оплачен" | "отменён";
}

export const INVOICE_STATUSES = [
  { value: "подготовлен", label: "Подготовлен" },
  { value: "выставлен", label: "Выставлен" },
  { value: "оплачен", label: "Оплачен" },
  { value: "отменён", label: "Отменён" },
];
