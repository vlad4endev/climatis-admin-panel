import React, { forwardRef } from "react";
import {
  WorkBlock,
  Material,
  CustomerCalculation,
  calculateWorkBlockTotal,
  calculateWorksVat,
  calculateMaterialsVat,
} from "@/types/estimate";

interface CustomerEstimatePDFProps {
  estimateNumber: string;
  estimateDate: string;
  clientName: string;
  objectName: string;
  objectAddress?: string;
  workBlocks: WorkBlock[];
  materials: Material[];
  customerCalc: CustomerCalculation;
  engineerName: string;
  engineerPosition: string;
}

// Format number with 2 decimal places and space as thousands separator, comma for decimal
const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ").replace(".", ",");
};

// Format date as DD.MM.YYYY
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "__.__.____";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

// Pad string to fixed width for alignment
const padRight = (str: string, width: number): string => {
  return str.length >= width ? str.substring(0, width) : str + " ".repeat(width - str.length);
};

const padLeft = (str: string, width: number): string => {
  return str.length >= width ? str.substring(0, width) : " ".repeat(width - str.length) + str;
};

export const CustomerEstimatePDF = forwardRef<HTMLDivElement, CustomerEstimatePDFProps>(
  (
    {
      estimateNumber,
      estimateDate,
      clientName,
      objectName,
      objectAddress,
      workBlocks,
      materials,
      customerCalc,
      engineerName,
    },
    ref
  ) => {
    // Calculate totals
    const worksTotal = workBlocks.reduce((sum, block) => sum + calculateWorkBlockTotal(block), 0);
    const worksCustomerTotal = worksTotal * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
    
    const materialsTotal = materials.reduce((sum, m) => sum + m.quantity * m.pricePerUnit, 0);
    const materialsCustomerTotal = materialsTotal * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);

    // VAT calculations
    const worksVat = calculateWorksVat(worksCustomerTotal, customerCalc.vatRate);
    const materialsVat = calculateMaterialsVat(materialsCustomerTotal, customerCalc.vatRate);

    // Grand totals
    const worksWithVat = worksCustomerTotal + worksVat;
    const grandTotalWithoutVat = worksCustomerTotal + materialsCustomerTotal;
    const grandTotalWithVat = grandTotalWithoutVat + worksVat;

    const vatPercent = customerCalc.vatRate === 22 ? "22" : "0";
    const objectFull = objectAddress ? `${objectName}, ${objectAddress}` : objectName;

    // Generate work rows
    const workRows = workBlocks.map((block, index) => {
      const blockBase = calculateWorkBlockTotal(block);
      const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
      const desc = `${block.description || "Работа"} (с учётом накладных, сметной прибыли)`;
      return { num: index + 1, description: desc, price: formatCurrency(blockCustomerPrice) };
    });

    // Generate material rows
    const materialRows = materials.map((material, index) => {
      const materialPrice = material.quantity * material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
      const desc = `${material.materialName} (с учётом транспортных и заготовительно складских расходов)`;
      return { 
        num: index + 1, 
        description: desc, 
        unit: "шт", 
        qty: String(material.quantity), 
        price: formatCurrency(materialPrice) 
      };
    });

    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          padding: "25px 30px",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "10pt",
          lineHeight: "1.4",
          color: "#000",
          backgroundColor: "#fff",
          whiteSpace: "pre-wrap",
        }}
      >
        <pre style={{ 
          fontFamily: "'Courier New', Courier, monospace", 
          fontSize: "10pt", 
          margin: 0,
          whiteSpace: "pre-wrap",
          wordWrap: "break-word"
        }}>
{`СОГЛАСОВАНО:                                       к Договору № ___ от _______________

"__" _______________ 2026 г.                        _______________________________

                          РАСЧЁТ СТОИМОСТИ

                          № ${padRight(estimateNumber || "б/н", 15)} от ${formatDate(estimateDate)} г.

Заказчик:               ${clientName || "—"}

Объект:                 ${objectFull || "—"}

Исполнитель:            ООО «Климатис» (ИП Щеткин А.Г.)

1. РАБОТЫ

________________________________________________________________________________

| №  | Перечень выполняемых работ                              | Стоимость, руб |
|----|----------------------------------------------------------|----------------|
${workRows.length > 0 
  ? workRows.map(row => 
      `| ${padRight(String(row.num), 2)} | ${padRight(row.description, 56)} | ${padLeft(row.price, 14)} |`
    ).join("\n")
  : `|    | Работы не указаны                                        |                |`
}
|    | ИТОГО:                                                   | ${padLeft(formatCurrency(worksCustomerTotal), 14)} |
|    | НДС (${vatPercent}%, как указано в расчёте):                         | ${padLeft(formatCurrency(worksVat), 14)} |
|    | ВСЕГО по статье РАБОТЫ:                                  | ${padLeft(formatCurrency(worksWithVat), 14)} |
________________________________________________________________________________

2. МАТЕРИАЛЫ

________________________________________________________________________________

| №  | Спецификация используемых материалов        | Ед.изм | Кол-во | Стоимость, руб |
|----|---------------------------------------------|--------|--------|----------------|
${materialRows.length > 0 
  ? materialRows.map(row => 
      `| ${padRight(String(row.num), 2)} | ${padRight(row.description, 43)} | ${padRight(row.unit, 6)} | ${padLeft(row.qty, 6)} | ${padLeft(row.price, 14)} |`
    ).join("\n")
  : `|    | Материалы не указаны                        |        |        |                |`
}
|    | ВСЕГО по статье МАТЕРИАЛЫ:                  |        |        | ${padLeft(formatCurrency(materialsCustomerTotal), 14)} |
|    | в т.ч. НДС (${vatPercent}%, как указано в расчёте):      |        |        | ${padLeft(formatCurrency(materialsVat), 14)} |
________________________________________________________________________________

ИТОГО по расчёту без НДС (здесь сумма по формуле без НДС):            ${padLeft(formatCurrency(grandTotalWithoutVat), 14)}

НДС (${vatPercent}%, как указано в расчёте):                                      ${padLeft(formatCurrency(worksVat + materialsVat), 14)}

ВСЕГО по расчёту:                                                     ${padLeft(formatCurrency(grandTotalWithVat), 14)}


Расчёт составил                                                       ${engineerName || "________________"}
`}
        </pre>
      </div>
    );
  }
);

CustomerEstimatePDF.displayName = "CustomerEstimatePDF";
