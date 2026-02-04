import React, { forwardRef } from "react";
import {
  Estimate,
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

// Format number with 2 decimal places and space as thousands separator
const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ").replace(".", ",");
};

// Format date as DD.MM.YYYY
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "__.__.____";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
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
      engineerPosition,
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
    const totalVat = worksVat + materialsVat;

    // Grand totals
    const worksWithVat = worksCustomerTotal + worksVat;
    const grandTotalWithoutVat = worksCustomerTotal + materialsCustomerTotal;
    const grandTotalWithVat = grandTotalWithoutVat + worksVat; // Only works VAT is added, materials VAT is already included

    const vatRateLabel = customerCalc.vatRate === 22 ? "22%" : "0%";

    return (
      <div
        ref={ref}
        style={{
          width: "794px", // A4 width at 96 DPI
          padding: "40px 50px 40px 60px", // margins: top, right, bottom, left (left larger for binding)
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "11pt",
          lineHeight: "1.4",
          color: "#000",
          backgroundColor: "#fff",
        }}
      >
        {/* Document Header */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <tbody>
            <tr>
              <td style={{ width: "40%", verticalAlign: "top" }}>
                <div style={{ fontWeight: "bold", marginBottom: "8px" }}>СОГЛАСОВАНО:</div>
                <div style={{ borderBottom: "1px solid #000", width: "180px", height: "30px", marginBottom: "4px" }}></div>
                <div style={{ fontSize: "10pt" }}>"___" _____________ 2026 г.</div>
              </td>
              <td style={{ width: "60%", textAlign: "right", verticalAlign: "top" }}>
                <div style={{ fontSize: "10pt" }}>к Договору № _______ от __________</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "16pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px" }}>
            РАСЧЕТ СТОИМОСТИ
          </div>
          <div style={{ fontSize: "12pt", marginTop: "8px" }}>
            № {estimateNumber || "б/н"} от {formatDate(estimateDate)} г.
          </div>
        </div>

        {/* Requisites */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
          <tbody>
            <tr>
              <td style={{ width: "100px", fontWeight: "bold", padding: "4px 0", verticalAlign: "top" }}>Заказчик:</td>
              <td style={{ padding: "4px 0 4px 8px", verticalAlign: "top" }}>{clientName || "—"}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "4px 0", verticalAlign: "top" }}>Объект:</td>
              <td style={{ padding: "4px 0 4px 8px", verticalAlign: "top" }}>
                {objectName || "—"}{objectAddress ? `, ${objectAddress}` : ""}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "4px 0", verticalAlign: "top" }}>Исполнитель:</td>
              <td style={{ padding: "4px 0 4px 8px", verticalAlign: "top" }}>ООО «Климатис»</td>
            </tr>
          </tbody>
        </table>

        {/* Section 1: РАБОТЫ */}
        <div style={{ 
          fontSize: "12pt", 
          fontWeight: "bold", 
          marginBottom: "10px",
          paddingBottom: "4px",
          borderBottom: "2px solid #000"
        }}>
          1. РАБОТЫ
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ width: "40px", padding: "8px 4px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>№</th>
              <th style={{ padding: "8px 4px", textAlign: "left", border: "1px solid #000", fontWeight: "bold" }}>Перечень выполняемых работ</th>
              <th style={{ width: "130px", padding: "8px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold" }}>Стоимость, руб.</th>
            </tr>
          </thead>
          <tbody>
            {workBlocks.map((block, index) => {
              const blockBase = calculateWorkBlockTotal(block);
              const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
              return (
                <tr key={block.id}>
                  <td style={{ padding: "6px 4px", textAlign: "center", border: "1px solid #000", verticalAlign: "top" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "6px 4px", border: "1px solid #000", verticalAlign: "top" }}>
                    {block.description || "Работа без названия"}
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "right", border: "1px solid #000", verticalAlign: "top" }}>
                    {formatCurrency(blockCustomerPrice)}
                  </td>
                </tr>
              );
            })}
            {workBlocks.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "10px", textAlign: "center", border: "1px solid #000", fontStyle: "italic", color: "#666" }}>
                  Работы не указаны
                </td>
              </tr>
            )}
            {/* ИТОГО */}
            <tr>
              <td colSpan={2} style={{ padding: "8px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold" }}>
                ИТОГО:
              </td>
              <td style={{ padding: "8px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold" }}>
                {formatCurrency(worksCustomerTotal)}
              </td>
            </tr>
            {/* НДС */}
            <tr>
              <td colSpan={2} style={{ padding: "8px 4px", textAlign: "right", border: "1px solid #000" }}>
                НДС ({vatRateLabel}):
              </td>
              <td style={{ padding: "8px 4px", textAlign: "right", border: "1px solid #000" }}>
                {formatCurrency(worksVat)}
              </td>
            </tr>
            {/* ВСЕГО по работам */}
            <tr style={{ backgroundColor: "#FFFF99" }}>
              <td colSpan={2} style={{ padding: "10px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold", fontSize: "11pt" }}>
                ВСЕГО, по статье РАБОТЫ:
              </td>
              <td style={{ padding: "10px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold", fontSize: "11pt" }}>
                {formatCurrency(worksWithVat)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 2: МАТЕРИАЛЫ */}
        <div style={{ 
          fontSize: "12pt", 
          fontWeight: "bold", 
          marginTop: "24px",
          marginBottom: "10px",
          paddingBottom: "4px",
          borderBottom: "2px solid #000"
        }}>
          2. МАТЕРИАЛЫ
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ width: "40px", padding: "8px 4px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>№</th>
              <th style={{ padding: "8px 4px", textAlign: "left", border: "1px solid #000", fontWeight: "bold" }}>Спецификация используемых материалов</th>
              <th style={{ width: "60px", padding: "8px 4px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>Ед. изм.</th>
              <th style={{ width: "60px", padding: "8px 4px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>Кол-во</th>
              <th style={{ width: "110px", padding: "8px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold" }}>Стоимость, руб.</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, index) => {
              const materialPrice = material.quantity * material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
              return (
                <tr key={material.id}>
                  <td style={{ padding: "6px 4px", textAlign: "center", border: "1px solid #000", verticalAlign: "top" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "6px 4px", border: "1px solid #000", verticalAlign: "top" }}>
                    {material.materialName}
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "center", border: "1px solid #000", verticalAlign: "top" }}>
                    шт.
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "center", border: "1px solid #000", verticalAlign: "top" }}>
                    {material.quantity}
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "right", border: "1px solid #000", verticalAlign: "top" }}>
                    {formatCurrency(materialPrice)}
                  </td>
                </tr>
              );
            })}
            {materials.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "10px", textAlign: "center", border: "1px solid #000", fontStyle: "italic", color: "#666" }}>
                  Материалы не указаны
                </td>
              </tr>
            )}
            {/* ВСЕГО по материалам */}
            <tr style={{ backgroundColor: "#FFFF99" }}>
              <td colSpan={4} style={{ padding: "10px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold", fontSize: "11pt" }}>
                ВСЕГО по статье МАТЕРИАЛЫ:
              </td>
              <td style={{ padding: "10px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold", fontSize: "11pt" }}>
                {formatCurrency(materialsCustomerTotal)}
              </td>
            </tr>
            {/* в т.ч. НДС */}
            <tr>
              <td colSpan={4} style={{ padding: "8px 4px", textAlign: "right", border: "1px solid #000", fontSize: "10pt" }}>
                в т.ч. НДС ({vatRateLabel}):
              </td>
              <td style={{ padding: "8px 4px", textAlign: "right", border: "1px solid #000", fontSize: "10pt" }}>
                {formatCurrency(materialsVat)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Final Totals */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "24px", border: "2px solid #000" }}>
          <tbody>
            {/* ИТОГО без НДС */}
            <tr>
              <td style={{ padding: "10px", fontWeight: "bold", border: "1px solid #000" }}>
                ИТОГО, по расчету без НДС:
              </td>
              <td style={{ width: "150px", padding: "10px", textAlign: "right", fontWeight: "bold", border: "1px solid #000" }}>
                {formatCurrency(grandTotalWithoutVat)}
              </td>
            </tr>
            {/* НДС */}
            <tr>
              <td style={{ padding: "10px", border: "1px solid #000" }}>
                НДС ({vatRateLabel}):
              </td>
              <td style={{ padding: "10px", textAlign: "right", border: "1px solid #000" }}>
                {formatCurrency(totalVat)}
              </td>
            </tr>
            {/* ВСЕГО по расчету */}
            <tr style={{ backgroundColor: "#FFFF99" }}>
              <td style={{ padding: "12px 10px", fontWeight: "bold", fontSize: "12pt", border: "1px solid #000", textTransform: "uppercase" }}>
                ВСЕГО по расчету:
              </td>
              <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", fontSize: "14pt", border: "1px solid #000" }}>
                {formatCurrency(grandTotalWithVat)} руб.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signature */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "50px" }}>
          <tbody>
            <tr>
              <td style={{ width: "40%", padding: "4px 0", verticalAlign: "bottom" }}>
                Расчет составил:
              </td>
              <td style={{ width: "25%", padding: "4px 0", textAlign: "center", verticalAlign: "bottom", borderBottom: "1px solid #000" }}>
                &nbsp;
              </td>
              <td style={{ width: "35%", padding: "4px 0", textAlign: "right", verticalAlign: "bottom" }}>
                {engineerName || "________________"}
              </td>
            </tr>
            <tr>
              <td style={{ fontSize: "8pt", color: "#666", paddingTop: "2px" }}>
                {engineerPosition || ""}
              </td>
              <td style={{ fontSize: "8pt", color: "#666", paddingTop: "2px", textAlign: "center" }}>
                (подпись)
              </td>
              <td style={{ fontSize: "8pt", color: "#666", paddingTop: "2px", textAlign: "right" }}>
                (ФИО)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

CustomerEstimatePDF.displayName = "CustomerEstimatePDF";
