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
  const grandTotalWithoutVat = worksCustomerTotal + materialsCustomerTotal;
  const grandTotalVat = worksVat + materialsVat;
  const grandTotalWithVat = grandTotalWithoutVat + worksVat;

  const vatNote = `(0 либо 22%, как указано в расчете)`;
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
  const valueX = 55; // Positioned closer to center like in example
  
  addText("Заказчик:", labelX, yPos, { fontStyle: "bold", fontSize: 10 });
  addText(clientName || "—", valueX, yPos, { fontSize: 10 });
  
  yPos += 5;
  addText("Объект:", labelX, yPos, { fontStyle: "bold", fontSize: 10 });
  addText(objectFull || "—", valueX, yPos, { fontSize: 10 });
  
  yPos += 5;
  addText("Исполнитель:", labelX, yPos, { fontStyle: "bold", fontSize: 10 });
  addText('ООО "Климатис" (ИП Щеткин А.Г.)', valueX, yPos, { fontSize: 10 });

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
        `${block.description || "Работа"} (с учетом накладных, сметной прибыли)`,
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
    { content: `НДС ${vatNote}:`, styles: { halign: "right" } },
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
      const materialPrice = material.quantity * material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
      materialsBodyData.push([
        (index + 1).toString(),
        `${material.materialName} (с учетом транспортных и заготовительно складских расходов)`,
        "шт",
        material.quantity.toString(),
        formatCurrency(materialPrice),
      ]);
    });
  } else {
    materialsBodyData.push(["", "Материалы не указаны", "", "", ""]);
  }

  // Summary rows for materials
  materialsBodyData.push([
    "",
    { content: "ВСЕГО по статье МАТЕРИАЛЫ:", styles: { halign: "right", fontStyle: "bold" } },
    "",
    "",
    { content: formatCurrency(materialsCustomerTotal), styles: { fontStyle: "bold" } },
  ]);
  materialsBodyData.push([
    "",
    { content: `в т.ч. НДС ${vatNote}:`, styles: { halign: "right" } },
    "",
    "",
    formatCurrency(materialsVat),
  ]);

  const materialsTableOptions: UserOptions = {
    startY: yPos,
    head: [["№", "Спецификация используемых материалов", "Ед. изм.", "Кол-во", "Стоимость, руб"]],
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
      4: { cellWidth: 28, halign: "right" },
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
  
  // First line: ИТОГО - description left, value right-aligned with table
  const itogo1 = "ИТОГО, по расчету без НДС ";
  const itogo2 = "(здесь суммы по формуле, без НДС):";
  doc.setFont("NotoSerif", "bold");
  doc.setFontSize(9);
  doc.text(itogo1, marginLeft, yPos);
  const itogo1Width = doc.getTextWidth(itogo1);
  doc.setFont("NotoSerif", "italic");
  doc.text(itogo2, marginLeft + itogo1Width, yPos);
  doc.setFont("NotoSerif", "bold");
  doc.text(formatCurrency(grandTotalWithoutVat), totalsValueX, yPos, { align: "right" });
  
  yPos += 5;
  // Second line: НДС - description left, value right-aligned with table
  const nds1 = "НДС ";
  const nds2 = "(0 либо 22%, как указано в расчете):";
  doc.setFont("NotoSerif", "bold");
  doc.setFontSize(9);
  doc.text(nds1, marginLeft, yPos);
  const nds1Width = doc.getTextWidth(nds1);
  doc.setFont("NotoSerif", "italic");
  doc.text(nds2, marginLeft + nds1Width, yPos);
  doc.setFont("NotoSerif", "bold");
  doc.text(formatCurrency(grandTotalVat), totalsValueX, yPos, { align: "right" });
  
  yPos += 6;
  // Final total line with underline
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos + 1, pageWidth - marginRight, yPos + 1);
  doc.setFont("NotoSerif", "bold");
  doc.setFontSize(10);
  doc.text("ВСЕГО по расчету:", marginLeft, yPos);
  doc.text(formatCurrency(grandTotalWithVat), totalsValueX, yPos, { align: "right" });

  // === SIGNATURE ===
  yPos += 25;
  addText("Расчет составил", marginLeft + 35, yPos, { fontSize: 10 });
  addText(engineerName || "________________", pageWidth - marginRight - 40, yPos, { fontSize: 10 });

  // Save PDF
  const fileName = `Расчет_${estimateNumber || "б-н"}_${formatDate(estimateDate).replace(/\./g, "-").replace("г", "")}.pdf`;
  doc.save(fileName);
}
