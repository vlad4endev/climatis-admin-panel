import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { SparePart } from "@/types/sparePart";
import { SparePartForm } from "@/components/spareParts/SparePartForm";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SpareParts() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  
  // Helper to generate purchasePrice 15-20% below retailPrice
  const calcPurchase = (retail: number) => Math.round(retail * (0.80 + Math.random() * 0.05));
  
  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    const items: Omit<SparePart, 'purchasePrice'>[] = [
      // Кондиционирование
      { id: "1", name: "Кронштейн 600х600 РМТ", internalArticle: "KR-600-600-RMT", category: "Кондиционирование", unit: "пара", currentStock: 20, minStock: 5, retailPrice: 1200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "2", name: "Кронштейн 450х450 РМТ", internalArticle: "KR-450-450-RMT", category: "Кондиционирование", unit: "пара", currentStock: 18, minStock: 5, retailPrice: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "3", name: "Кронштейн 415х450 Ballu", internalArticle: "KR-415-450-BLU", category: "Кондиционирование", unit: "пара", currentStock: 0, minStock: 2, retailPrice: 950, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "4", name: "Кронштейн 500", internalArticle: "KR-500", category: "Кондиционирование", unit: "пара", currentStock: 0, minStock: 2, retailPrice: 800, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "5", name: "Кронштейн 500х600 Ballu", internalArticle: "KR-500-600-BLU", category: "Кондиционирование", unit: "пара", currentStock: 2, minStock: 2, retailPrice: 1100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "6", name: "Козырек защитный 900х510", internalArticle: "KZ-900-510", category: "Кондиционирование", unit: "к-т", currentStock: 0, minStock: 2, retailPrice: 2500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "7", name: "Козырек защитный 800х510", internalArticle: "KZ-800-510", category: "Кондиционирование", unit: "шт", currentStock: 3, minStock: 2, retailPrice: 2300, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "8", name: "Козырек Ballu 1000*500", internalArticle: "KZ-1000-500-BLU", category: "Кондиционирование", unit: "шт", currentStock: 0, minStock: 2, retailPrice: 2700, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "9", name: "Антивандальная решетка", internalArticle: "ANT-RESH", category: "Кондиционирование", unit: "к-т", currentStock: 1, minStock: 1, retailPrice: 3500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "10", name: "Труба медная 1/4 с флексом", internalArticle: "TR-MED-14-FL", category: "Кондиционирование", unit: "мп", currentStock: 200, minStock: 50, retailPrice: 180, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "11", name: "Труба медная 3/8 с флексом", internalArticle: "TR-MED-38-FL", category: "Кондиционирование", unit: "мп", currentStock: 218.5, minStock: 50, retailPrice: 220, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "12", name: "Труба медная 1/2 с флексом", internalArticle: "TR-MED-12-FL", category: "Кондиционирование", unit: "мп", currentStock: 189, minStock: 50, retailPrice: 280, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "13", name: "Труба медная 5/8 с флексом", internalArticle: "TR-MED-58-FL", category: "Кондиционирование", unit: "мп", currentStock: 108, minStock: 30, retailPrice: 350, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "14", name: "Труба медная 3/4 с флексом", internalArticle: "TR-MED-34-FL", category: "Кондиционирование", unit: "мп", currentStock: 128, minStock: 30, retailPrice: 420, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "15", name: "Траверса 20*30", internalArticle: "TRAV-20-30", category: "Кондиционирование", unit: "мп", currentStock: 114, minStock: 30, retailPrice: 150, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "16", name: "Траверса 38/40", internalArticle: "TRAV-38-40", category: "Кондиционирование", unit: "мп", currentStock: 171, minStock: 40, retailPrice: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "17", name: "Фреон R22", internalArticle: "FREON-R22", category: "Кондиционирование", unit: "баллон", currentStock: 7, minStock: 2, retailPrice: 8500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "18", name: "Фреон R32", internalArticle: "FREON-R32", category: "Кондиционирование", unit: "баллон", currentStock: 7, minStock: 2, retailPrice: 9000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "19", name: "Фреон R134", internalArticle: "FREON-R134", category: "Кондиционирование", unit: "баллон", currentStock: 4, minStock: 2, retailPrice: 7500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "20", name: "Фреон R404А", internalArticle: "FREON-R404A", category: "Кондиционирование", unit: "баллон", currentStock: 3, minStock: 2, retailPrice: 12000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "21", name: "Фреон R407c", internalArticle: "FREON-R407C", category: "Кондиционирование", unit: "баллон", currentStock: 2, minStock: 2, retailPrice: 11000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "22", name: "Фреон R410a", internalArticle: "FREON-R410A", category: "Кондиционирование", unit: "баллон", currentStock: 9, minStock: 3, retailPrice: 10500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "23", name: "Зимний комплект Регулятор РДКК-33", internalArticle: "ZK-RDKK-33", category: "Кондиционирование", unit: "шт", currentStock: 0, minStock: 2, retailPrice: 4500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "24", name: "Зимний комплект Нагреватель картера", internalArticle: "ZK-NAG-KART", category: "Кондиционирование", unit: "шт", currentStock: 4, minStock: 2, retailPrice: 2800, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "25", name: "Зимний комплект Нагреватель дренажа", internalArticle: "ZK-NAG-DREN", category: "Кондиционирование", unit: "шт", currentStock: 3, minStock: 2, retailPrice: 1500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "26", name: "Регулятор скорости для 3х ф.дв.VLT Micro", internalArticle: "REG-VLT-MICRO", category: "Кондиционирование", unit: "шт", currentStock: 1, minStock: 1, retailPrice: 15000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "27", name: "Регулятор давления конденсации РДК-8,4", internalArticle: "RDK-8-4", category: "Кондиционирование", unit: "шт", currentStock: 0, minStock: 1, retailPrice: 8500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "28", name: "Помпа SI 27", internalArticle: "POMP-SI-27", category: "Кондиционирование", unit: "шт", currentStock: 3, minStock: 2, retailPrice: 3200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "29", name: "Помпа Mini Flowatch", internalArticle: "POMP-MINI-FL", category: "Кондиционирование", unit: "шт", currentStock: 1, minStock: 1, retailPrice: 2800, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "30", name: "Дренажная помпа KERNICK VL-15", internalArticle: "DREN-KERN-VL15", category: "Кондиционирование", unit: "шт", currentStock: 4, minStock: 2, retailPrice: 3500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "31", name: "Дренажная помпа KERNICK VL маленькая", internalArticle: "DREN-KERN-VL-SM", category: "Кондиционирование", unit: "шт", currentStock: 3, minStock: 2, retailPrice: 2900, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "32", name: "Пена монтажная", internalArticle: "PENA-MONT", category: "Кондиционирование", unit: "шт", currentStock: 5, minStock: 5, retailPrice: 350, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "33", name: "Металлопластиковая труба d16", internalArticle: "MP-TRUB-D16", category: "Кондиционирование", unit: "мп", currentStock: 331, minStock: 50, retailPrice: 85, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "34", name: "Металлопластиковая труба d20", internalArticle: "MP-TRUB-D20", category: "Кондиционирование", unit: "мп", currentStock: 88, minStock: 30, retailPrice: 110, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "35", name: "Дренаж гофрированный d16", internalArticle: "DREN-GOFR-D16", category: "Кондиционирование", unit: "мп", currentStock: 0, minStock: 20, retailPrice: 45, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "36", name: "Дренаж гофрированный d20", internalArticle: "DREN-GOFR-D20", category: "Кондиционирование", unit: "мп", currentStock: 0, minStock: 20, retailPrice: 55, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "37", name: "Труба гофрированная 16мм", internalArticle: "TR-GOFR-16", category: "Кондиционирование", unit: "м", currentStock: 34, minStock: 20, retailPrice: 35, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "38", name: "Труба гофрированная 20мм", internalArticle: "TR-GOFR-20", category: "Кондиционирование", unit: "м", currentStock: 0, minStock: 20, retailPrice: 45, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "39", name: "Скотч ТПЛ тканевый", internalArticle: "SCOTCH-TPL", category: "Кондиционирование", unit: "шт", currentStock: 14, minStock: 5, retailPrice: 280, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "40", name: "Скотч алюминевый 50мм", internalArticle: "SCOTCH-AL-50", category: "Кондиционирование", unit: "шт", currentStock: 48, minStock: 10, retailPrice: 180, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "41", name: "Скотч алюминевый широкий", internalArticle: "SCOTCH-AL-WIDE", category: "Кондиционирование", unit: "шт", currentStock: 26, minStock: 8, retailPrice: 220, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Кабельная продукция
      { id: "42", name: "Кабель ВВГ нг 3х1,5", internalArticle: "VVG-3X1-5", category: "Кабельная продукция", unit: "мп", currentStock: 190, minStock: 50, retailPrice: 65, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "43", name: "Кабель ВВГ нг 3х2,5", internalArticle: "VVG-3X2-5", category: "Кабельная продукция", unit: "мп", currentStock: 113, minStock: 50, retailPrice: 95, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "44", name: "Кабель ВВГ нг 3х4", internalArticle: "VVG-3X4", category: "Кабельная продукция", unit: "мп", currentStock: 50, minStock: 30, retailPrice: 145, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "45", name: "Кабель ВВГ нг 4х1,5", internalArticle: "VVG-4X1-5", category: "Кабельная продукция", unit: "мп", currentStock: 444, minStock: 80, retailPrice: 75, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "46", name: "Кабель ВВГ нг 4х2,5", internalArticle: "VVG-4X2-5", category: "Кабельная продукция", unit: "мп", currentStock: 0, minStock: 50, retailPrice: 125, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "47", name: "Кабель ВВГ нг 4х6", internalArticle: "VVG-4X6", category: "Кабельная продукция", unit: "мп", currentStock: 100, minStock: 30, retailPrice: 280, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "48", name: "Кабель ВВГ нг 2х1,5", internalArticle: "VVG-2X1-5", category: "Кабельная продукция", unit: "м", currentStock: 300, minStock: 60, retailPrice: 45, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "49", name: "Кабель ВВГ нг 2х2,5", internalArticle: "VVG-2X2-5", category: "Кабельная продукция", unit: "м", currentStock: 200, minStock: 50, retailPrice: 65, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "50", name: "Кабель ВВГ нг 5х1,5", internalArticle: "VVG-5X1-5", category: "Кабельная продукция", unit: "мп", currentStock: 302, minStock: 60, retailPrice: 85, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "51", name: "Кабель ВВГ нг 5х2,5", internalArticle: "VVG-5X2-5", category: "Кабельная продукция", unit: "мп", currentStock: 217, minStock: 50, retailPrice: 145, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "52", name: "Кабель ВВГ 5х4", internalArticle: "VVG-5X4", category: "Кабельная продукция", unit: "мп", currentStock: 0, minStock: 30, retailPrice: 220, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "53", name: "Провод ПВС 3х1,5", internalArticle: "PVS-3X1-5", category: "Кабельная продукция", unit: "м", currentStock: 41, minStock: 20, retailPrice: 55, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "54", name: "Провод ПВС 2х1", internalArticle: "PVS-2X1", category: "Кабельная продукция", unit: "м", currentStock: 120, minStock: 30, retailPrice: 35, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "55", name: "Провод ПВС 3х2,5", internalArticle: "PVS-3X2-5", category: "Кабельная продукция", unit: "м", currentStock: 118, minStock: 30, retailPrice: 85, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "56", name: "Провод ПВС 3х0,75", internalArticle: "PVS-3X0-75", category: "Кабельная продукция", unit: "м", currentStock: 0, minStock: 20, retailPrice: 42, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "57", name: "Провод ПВС 2*1,5", internalArticle: "PVS-2X1-5", category: "Кабельная продукция", unit: "м", currentStock: 73, minStock: 20, retailPrice: 45, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "58", name: "Провод 1х1", internalArticle: "PROV-1X1", category: "Кабельная продукция", unit: "м", currentStock: 45, minStock: 20, retailPrice: 18, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "59", name: "Шнур соединительный 2х0,75", internalArticle: "SHNUR-2X0-75", category: "Кабельная продукция", unit: "м", currentStock: 0, minStock: 15, retailPrice: 28, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "60", name: "Коробка распределительная", internalArticle: "KOR-RASP", category: "Кабельная продукция", unit: "шт", currentStock: 10, minStock: 10, retailPrice: 65, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Вентиляция
      { id: "61", name: "Вентилятор канальный TUBE 100XL", internalArticle: "VENT-TUBE-100XL", category: "Вентиляция", unit: "шт", currentStock: 4, minStock: 2, retailPrice: 4500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "62", name: "Вентилятор канальный TUBE 125XL", internalArticle: "VENT-TUBE-125XL", category: "Вентиляция", unit: "шт", currentStock: 3, minStock: 2, retailPrice: 5200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "63", name: "Вентилятор канальный TUBE 160XL", internalArticle: "VENT-TUBE-160XL", category: "Вентиляция", unit: "шт", currentStock: 3, minStock: 2, retailPrice: 6500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "64", name: "Вентилятор канальный TUBE 200XL", internalArticle: "VENT-TUBE-200XL", category: "Вентиляция", unit: "шт", currentStock: 5, minStock: 2, retailPrice: 8500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "65", name: "Вентилятор канальный TUBE 250XL", internalArticle: "VENT-TUBE-250XL", category: "Вентиляция", unit: "шт", currentStock: 2, minStock: 1, retailPrice: 11500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "66", name: "Вентилятор канальный TUBE 315XL", internalArticle: "VENT-TUBE-315XL", category: "Вентиляция", unit: "шт", currentStock: 1, minStock: 1, retailPrice: 15500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "67", name: "Вентилятор VKK-125m", internalArticle: "VENT-VKK-125M", category: "Вентиляция", unit: "шт", currentStock: 4, minStock: 2, retailPrice: 5500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "68", name: "Вентилятор VKK-160", internalArticle: "VENT-VKK-160", category: "Вентиляция", unit: "шт", currentStock: 2, minStock: 1, retailPrice: 6800, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "69", name: "Вентилятор ВКК -100", internalArticle: "VENT-VKK-100", category: "Вентиляция", unit: "шт", currentStock: 4, minStock: 2, retailPrice: 4200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "70", name: "Вентилятор ВКК -200", internalArticle: "VENT-VKK-200", category: "Вентиляция", unit: "шт", currentStock: 2, minStock: 1, retailPrice: 8900, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "71", name: "Вентилятор ВКК -250", internalArticle: "VENT-VKK-250", category: "Вентиляция", unit: "шт", currentStock: 2, minStock: 1, retailPrice: 12000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "72", name: "Вентилятор ВКК -315", internalArticle: "VENT-VKK-315", category: "Вентиляция", unit: "шт", currentStock: 2, minStock: 1, retailPrice: 16500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "73", name: "Виброизолятор ДО 38", internalArticle: "VIBRO-DO-38", category: "Вентиляция", unit: "шт", currentStock: 3, minStock: 5, retailPrice: 450, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "74", name: "Виброизолятор ДО 39", internalArticle: "VIBRO-DO-39", category: "Вентиляция", unit: "шт", currentStock: 16, minStock: 10, retailPrice: 480, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "75", name: "Виброизолятор ДО-41", internalArticle: "VIBRO-DO-41", category: "Вентиляция", unit: "шт", currentStock: 30, minStock: 15, retailPrice: 520, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "76", name: "Виброизолятор ДО-42", internalArticle: "VIBRO-DO-42", category: "Вентиляция", unit: "шт", currentStock: 0, minStock: 10, retailPrice: 550, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "77", name: "Винт с полусферической головкой", internalArticle: "VINT-POLUSF", category: "Вентиляция", unit: "шт", currentStock: 15, minStock: 20, retailPrice: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "78", name: "Винт с полусферической головкой 6х12", internalArticle: "VINT-POLUSF-6X12", category: "Вентиляция", unit: "шт", currentStock: 100, minStock: 50, retailPrice: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "79", name: "Обратный клапан d100 бабочка", internalArticle: "KLAP-OBR-D100", category: "Вентиляция", unit: "шт", currentStock: 6, minStock: 3, retailPrice: 850, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "80", name: "Обратный клапан d125 бабочка", internalArticle: "KLAP-OBR-D125", category: "Вентиляция", unit: "шт", currentStock: 11, minStock: 5, retailPrice: 1100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "81", name: "Обратный клапан d160 бабочка", internalArticle: "KLAP-OBR-D160", category: "Вентиляция", unit: "шт", currentStock: 3, minStock: 2, retailPrice: 1450, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "82", name: "Обратный клапан d200 бабочка", internalArticle: "KLAP-OBR-D200", category: "Вентиляция", unit: "шт", currentStock: 0, minStock: 2, retailPrice: 1850, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "83", name: "Обратный клапан d250 бабочка", internalArticle: "KLAP-OBR-D250", category: "Вентиляция", unit: "шт", currentStock: 1, minStock: 1, retailPrice: 2450, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "84", name: "Обратный клапан d315 бабочка", internalArticle: "KLAP-OBR-D315", category: "Вентиляция", unit: "шт", currentStock: 3, minStock: 2, retailPrice: 3200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "85", name: "Гибкий воздуховод d102", internalArticle: "VOZDUH-GIB-D102", category: "Вентиляция", unit: "мп", currentStock: 20, minStock: 20, retailPrice: 180, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "86", name: "Гибкий воздуховод d127", internalArticle: "VOZDUH-GIB-D127", category: "Вентиляция", unit: "мп", currentStock: 20, minStock: 20, retailPrice: 220, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "87", name: "Гибкий воздуховод d162", internalArticle: "VOZDUH-GIB-D162", category: "Вентиляция", unit: "мп", currentStock: 20, minStock: 20, retailPrice: 280, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "88", name: "Воздуховод гибкий 160", internalArticle: "VOZDUH-GIB-160", category: "Вентиляция", unit: "мп", currentStock: 0, minStock: 15, retailPrice: 285, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "89", name: "Воздуховод гибкий 203", internalArticle: "VOZDUH-GIB-203", category: "Вентиляция", unit: "мп", currentStock: 20, minStock: 15, retailPrice: 380, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "90", name: "Воздуховод гибкий 315", internalArticle: "VOZDUH-GIB-315", category: "Вентиляция", unit: "мп", currentStock: 10, minStock: 10, retailPrice: 620, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "91", name: "Диффузор 100", internalArticle: "DIFF-100", category: "Вентиляция", unit: "шт", currentStock: 25, minStock: 10, retailPrice: 320, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "92", name: "Диффузор 125", internalArticle: "DIFF-125", category: "Вентиляция", unit: "шт", currentStock: 39, minStock: 15, retailPrice: 380, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "93", name: "Диффузор 160", internalArticle: "DIFF-160", category: "Вентиляция", unit: "шт", currentStock: 20, minStock: 10, retailPrice: 480, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "94", name: "Диффузор 200", internalArticle: "DIFF-200", category: "Вентиляция", unit: "шт", currentStock: 3, minStock: 5, retailPrice: 620, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "95", name: "Шуруп саморез по дереву 3,5*45", internalArticle: "SHUR-SAM-35-45", category: "Вентиляция", unit: "кг", currentStock: 5, minStock: 3, retailPrice: 280, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "96", name: "Дюбель - гвоздь 6*60", internalArticle: "DYUBEL-GV-6-60", category: "Вентиляция", unit: "уп", currentStock: 5, minStock: 3, retailPrice: 450, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "97", name: "Дюбель - гвоздь металл 6х30", internalArticle: "DYUBEL-GV-MET-6-30", category: "Вентиляция", unit: "шт", currentStock: 0, minStock: 50, retailPrice: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "98", name: "Потолочный анкер-клин 6х40", internalArticle: "ANK-KLIN-6-40", category: "Вентиляция", unit: "шт", currentStock: 500, minStock: 100, retailPrice: 12, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "99", name: "Дюбель - гвоздь 10*300", internalArticle: "DYUBEL-GV-10-300", category: "Вентиляция", unit: "шт", currentStock: 30, minStock: 20, retailPrice: 35, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "100", name: "Дюбель 12*70", internalArticle: "DYUBEL-12-70", category: "Вентиляция", unit: "уп", currentStock: 3, minStock: 2, retailPrice: 520, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "101", name: "Дюбель 12*120", internalArticle: "DYUBEL-12-120", category: "Вентиляция", unit: "уп", currentStock: 1, minStock: 1, retailPrice: 680, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "102", name: "Дюбель-грибок", internalArticle: "DYUBEL-GRIBOK", category: "Вентиляция", unit: "уп", currentStock: 1, minStock: 2, retailPrice: 380, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "103", name: "Дюбель-гвоздь 10*100", internalArticle: "DYUBEL-GV-10-100", category: "Вентиляция", unit: "шт", currentStock: 150, minStock: 50, retailPrice: 18, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "104", name: "Держатель PAS 23N", internalArticle: "DERZH-PAS-23N", category: "Вентиляция", unit: "кор", currentStock: 10, minStock: 3, retailPrice: 2500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "105", name: "Держатель PAS 36N", internalArticle: "DERZH-PAS-36N", category: "Вентиляция", unit: "кор", currentStock: 1, minStock: 1, retailPrice: 3200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "106", name: "Лента перфорированная прямая 20*0,7 (25м)", internalArticle: "LENT-PERF-20-07", category: "Вентиляция", unit: "шт", currentStock: 5, minStock: 3, retailPrice: 420, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "107", name: "Лента уплотнительная 15*5 (10м)", internalArticle: "LENT-UPL-15-5", category: "Вентиляция", unit: "шт", currentStock: 105, minStock: 20, retailPrice: 180, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "108", name: "Лента перфорированная прямая 20*1,0 (25м)", internalArticle: "LENT-PERF-20-10", category: "Вентиляция", unit: "м", currentStock: 100, minStock: 30, retailPrice: 18, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "109", name: "Лента перфорированная прямая 20*0,5 (25м)", internalArticle: "LENT-PERF-20-05", category: "Вентиляция", unit: "шт", currentStock: 5, minStock: 3, retailPrice: 380, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "110", name: "Опора гайка", internalArticle: "OPOR-GAIKA", category: "Вентиляция", unit: "шт", currentStock: 150, minStock: 50, retailPrice: 25, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "111", name: "Герметик", internalArticle: "GERMET", category: "Вентиляция", unit: "шт", currentStock: 0, minStock: 5, retailPrice: 180, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "112", name: "Герметик универс.силиконов.X-PERT бесцветный", internalArticle: "GERMET-XPERT-BESV", category: "Вентиляция", unit: "шт", currentStock: 24, minStock: 8, retailPrice: 220, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "113", name: "Герметик силиконовый универсальный белый 280 мл.", internalArticle: "GERMET-SIL-BEL-280", category: "Вентиляция", unit: "шт", currentStock: 13, minStock: 8, retailPrice: 210, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "114", name: "Гайка для шпильки удлиненная М8", internalArticle: "GAIKA-SHPIL-M8", category: "Вентиляция", unit: "кг", currentStock: 0, minStock: 2, retailPrice: 480, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "115", name: "Гайка стандартная оцинк. М8", internalArticle: "GAIKA-STAND-M8", category: "Вентиляция", unit: "кг", currentStock: 35, minStock: 5, retailPrice: 350, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "116", name: "Гайка М10 удлиненная", internalArticle: "GAIKA-M10-UDL", category: "Вентиляция", unit: "шт", currentStock: 100, minStock: 30, retailPrice: 12, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "117", name: "Гайка М8 удлиненная", internalArticle: "GAIKA-M8-UDL", category: "Вентиляция", unit: "шт", currentStock: 300, minStock: 50, retailPrice: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "118", name: "Гайка барашек М6", internalArticle: "GAIKA-BAR-M6", category: "Вентиляция", unit: "кг", currentStock: 300, minStock: 50, retailPrice: 420, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "119", name: "Круг отрезной 125х1,2", internalArticle: "KRUG-OTR-125-12", category: "Вентиляция", unit: "шт", currentStock: 160, minStock: 30, retailPrice: 45, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    return items.map(item => ({
      ...item,
      purchasePrice: calcPurchase(item.retailPrice)
    })) as SparePart[];
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<SparePart | undefined>();
  const [viewingSparePart, setViewingSparePart] = useState<SparePart | null>(null);

  const config: EntityListConfig<SparePart> = {
    fields: [
      { key: "name", label: "Наименование материала", type: "text", sortable: true, searchable: true, editable: true },
      { key: "internalArticle", label: "Артикул", type: "text", sortable: true, searchable: true, editable: true },
      { 
        key: "category", 
        label: "Раздел", 
        type: "select", 
        sortable: true, 
        filterable: true,
        editable: true,
        options: [
          { value: "Кондиционирование", label: "Кондиционирование" },
          { value: "Кабельная продукция", label: "Кабельная продукция" },
          { value: "Вентиляция", label: "Вентиляция" },
        ]
      },
      { 
        key: "currentStock", 
        label: "Остаток", 
        type: "text", 
        sortable: true,
        editable: true,
        render: (value, item) => {
          const isLow = item.currentStock <= item.minStock;
          return (
            <span className={isLow ? "text-destructive font-semibold" : ""}>
              {value} {item.unit}
            </span>
          );
        }
      },
      { 
        key: "minStock", 
        label: "Мин. остаток", 
        type: "text", 
        sortable: true,
        editable: true,
        render: (value, item) => `${value} ${item.unit}`
      },
      { 
        key: "purchasePrice", 
        label: "Закупка", 
        type: "text", 
        sortable: true,
        editable: true,
        render: (value) => `${value} ₽`
      },
      { 
        key: "retailPrice", 
        label: "Розница", 
        type: "text", 
        sortable: true,
        editable: true,
        render: (value) => `${value} ₽`
      },
      { key: "notes", label: "Примечания", type: "textarea", editable: true },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingSparePart(item),
    onUpdate: (id, field, value) => {
      setSpareParts(prev =>
        prev.map(sp =>
          sp.id === id ? { ...sp, [field]: value, updatedAt: new Date().toISOString() } : sp
        )
      );
      toast({
        title: "Успешно",
        description: "Комплектующее обновлено",
      });
    },
    onDelete: (id) => {
      setSpareParts(prev => prev.filter(sp => sp.id !== id));
      toast({
        title: "Успешно",
        description: "Комплектующее удалено",
      });
    },
    onEdit: (item) => {
      setEditingSparePart(item);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<SparePart>) => {
    if (editingSparePart) {
      setSpareParts(prev =>
        prev.map(sp =>
          sp.id === editingSparePart.id
            ? { ...sp, ...data, updatedAt: new Date().toISOString() }
            : sp
        )
      );
      toast({
        title: "Успешно",
        description: "Комплектующее обновлено",
      });
    } else {
      const newSparePart: SparePart = {
        id: Date.now().toString(),
        ...data as SparePart,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSpareParts(prev => [...prev, newSparePart]);
      toast({
        title: "Успешно",
        description: "Комплектующее создано",
      });
    }
    setIsFormOpen(false);
    setEditingSparePart(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Комплектующие"
        buttonLabel="Добавить комплектующее"
        onButtonClick={() => setIsFormOpen(true)}
      />

      <EntityList
        items={spareParts}
        config={config}
        emptyMessage="Нет комплектующих"
        defaultViewMode="table"
        initialFilters={categoryFromUrl ? [{ field: 'category', value: categoryFromUrl }] : []}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSparePart ? "Редактировать комплектующее" : "Добавить комплектующее"}
            </DialogTitle>
          </DialogHeader>
          <SparePartForm
            sparePart={editingSparePart}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingSparePart(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingSparePart}
        open={!!viewingSparePart}
        onOpenChange={(open) => !open && setViewingSparePart(null)}
        config={config}
        title={viewingSparePart?.name}
      />
    </div>
  );
}
