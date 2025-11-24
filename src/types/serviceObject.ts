export interface ServiceObject {
  id: string;
  clientId: string;
  clientName: string; // Денормализованное поле для удобства
  objectName: string;
  address: string;
  accessDescription: string;
  notes: string;
  createdAt: Date;
}
