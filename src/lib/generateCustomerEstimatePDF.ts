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

// Import fonts
import RobotoRegular from "@/assets/fonts/Roboto-Regular.ttf";
import RobotoBold from "@/assets/fonts/Roboto-Bold.ttf";

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
  const [robotoRegularBase64, robotoBoldBase64] = await Promise.all([
    loadFontAsBase64(RobotoRegular),
    loadFontAsBase64(RobotoBold),
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

  // Add Roboto fonts with Cyrillic support
  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 15;
  
  let yPos = 18;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: { fontStyle?: "normal" | "bold"; fontSize?: number; align?: "left" | "center" | "right" } = {}) => {
    doc.setFont("Roboto", options.fontStyle || "normal");
    doc.setFontSize(options.fontSize || 10);
    doc.text(text, x, y, { align: options.align || "left" });
  };

  // === HEADER ===
  addText("СОГЛАСОВАНО:", marginLeft, yPos, { fontStyle: "bold", fontSize: 10 });
  addText("к Договору № ___ от ________", pageWidth - marginRight, yPos, { align: "right", fontSize: 10 });
  
  yPos += 8;
  addText('"____"______________2026 г.', marginLeft, yPos, { fontSize: 10 });
  
  yPos += 4;
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos, marginLeft + 40, yPos);
  
  yPos += 3;
  doc.line(marginLeft, yPos, marginLeft + 28, yPos);

  // === TITLE ===
  yPos += 12;
  addText("РАСЧЕТ СТОИМОСТИ", pageWidth / 2, yPos, { fontSize: 12, fontStyle: "bold", align: "center" });
  
  yPos += 5;
  addText(`№ ${estimateNumber || "б/н"} от ${formatDate(estimateDate)}`, pageWidth / 2, yPos, { fontSize: 10, align: "center" });

  // === REQUISITES ===
  yPos += 10;
  const labelX = marginLeft;
  const valueX = marginLeft + 25;
  
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
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos + 0.5, marginLeft + 18, yPos + 0.5);

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
    { content: "ВСЕГО, по статье РАБОТЫ:", styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 0] } },
    { content: formatCurrency(worksWithVat), styles: { fillColor: [255, 255, 0], fontStyle: "bold" } },
  ]);

  const worksTableOptions: UserOptions = {
    startY: yPos,
    head: [["№", "Перечень выполняемых работ", "Стоимость, руб"]],
    body: worksBodyData,
    margin: { left: marginLeft, right: marginRight },
    tableWidth: "auto",
    styles: {
      font: "Roboto",
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
  doc.line(marginLeft, yPos + 0.5, marginLeft + 22, yPos + 0.5);

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
    { content: "ВСЕГО по статье МАТЕРИАЛЫ:", styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 0] } },
    { content: "", styles: { fillColor: [255, 255, 0] } },
    { content: "", styles: { fillColor: [255, 255, 0] } },
    { content: formatCurrency(materialsCustomerTotal), styles: { fillColor: [255, 255, 0], fontStyle: "bold" } },
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
      font: "Roboto",
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
  const totalsValueX = pageWidth - marginRight;
  const valueWidth = 30; // Width reserved for value
  const labelEndX = totalsValueX - valueWidth;
  
  addText(`ИТОГО, по расчету без НДС (здесь суммы по форму|ле, без НДС):`, labelEndX, yPos, { fontStyle: "bold", fontSize: 9, align: "right" });
  addText(formatCurrency(grandTotalWithoutVat), totalsValueX, yPos, { align: "right", fontSize: 9 });
  
  yPos += 4;
  addText(`НДС ${vatNote}:`, labelEndX, yPos, { fontSize: 9, align: "right" });
  addText(formatCurrency(grandTotalVat), totalsValueX, yPos, { align: "right", fontSize: 9 });
  
  yPos += 5;
  // Yellow background for final total
  const contentWidth = pageWidth - marginLeft - marginRight;
  doc.setFillColor(255, 255, 0);
  doc.rect(marginLeft, yPos - 3.5, contentWidth, 6, "F");
  addText("ВСЕГО по расчету:", marginLeft + 1, yPos, { fontStyle: "bold", fontSize: 10 });
  addText(formatCurrency(grandTotalWithVat), totalsValueX - 1, yPos, { align: "right", fontStyle: "bold", fontSize: 10 });

  // === SIGNATURE ===
  yPos += 25;
  addText("Расчет составил", marginLeft + 35, yPos, { fontSize: 10 });
  addText(engineerName || "________________", pageWidth - marginRight - 40, yPos, { fontSize: 10 });

  // Save PDF
  const fileName = `Расчет_${estimateNumber || "б-н"}_${formatDate(estimateDate).replace(/\./g, "-").replace("г", "")}.pdf`;
  doc.save(fileName);
}
