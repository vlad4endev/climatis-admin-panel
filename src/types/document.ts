export type DocumentStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Document {
  id: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  contractType: 'maintenance' | 'general' | 'one-time';
  clientId: string;
  clientName?: string;
  objectId?: string;
  objectName?: string;
  responseConditions: string;
  notes: string;
  fileName?: string;
  filePath?: string;
  status: DocumentStatus;
}

export const DOCUMENT_STATUSES: { value: DocumentStatus; label: string }[] = [
  { value: 'draft', label: 'Черновик' },
  { value: 'active', label: 'Активный' },
  { value: 'completed', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
];

export const CONTRACT_TYPES = [
  { value: 'maintenance', label: 'ТО' },
  { value: 'general', label: 'Общий' },
  { value: 'one-time', label: 'Разовый' },
] as const;
