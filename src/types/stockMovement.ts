export type OperationType = 'приход' | 'расход' | 'возврат';

export interface StockMovementMaterial {
  materialId: string;
  materialName: string;
  quantity: number;
}

export interface StockMovement {
  id: string;
  operationDate: string;
  operationType: OperationType;
  materials: StockMovementMaterial[];
  relatedRequestId?: string;
  relatedRequestName?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
