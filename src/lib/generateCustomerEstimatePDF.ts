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

// Import fonts (Noto Serif - similar to Times New Roman with Cyrillic support)
import NotoSerifRegular from "@/assets/fonts/NotoSerif-Regular.ttf";
import NotoSerifBold from "@/assets/fonts/NotoSerif-Bold.ttf";
import NotoSerifItalic from "@/assets/fonts/NotoSerif-Italic.ttf";

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
  executorCompany?: string;
  estimateName?: string;
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

// Convert ArrayBuffer to base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Load font file and convert to base64
const loadFontAsBase64 = async (fontUrl: string): Promise<string> => {
  const response = await fetch(fontUrl);
  const arrayBuffer = await response.arrayBuffer();
  return arrayBufferToBase64(arrayBuffer);
};

export async function generateCustomerEstimatePDF(params: GeneratePDFParams): Promise<void> {
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
    executorCompany = 'ООО "Климатис"',
    estimateName,
  } = params;

  // Load fonts
  const [serifRegularBase64, serifBoldBase64, serifItalicBase64] = await Promise.all([
    loadFontAsBase64(NotoSerifRegular),
    loadFontAsBase64(NotoSerifBold),
    loadFontAsBase64(NotoSerifItalic),
  ]);

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
  const materialsWithoutVat = materialsCustomerTotal - materialsVat;
  const subtotalWithoutVat = worksCustomerTotal + materialsWithoutVat;
  // Дополнительные расходы (процент от подытога без НДС)
  const otherAmount = customerCalc.otherPercent
    ? subtotalWithoutVat * (customerCalc.otherPercent / 100)
    : 0;
  const grandTotalWithoutVat = subtotalWithoutVat + otherAmount;
  const grandTotalVat = worksVat + materialsVat;
  const grandTotalWithVat = grandTotalWithoutVat + grandTotalVat;

  const vatRateLabel = customerCalc.vatRate === 22 ? "22%" : "";
  const objectFull = objectAddress ? `${objectName}, ${objectAddress}` : objectName;

  // Create PDF (A4 format)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add Noto Serif fonts with Cyrillic support (Times New Roman alternative)
  doc.addFileToVFS("NotoSerif-Regular.ttf", serifRegularBase64);
  doc.addFont("NotoSerif-Regular.ttf", "NotoSerif", "normal");
  
  doc.addFileToVFS("NotoSerif-Bold.ttf", serifBoldBase64);
  doc.addFont("NotoSerif-Bold.ttf", "NotoSerif", "bold");
  
  doc.addFileToVFS("NotoSerif-Italic.ttf", serifItalicBase64);
  doc.addFont("NotoSerif-Italic.ttf", "NotoSerif", "italic");

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 15;
  
  let yPos = 18;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: { fontStyle?: "normal" | "bold" | "italic"; fontSize?: number; align?: "left" | "center" | "right" } = {}) => {
    doc.setFont("NotoSerif", options.fontStyle || "normal");
    doc.setFontSize(options.fontSize || 10);
    doc.text(text, x, y, { align: options.align || "left" });
  };

  // === HEADER ===
  addText("СОГЛАСОВАНО:", marginLeft, yPos, { fontStyle: "bold", fontSize: 10 });
  addText("к Договору № ___ от ________", pageWidth - marginRight, yPos, { align: "right", fontSize: 10 });
  
  yPos += 8;
  addText('"____"______________2026 г.', marginLeft, yPos, { fontSize: 10 });
  
  yPos += 8;
  doc.setLineWidth(0.3);
  // Two signature lines on the same row: longer (signature) + shorter (initials)
  const signLineStart = marginLeft;
  const signLineLength = 35;
  const initialsLineLength = 25;
  const gapBetweenLines = 5;
  doc.line(signLineStart, yPos, signLineStart + signLineLength, yPos);
  doc.line(signLineStart + signLineLength + gapBetweenLines, yPos, signLineStart + signLineLength + gapBetweenLines + initialsLineLength, yPos);

  // === TITLE ===
  yPos += 12;
  addText("РАСЧЕТ СТОИМОСТИ", pageWidth / 2, yPos, { fontSize: 12, fontStyle: "bold", align: "center" });
  
  yPos += 5;
  addText(`№ ${estimateNumber || "б/н"} от ${formatDate(estimateDate)}`, pageWidth / 2, yPos, { fontSize: 10, align: "center" });

  // === REQUISITES ===
  yPos += 10;
  const labelX = marginLeft;
  const valueX = 55;
  const maxValueWidth = pageWidth - marginRight - valueX;

  // Helper to add wrapped text and return new yPos
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, options: { fontStyle?: "normal" | "bold" | "italic"; fontSize?: number } = {}): number => {
    doc.setFont("NotoSerif", options.fontStyle || "normal");
    doc.setFontSize(options.fontSize || 10);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    const lineHeight = (options.fontSize || 10) * 0.4;
    return y + lines.length * lineHeight;
  };
  
  addText("Заказчик:", labelX, yPos, { fontStyle: "bold", fontSize: 10 });
  yPos = addWrappedText(clientName || "—", valueX, yPos, maxValueWidth, { fontSize: 10 });
  
  yPos += 2;
  addText("Объект:", labelX, yPos, { fontStyle: "bold", fontSize: 10 });
  yPos = addWrappedText(objectFull || "—", valueX, yPos, maxValueWidth, { fontSize: 10 });
  
  yPos += 2;
  addText("Исполнитель:", labelX, yPos, { fontStyle: "bold", fontSize: 10 });
  yPos = addWrappedText(executorCompany, valueX, yPos, maxValueWidth, { fontSize: 10 });
  
  if (estimateName) {
    yPos += 2;
    yPos = addWrappedText(estimateName, valueX, yPos, maxValueWidth, { fontSize: 10 });
  }

  // === 1. РАБОТЫ ===
  yPos += 10;
  addText("1. РАБОТЫ", marginLeft, yPos, { fontStyle: "bold", fontSize: 10 });

  yPos += 3;

  // Works table data
  const worksBodyData: (string | { content: string; styles?: any })[][] = [];
  
  if (workBlocks.length > 0) {
    workBlocks.forEach((block, index) => {
      const blockBase = calculateWorkBlockTotal(block);
      const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
      worksBodyData.push([
        (index + 1).toString(),
        `${block.description || "Работа"}`,
        formatCurrency(blockCustomerPrice),
      ]);
    });
  } else {
    worksBodyData.push(["", "Работы не указаны", ""]);
  }

  // Summary rows
  worksBodyData.push([
    "",
    { content: "ИТОГО:", styles: { halign: "right", fontStyle: "bold" } },
    formatCurrency(worksCustomerTotal),
  ]);
  worksBodyData.push([
    "",
    { content: vatRateLabel ? `НДС ${vatRateLabel}:` : "НДС:", styles: { halign: "right" } },
    formatCurrency(worksVat),
  ]);
  worksBodyData.push([
    "",
    { content: "ВСЕГО, по статье РАБОТЫ:", styles: { halign: "right", fontStyle: "bold" } },
    { content: formatCurrency(worksWithVat), styles: { fontStyle: "bold" } },
  ]);

  const worksTableOptions: UserOptions = {
    startY: yPos,
    head: [["№", "Перечень выполняемых работ", "Стоимость, руб"]],
    body: worksBodyData,
    margin: { left: marginLeft, right: marginRight },
    tableWidth: "auto",
    styles: {
      font: "NotoSerif",
      fontSize: 9,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      valign: "middle",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "normal",
      halign: "center",
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 28, halign: "right" },
    },
  };

  autoTable(doc, worksTableOptions);
  yPos = (doc as any).lastAutoTable.finalY + 6;

  // === 2. Материалы ===
  addText("2. Материалы", marginLeft, yPos, { fontStyle: "bold", fontSize: 10 });

  yPos += 3;

  // Materials table data
  const materialsBodyData: (string | { content: string; styles?: any })[][] = [];
  
  if (materials.length > 0) {
    materials.forEach((material, index) => {
      const unitPriceWithMarkup = material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
      const materialPrice = material.quantity * unitPriceWithMarkup;
      materialsBodyData.push([
        (index + 1).toString(),
        material.materialName,
        "шт",
        material.quantity.toString(),
        formatCurrency(unitPriceWithMarkup),
        formatCurrency(materialPrice),
      ]);
    });
  } else {
    materialsBodyData.push(["", "Материалы не указаны", "", "", "", ""]);
  }

  // Summary rows for materials
  materialsBodyData.push([
    "",
    { content: "ВСЕГО по статье МАТЕРИАЛЫ:", styles: { halign: "right", fontStyle: "bold" } },
    "",
    "",
    "",
    { content: formatCurrency(materialsCustomerTotal), styles: { fontStyle: "bold" } },
  ]);
  materialsBodyData.push([
    "",
    { content: vatRateLabel ? `в т.ч. НДС ${vatRateLabel}:` : "в т.ч. НДС:", styles: { halign: "right" } },
    "",
    "",
    "",
    formatCurrency(materialsVat),
  ]);

  const materialsTableOptions: UserOptions = {
    startY: yPos,
    head: [["№", "Спецификация используемых материалов", "Ед. изм.", "Кол-во", "Цена за ед.", "Стоимость, руб"]],
    body: materialsBodyData,
    margin: { left: marginLeft, right: marginRight },
    tableWidth: "auto",
    styles: {
      font: "NotoSerif",
      fontSize: 9,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      valign: "middle",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "normal",
      halign: "center",
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 24, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
  };

  autoTable(doc, materialsTableOptions);
  yPos = (doc as any).lastAutoTable.finalY + 5;

  // === FINAL TOTALS (no table borders, right-aligned) ===
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  
  yPos += 5;
  // Align values with table's last column (accounting for cell padding)
  const totalsValueX = pageWidth - marginRight - 1.5;
  // Align labels to end roughly under "Цена за ед." column (before last 28mm column)
  const totalsLabelX = pageWidth - marginRight - 28 - 1.5;
  
  // Optional: дополнительные расходы строкой
  if (otherAmount > 0) {
    doc.setFont("NotoSerif", "normal");
    doc.setFontSize(9);
    const otherLabel = `${customerCalc.otherName || "Дополнительные расходы"} (${customerCalc.otherPercent}%):`;
    doc.text(otherLabel, totalsLabelX, yPos, { align: "right" });
    doc.text(formatCurrency(otherAmount), totalsValueX, yPos, { align: "right" });
    yPos += 5;
  }

  // First line: ИТОГО
  doc.setFont("NotoSerif", "bold");
  doc.setFontSize(9);
  doc.text("ИТОГО, по расчету без НДС:", totalsLabelX, yPos, { align: "right" });
  doc.text(formatCurrency(grandTotalWithoutVat), totalsValueX, yPos, { align: "right" });
  
  yPos += 5;
  // Second line: НДС
  doc.setFont("NotoSerif", "bold");
  doc.setFontSize(9);
  doc.text(vatRateLabel ? `НДС ${vatRateLabel}:` : "НДС:", totalsLabelX, yPos, { align: "right" });
  doc.text(formatCurrency(grandTotalVat), totalsValueX, yPos, { align: "right" });
  
  yPos += 6;
  // Final total line with underline
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos + 1, pageWidth - marginRight, yPos + 1);
  doc.setFont("NotoSerif", "bold");
  doc.setFontSize(10);
  doc.text("ВСЕГО по расчету:", totalsLabelX, yPos, { align: "right" });
  doc.text(formatCurrency(grandTotalWithVat), totalsValueX, yPos, { align: "right" });

  // === SIGNATURE ===
  yPos += 25;
  addText("Расчет составил", marginLeft + 35, yPos, { fontSize: 10 });
  addText(engineerName || "________________", pageWidth - marginRight - 40, yPos, { fontSize: 10 });

  // Save PDF
  const fileName = `Расчет_${estimateNumber || "б-н"}_${formatDate(estimateDate).replace(/\./g, "-").replace("г", "")}.pdf`;
  doc.save(fileName);
}
