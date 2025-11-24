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
}

export const CONTRACT_TYPES = [
  { value: 'maintenance', label: 'ТО' },
  { value: 'general', label: 'Общий' },
  { value: 'one-time', label: 'Разовый' },
] as const;
