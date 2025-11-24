export interface SparePart {
  id: string;
  name: string;
  internalArticle: string;
  unit: 'шт' | 'м' | 'кг' | 'л' | 'м²' | 'м³';
  currentStock: number;
  minStock: number;
  purchasePrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
