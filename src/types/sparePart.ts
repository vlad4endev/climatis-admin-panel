export interface SparePart {
  id: string;
  name: string;
  internalArticle: string;
  unit: 'шт' | 'м' | 'кг' | 'л' | 'м²' | 'м³' | 'пара' | 'к-т' | 'мп' | 'баллон' | 'уп' | 'кор';
  currentStock: number;
  minStock: number;
  purchasePrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
