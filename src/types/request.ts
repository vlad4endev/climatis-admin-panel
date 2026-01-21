export type RequestStatus = 
  | "draft"
  | "new"
  | "needs_calculation"
  | "awaiting_materials"
  | "in_progress"
  | "partially_completed"
  | "completed"
  | "closed";

export type RequestType = "repair" | "maintenance" | "installation";
export type RequestPriority = "urgent" | "normal";

export const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "new", label: "Новая" },
  { value: "needs_calculation", label: "Требует расчёта" },
  { value: "awaiting_materials", label: "Ожидает материалов" },
  { value: "in_progress", label: "В работе" },
  { value: "partially_completed", label: "Частично выполнена" },
  { value: "completed", label: "Выполнена" },
  { value: "closed", label: "Закрыта" },
];

export const REQUEST_TYPES: { value: RequestType; label: string }[] = [
  { value: "repair", label: "Ремонт" },
  { value: "maintenance", label: "ТО" },
  { value: "installation", label: "Монтаж" },
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
