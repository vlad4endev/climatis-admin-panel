import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import {
  WorkBlock,
  Material,
  CustomerCalculation,
  calculateWorkBlockTotal,
  calculateWorksVat,
  calculateMaterialsVat,
} from "@/types/estimate";

interface GeneratePDFParams {
  estimateNumber: string;
  estimateDate: string;
  clientName: string;
  objectName: string;
  objectAddress?: string;
  workBlocks: WorkBlock[];
  materials: Material[];
  customerCalc: CustomerCalculation;
  engineerName: string;
}

// Format number with 2 decimal places and space as thousands separator
const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ").replace(".", ",");
};

// Format date as DD.MM.YYYYг.
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "__.__.____г.";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}г.`;
};

export function generateCustomerEstimatePDF(params: GeneratePDFParams): void {
  const {
    estimateNumber,
    estimateDate,
    clientName,
    objectName,
    objectAddress,
    workBlocks,
    materials,
    customerCalc,
    engineerName,
  } = params;

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
  const grandTotalVat = worksVat + materialsVat;
  const grandTotalWithVat = grandTotalWithoutVat + worksVat;

  const vatNote = "(0 либо 22%, как указано в расчете)";
  const objectFull = objectAddress ? `${objectName}, ${objectAddress}` : objectName;

  // Create PDF (A4 format)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  let yPos = 20;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: { fontStyle?: string; fontSize?: number; align?: "left" | "center" | "right" } = {}) => {
    doc.setFont("helvetica", options.fontStyle || "normal");
    doc.setFontSize(options.fontSize || 10);
    doc.text(text, x, y, { align: options.align || "left" });
  };

  // === HEADER ===
  addText("СОГЛАСОВАНО:", margin, yPos, { fontStyle: "bold" });
  addText("к Договору № ___ от ________", pageWidth - margin, yPos, { align: "right" });
  
  yPos += 12;
  addText('"____"______________2026 г.', margin, yPos);
  
  yPos += 5;
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, margin + 50, yPos);
  
  yPos += 4;
  doc.line(margin, yPos, margin + 35, yPos);

  // === TITLE ===
  yPos += 15;
  addText("РАСЧЕТ СТОИМОСТИ", pageWidth / 2, yPos, { fontSize: 14, fontStyle: "bold", align: "center" });
  
  yPos += 6;
  addText(`№ ${estimateNumber || "б/н"} от ${formatDate(estimateDate)}`, pageWidth / 2, yPos, { align: "center" });

  // === REQUISITES ===
  yPos += 12;
  addText("Заказчик:", margin, yPos, { fontStyle: "bold" });
  addText(clientName || "—", margin + 28, yPos);
  
  yPos += 5;
  addText("Объект:", margin, yPos, { fontStyle: "bold" });
  addText(objectFull || "—", margin + 28, yPos);
  
  yPos += 5;
  addText("Исполнитель:", margin, yPos, { fontStyle: "bold" });
  addText("ООО «Климатис» (ИП Щеткин А.Г.)", margin + 28, yPos);

  // === 1. РАБОТЫ ===
  yPos += 12;
  addText("1. РАБОТЫ", margin, yPos, { fontStyle: "bold" });
  doc.line(margin, yPos + 1, margin + 22, yPos + 1);

  yPos += 4;

  // Works table data
  const worksData: string[][] = [];
  
  if (workBlocks.length > 0) {
    workBlocks.forEach((block, index) => {
      const blockBase = calculateWorkBlockTotal(block);
      const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
      worksData.push([
        (index + 1).toString(),
        `${block.description || "Работа"} (с учетом накладных, сметной прибыли)`,
        formatCurrency(blockCustomerPrice),
      ]);
    });
  } else {
    worksData.push(["", "Работы не указаны", ""]);
  }

  // Add summary rows
  worksData.push(["", "ИТОГО:", formatCurrency(worksCustomerTotal)]);
  worksData.push(["", `НДС ${vatNote}:`, formatCurrency(worksVat)]);
  worksData.push(["", "ВСЕГО, по статье РАБОТЫ:", formatCurrency(worksWithVat)]);

  const worksTableOptions: UserOptions = {
    startY: yPos,
    head: [["№", "Перечень выполняемых работ", "Стоимость, руб"]],
    body: worksData,
    margin: { left: margin, right: margin },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "normal",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 30, halign: "right" },
    },
    didParseCell: (data) => {
      const rowIndex = data.row.index;
      const isLastRow = rowIndex === worksData.length - 1;
      const isSecondLastRow = rowIndex === worksData.length - 2;
      const isThirdLastRow = rowIndex === worksData.length - 3;
      
      // Yellow highlight for last row
      if (isLastRow) {
        data.cell.styles.fillColor = [255, 255, 0];
        data.cell.styles.fontStyle = "bold";
      }
      // Bold for ИТОГО
      if (isThirdLastRow && data.column.index === 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.halign = "right";
      }
      if (isThirdLastRow && data.column.index === 2) {
        data.cell.styles.halign = "right";
      }
      // НДС row
      if (isSecondLastRow && data.column.index === 1) {
        data.cell.styles.halign = "right";
      }
      // ВСЕГО row
      if (isLastRow && data.column.index === 1) {
        data.cell.styles.halign = "right";
      }
    },
  };

  autoTable(doc, worksTableOptions);
  yPos = (doc as any).lastAutoTable.finalY + 8;

  // === 2. МАТЕРИАЛЫ ===
  addText("2. Материалы", margin, yPos, { fontStyle: "bold" });
  doc.line(margin, yPos + 1, margin + 28, yPos + 1);

  yPos += 4;

  // Materials table data
  const materialsData: string[][] = [];
  
  if (materials.length > 0) {
    materials.forEach((material, index) => {
      const materialPrice = material.quantity * material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
      materialsData.push([
        (index + 1).toString(),
        `${material.materialName} (с учетом транспортных и заготовительно складских расходов)`,
        "шт",
        material.quantity.toString(),
        formatCurrency(materialPrice),
      ]);
    });
  } else {
    materialsData.push(["", "Материалы не указаны", "", "", ""]);
  }

  // Add summary rows for materials
  materialsData.push(["", "ВСЕГО по статье МАТЕРИАЛЫ:", "", "", formatCurrency(materialsCustomerTotal)]);
  materialsData.push(["", `в т.ч. НДС ${vatNote}:`, "", "", formatCurrency(materialsVat)]);

  const materialsTableOptions: UserOptions = {
    startY: yPos,
    head: [["№", "Спецификация используемых материалов", "Ед. изм.", "Кол-во", "Стоимость, руб"]],
    body: materialsData,
    margin: { left: margin, right: margin },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "normal",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
    },
    didParseCell: (data) => {
      const rowIndex = data.row.index;
      const isLastRow = rowIndex === materialsData.length - 1;
      const isSecondLastRow = rowIndex === materialsData.length - 2;
      
      // Yellow highlight for ВСЕГО row
      if (isSecondLastRow) {
        data.cell.styles.fillColor = [255, 255, 0];
        data.cell.styles.fontStyle = "bold";
        if (data.column.index === 1) {
          data.cell.styles.halign = "right";
        }
      }
      // НДС row alignment
      if (isLastRow && data.column.index === 1) {
        data.cell.styles.halign = "right";
      }
    },
  };

  autoTable(doc, materialsTableOptions);
  yPos = (doc as any).lastAutoTable.finalY + 8;

  // === FINAL TOTALS (no table borders) ===
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 5;
  addText(`ИТОГО, по расчету без НДС (здесь суммы по форму|ле, без НДС):`, margin, yPos, { fontStyle: "bold", fontSize: 9 });
  addText(formatCurrency(grandTotalWithoutVat), pageWidth - margin, yPos, { align: "right", fontSize: 9 });
  
  yPos += 5;
  addText(`НДС ${vatNote}:`, margin, yPos, { fontStyle: "bold", fontSize: 9 });
  addText(formatCurrency(grandTotalVat), pageWidth - margin, yPos, { align: "right", fontSize: 9 });
  
  yPos += 6;
  // Yellow background for final total
  const contentWidth = pageWidth - margin * 2;
  doc.setFillColor(255, 255, 0);
  doc.rect(margin, yPos - 4, contentWidth, 8, "F");
  addText("ВСЕГО по расчету:", margin + 2, yPos, { fontStyle: "bold", fontSize: 11 });
  addText(formatCurrency(grandTotalWithVat), pageWidth - margin - 2, yPos, { align: "right", fontStyle: "bold", fontSize: 11 });

  // === SIGNATURE ===
  yPos += 25;
  addText("Расчет составил", margin + 30, yPos, { align: "center" });
  addText(engineerName || "________________", pageWidth - margin - 30, yPos, { align: "center" });

  // Save PDF
  doc.save(`Расчет_${estimateNumber || "б-н"}_${formatDate(estimateDate).replace(/\./g, "-")}.pdf`);
}
