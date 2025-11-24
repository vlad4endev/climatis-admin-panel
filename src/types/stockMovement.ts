export type OperationType = 'приход' | 'расход' | 'возврат';

export interface StockMovement {
  id: string;
  operationDate: string;
  materialId: string;
  materialName: string;
  operationType: OperationType;
  quantity: number;
  relatedRequestId?: string;
  relatedRequestName?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
