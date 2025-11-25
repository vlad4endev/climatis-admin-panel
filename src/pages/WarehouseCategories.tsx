import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

interface CategoryStats {
  name: string;
  itemCount: number;
  totalStock: number;
  lowStockItems: number;
}

export default function WarehouseCategories() {
  // Get categories from SpareParts (this would ideally be shared state or from a backend)
  const categories: CategoryStats[] = useMemo(() => {
    // These would normally come from the actual spare parts data
    return [
      {
        name: "Кондиционирование",
        itemCount: 41,
        totalStock: 2847.5,
        lowStockItems: 8,
      },
      {
        name: "Кабельная продукция",
        itemCount: 19,
        totalStock: 2603,
        lowStockItems: 3,
      },
      {
        name: "Вентиляция",
        itemCount: 59,
        totalStock: 1956,
        lowStockItems: 12,
      },
    ];
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Разделы в складе</h1>
        <p className="text-muted-foreground mt-2">
          Обзор категорий комплектующих и статистика по складу
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription>Раздел склада</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Наименований:</span>
                  <span className="font-semibold text-lg">{category.itemCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Общий остаток:</span>
                  <span className="font-semibold text-lg">{category.totalStock.toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Нужно пополнить:</span>
                  <span className={`font-semibold text-lg ${category.lowStockItems > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {category.lowStockItems}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Статистика склада</CardTitle>
            <CardDescription>Общая информация по всем разделам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего категорий</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего наименований</p>
                <p className="text-2xl font-bold">
                  {categories.reduce((sum, cat) => sum + cat.itemCount, 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Требуют внимания</p>
                <p className="text-2xl font-bold text-destructive">
                  {categories.reduce((sum, cat) => sum + cat.lowStockItems, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
