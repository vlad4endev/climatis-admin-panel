import { WorkBlock, Material } from "./estimate";

export type AssignmentStatus = "draft" | "new" | "assigned" | "completed";

export const ASSIGNMENT_STATUSES: { value: AssignmentStatus; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "new", label: "Новое" },
  { value: "assigned", label: "Передано" },
  { value: "completed", label: "Выполнено" },
];

export interface Assignment {
  id: string;
  assignmentNumber: string;
  createdAt: string;
  status: AssignmentStatus;
  
  // Связи
  requestId: string;
  requestNumber: string;
  estimateId: string;
  estimateName: string;
  
  // Бригада
  teamId: string;
  teamName: string;
  
  // Данные из расчёта
  workBlocks: WorkBlock[];
  materials: Material[];
  
  // Дополнительно
  comments: string;
  clientName?: string;
  objectName?: string;
}
