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

    // Grand totals
    const worksWithVat = worksCustomerTotal + worksVat;
    const grandTotalWithoutVat = worksCustomerTotal + materialsCustomerTotal;
    const grandTotalWithVat = grandTotalWithoutVat + worksVat;

    const vatRateLabel = customerCalc.vatRate === 22 ? "22%" : "0%";
    const vatNoteText = customerCalc.vatRate === 22 ? `(0 либо 22%, как указано в расчете)` : `(0 либо 22%, как указано в расчете)`;

    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          padding: "30px 40px 30px 50px",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "10pt",
          lineHeight: "1.3",
          color: "#000",
          backgroundColor: "#fff",
        }}
      >
        {/* Document Header */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", verticalAlign: "top", fontSize: "10pt" }}>
                <div style={{ fontWeight: "bold" }}>СОГЛАСОВАНО:</div>
                <div style={{ marginTop: "8px" }}>"___"_____________2026 г.</div>
                <div style={{ borderBottom: "1px solid #000", width: "120px", marginTop: "15px" }}></div>
              </td>
              <td style={{ width: "50%", textAlign: "right", verticalAlign: "top", fontSize: "10pt" }}>
                к Договору № ___ от ________
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <div style={{ textAlign: "center", marginTop: "20px", marginBottom: "15px" }}>
          <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
            РАСЧЕТ СТОИМОСТИ
          </div>
          <div style={{ fontSize: "10pt", marginTop: "4px" }}>
            № {estimateNumber || "б/н"} от {formatDate(estimateDate)}г.
          </div>
        </div>

        {/* Requisites */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px", fontSize: "10pt" }}>
          <tbody>
            <tr>
              <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Заказчик:</td>
              <td style={{ padding: "2px 0 2px 8px", verticalAlign: "top" }}>{clientName || "—"}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Объект:</td>
              <td style={{ padding: "2px 0 2px 8px", verticalAlign: "top" }}>
                {objectName || "—"}{objectAddress ? `, ${objectAddress}` : ""}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Исполнитель:</td>
              <td style={{ padding: "2px 0 2px 8px", verticalAlign: "top" }}>ООО «Климатис» (ИП Щеткин А.Г.)</td>
            </tr>
          </tbody>
        </table>

        {/* Section 1: РАБОТЫ */}
        <div style={{ fontSize: "10pt", fontWeight: "bold", marginBottom: "4px", textDecoration: "underline" }}>
          1. РАБОТЫ
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "9pt" }}>
          <thead>
            <tr>
              <th style={{ width: "25px", padding: "4px 2px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>№</th>
              <th style={{ padding: "4px 4px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>Перечень выполняемых работ</th>
              <th style={{ width: "100px", padding: "4px 2px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>Стоимость, руб</th>
            </tr>
          </thead>
          <tbody>
            {workBlocks.map((block, index) => {
              const blockBase = calculateWorkBlockTotal(block);
              const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
              return (
                <tr key={block.id}>
                  <td style={{ padding: "3px 2px", textAlign: "center", border: "1px solid #000", verticalAlign: "top" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "3px 4px", border: "1px solid #000", verticalAlign: "top", textAlign: "left" }}>
                    {block.description || "Работа без названия"}{" "}
                    <span style={{ fontSize: "8pt", fontStyle: "italic" }}>(с учетом накладных, сметной прибыли)</span>
                  </td>
                  <td style={{ padding: "3px 4px", textAlign: "right", border: "1px solid #000", verticalAlign: "top" }}>
                    {formatCurrency(blockCustomerPrice)}
                  </td>
                </tr>
              );
            })}
            {workBlocks.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "6px", textAlign: "center", border: "1px solid #000", fontStyle: "italic", color: "#666" }}>
                  Работы не указаны
                </td>
              </tr>
            )}
            {/* ИТОГО */}
            <tr>
              <td colSpan={2} style={{ padding: "3px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold" }}>
                ИТОГО:
              </td>
              <td style={{ padding: "3px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold" }}>
                {formatCurrency(worksCustomerTotal)}
              </td>
            </tr>
            {/* НДС */}
            <tr>
              <td colSpan={2} style={{ padding: "3px 4px", textAlign: "right", border: "1px solid #000", fontSize: "8pt" }}>
                НДС {vatNoteText}:
              </td>
              <td style={{ padding: "3px 4px", textAlign: "right", border: "1px solid #000" }}>
                {formatCurrency(worksVat)}
              </td>
            </tr>
            {/* ВСЕГО по работам */}
            <tr>
              <td colSpan={2} style={{ padding: "4px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold", backgroundColor: "#FFFF00" }}>
                ВСЕГО, по статье РАБОТЫ:
              </td>
              <td style={{ padding: "4px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold", backgroundColor: "#FFFF00" }}>
                {formatCurrency(worksWithVat)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 2: МАТЕРИАЛЫ */}
        <div style={{ fontSize: "10pt", fontWeight: "bold", marginTop: "12px", marginBottom: "4px", textDecoration: "underline" }}>
          2. Материалы
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "9pt" }}>
          <thead>
            <tr>
              <th style={{ width: "25px", padding: "4px 2px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>№</th>
              <th style={{ padding: "4px 4px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>Спецификация используемых материалов</th>
              <th style={{ width: "50px", padding: "4px 2px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>Ед. изм.</th>
              <th style={{ width: "45px", padding: "4px 2px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>Кол-во</th>
              <th style={{ width: "100px", padding: "4px 2px", textAlign: "center", border: "1px solid #000", fontWeight: "bold" }}>Стоимость, руб</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, index) => {
              const materialPrice = material.quantity * material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
              return (
                <tr key={material.id}>
                  <td style={{ padding: "3px 2px", textAlign: "center", border: "1px solid #000", verticalAlign: "top" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "3px 4px", border: "1px solid #000", verticalAlign: "top", textAlign: "left" }}>
                    {material.materialName}{" "}
                    <span style={{ fontSize: "8pt", fontStyle: "italic" }}>(с учетом транспортных и заготовительно складских расходов)</span>
                  </td>
                  <td style={{ padding: "3px 2px", textAlign: "center", border: "1px solid #000", verticalAlign: "top" }}>
                    шт
                  </td>
                  <td style={{ padding: "3px 2px", textAlign: "center", border: "1px solid #000", verticalAlign: "top" }}>
                    {material.quantity}
                  </td>
                  <td style={{ padding: "3px 4px", textAlign: "right", border: "1px solid #000", verticalAlign: "top" }}>
                    {formatCurrency(materialPrice)}
                  </td>
                </tr>
              );
            })}
            {materials.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "6px", textAlign: "center", border: "1px solid #000", fontStyle: "italic", color: "#666" }}>
                  Материалы не указаны
                </td>
              </tr>
            )}
            {/* ВСЕГО по материалам */}
            <tr>
              <td colSpan={4} style={{ padding: "4px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold", backgroundColor: "#FFFF00" }}>
                ВСЕГО по статье МАТЕРИАЛЫ:
              </td>
              <td style={{ padding: "4px 4px", textAlign: "right", border: "1px solid #000", fontWeight: "bold", backgroundColor: "#FFFF00" }}>
                {formatCurrency(materialsCustomerTotal)}
              </td>
            </tr>
            {/* в т.ч. НДС */}
            <tr>
              <td colSpan={4} style={{ padding: "3px 4px", textAlign: "right", border: "1px solid #000", fontSize: "8pt" }}>
                в т.ч. НДС {vatNoteText}:
              </td>
              <td style={{ padding: "3px 4px", textAlign: "right", border: "1px solid #000" }}>
                {formatCurrency(materialsVat)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Final Totals */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px", border: "1px solid #000", fontSize: "9pt" }}>
          <tbody>
            {/* ИТОГО без НДС */}
            <tr>
              <td style={{ padding: "4px 6px", border: "1px solid #000" }}>
                <span style={{ fontWeight: "bold" }}>ИТОГО, по расчету без НДС</span>{" "}
                <span style={{ fontSize: "8pt", fontStyle: "italic" }}>(здесь сумма по формуле, без НДС)</span>:
              </td>
              <td style={{ width: "120px", padding: "4px 6px", textAlign: "right", border: "1px solid #000", fontWeight: "bold" }}>
                {formatCurrency(grandTotalWithoutVat)}
              </td>
            </tr>
            {/* НДС */}
            <tr>
              <td style={{ padding: "4px 6px", border: "1px solid #000" }}>
                <span style={{ fontWeight: "bold" }}>НДС</span>{" "}
                <span style={{ fontSize: "8pt", fontStyle: "italic" }}>{vatNoteText}</span>:
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", border: "1px solid #000" }}>
                {formatCurrency(worksVat + materialsVat)}
              </td>
            </tr>
            {/* ВСЕГО по расчету */}
            <tr>
              <td style={{ padding: "5px 6px", fontWeight: "bold", border: "1px solid #000", backgroundColor: "#FFFF00", textAlign: "right" }}>
                ВСЕГО по расчету:
              </td>
              <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: "bold", border: "1px solid #000", backgroundColor: "#FFFF00" }}>
                {formatCurrency(grandTotalWithVat)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signature */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "40px", fontSize: "10pt" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", padding: "4px 0", verticalAlign: "bottom", textAlign: "center" }}>
                Расчет составил
              </td>
              <td style={{ width: "50%", padding: "4px 0", textAlign: "center", verticalAlign: "bottom" }}>
                {engineerName || "________________"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

CustomerEstimatePDF.displayName = "CustomerEstimatePDF";
