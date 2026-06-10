export interface WorkPriceItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
