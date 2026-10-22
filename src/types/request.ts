export type RequestStatus =
  | "draft"
  | "new"
  | "needs_calculation"
  | "awaiting_approval"
  | "awaiting_materials"
  | "in_progress"
  | "partially_completed"
  | "completed"
  | "closed";

export type RequestType = "repair" | "maintenance" | "installation" | "manufacturing";
export type RequestPriority = "urgent" | "normal";

export const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "new", label: "Новая" },
  { value: "needs_calculation", label: "Требует расчёта" },
  { value: "awaiting_approval", label: "Ожидает согласования" },
  { value: "awaiting_materials", label: "Ожидает материалов" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Выполнена" },
  { value: "closed", label: "Закрыта" },
];

// Старый статус оставлен в БД для совместимости со старыми заявками, но не
// предлагается при создании/редактировании — нужен только для вывода метки.
const LEGACY_REQUEST_STATUS_LABELS: Partial<Record<RequestStatus, string>> = {
  partially_completed: "Частично выполнена",
};

export function getRequestStatusLabel(status: RequestStatus): string {
  return REQUEST_STATUSES.find(s => s.value === status)?.label
    ?? LEGACY_REQUEST_STATUS_LABELS[status]
    ?? status;
}

export const REQUEST_TYPES: { value: RequestType; label: string }[] = [
  { value: "repair", label: "Ремонт" },
  { value: "maintenance", label: "ТО" },
  { value: "installation", label: "Монтаж" },
  { value: "manufacturing", label: "Изготовление (производство)" },
];

export const REQUEST_PRIORITIES: { value: RequestPriority; label: string }[] = [
  { value: "urgent", label: "Срочная" },
  { value: "normal", label: "Обычная" },
];

export interface Request {
  id: string;
  requestNumber: string;
  createdAt: Date;
  status: RequestStatus;
  type: RequestType;
  priority: RequestPriority;
  clientId: string;
  clientName: string;
  objectId: string;
  objectName: string;
  contractId?: string;
  contractNumber?: string;
  contractConditions?: string;
  problemDescription: string;
  comments: string;
  desiredDate?: string;
  responsibleManagerId?: string;
  responsibleManagerName?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  plannedVisitDate?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  hoursSpent?: number;
}
