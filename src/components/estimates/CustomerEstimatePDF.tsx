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

// Format number with 2 decimal places and space as thousands separator
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

    const vatPercent = customerCalc.vatRate === 22 ? "22" : "0";
    const objectFull = objectAddress ? `${objectName}, ${objectAddress}` : objectName;

    const cellStyle: React.CSSProperties = {
      border: "1px solid #000",
      padding: "6px 8px",
      verticalAlign: "middle",
    };

    const headerCellStyle: React.CSSProperties = {
      ...cellStyle,
      fontWeight: "bold",
      textAlign: "center",
      backgroundColor: "#f5f5f5",
    };

    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          padding: "40px 50px",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "11pt",
          lineHeight: "1.5",
          color: "#000",
          backgroundColor: "#fff",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ fontWeight: "bold" }}>СОГЛАСОВАНО:</div>
            <div style={{ borderBottom: "1px solid #000", width: "180px", marginTop: "30px", marginBottom: "5px" }}></div>
            <div>"___" _____________ 2026 г.</div>
          </div>
          <div style={{ textAlign: "right" }}>
            к Договору № _______ от __________
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", margin: "30px 0" }}>
          <div style={{ fontSize: "16pt", fontWeight: "bold" }}>РАСЧЕТ СТОИМОСТИ</div>
          <div style={{ marginTop: "8px" }}>№ {estimateNumber || "б/н"} от {formatDate(estimateDate)} г.</div>
        </div>

        {/* Requisites */}
        <table style={{ width: "100%", marginBottom: "25px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "100px", fontWeight: "bold", padding: "3px 0" }}>Заказчик:</td>
              <td style={{ padding: "3px 0 3px 15px" }}>{clientName || "—"}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "3px 0" }}>Объект:</td>
              <td style={{ padding: "3px 0 3px 15px" }}>{objectFull || "—"}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "3px 0" }}>Исполнитель:</td>
              <td style={{ padding: "3px 0 3px 15px" }}>ООО «Климатис»</td>
            </tr>
          </tbody>
        </table>

        {/* Section 1: РАБОТЫ */}
        <div style={{ fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #000", paddingBottom: "2px" }}>
          1. РАБОТЫ
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "35px" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "120px" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={headerCellStyle}>№</th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>Перечень выполняемых работ</th>
              <th style={headerCellStyle}>Стоимость, руб.</th>
            </tr>
          </thead>
          <tbody>
            {workBlocks.length > 0 ? (
              workBlocks.map((block, index) => {
                const blockBase = calculateWorkBlockTotal(block);
                const blockCustomerPrice = blockBase * (1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100);
                return (
                  <tr key={block.id}>
                    <td style={{ ...cellStyle, textAlign: "center" }}>{index + 1}</td>
                    <td style={{ ...cellStyle, textAlign: "left" }}>{block.description || "Работа"}</td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(blockCustomerPrice)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#666" }}>
                  Работы не указаны
                </td>
              </tr>
            )}
            <tr>
              <td style={cellStyle}>&nbsp;</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold" }}>ИТОГО:</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(worksCustomerTotal)}</td>
            </tr>
            <tr>
              <td style={cellStyle}>&nbsp;</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>НДС ({vatPercent}%):</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(worksVat)}</td>
            </tr>
            <tr>
              <td style={{ ...cellStyle, backgroundColor: "#FFFF99" }}>&nbsp;</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", backgroundColor: "#FFFF99" }}>ВСЕГО, по статье РАБОТЫ:</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", backgroundColor: "#FFFF99" }}>{formatCurrency(worksWithVat)}</td>
            </tr>
          </tbody>
        </table>

        {/* Section 2: МАТЕРИАЛЫ */}
        <div style={{ fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #000", paddingBottom: "2px" }}>
          2. МАТЕРИАЛЫ
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "35px" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "55px" }} />
            <col style={{ width: "55px" }} />
            <col style={{ width: "100px" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={headerCellStyle}>№</th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>Спецификация используемых материалов</th>
              <th style={headerCellStyle}>Ед.<br/>изм.</th>
              <th style={headerCellStyle}>Кол-во</th>
              <th style={headerCellStyle}>Стоимость,<br/>руб.</th>
            </tr>
          </thead>
          <tbody>
            {materials.length > 0 ? (
              materials.map((material, index) => {
                const materialPrice = material.quantity * material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
                return (
                  <tr key={material.id}>
                    <td style={{ ...cellStyle, textAlign: "center" }}>{index + 1}</td>
                    <td style={{ ...cellStyle, textAlign: "left" }}>{material.materialName}</td>
                    <td style={{ ...cellStyle, textAlign: "center" }}>шт</td>
                    <td style={{ ...cellStyle, textAlign: "center" }}>{material.quantity}</td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(materialPrice)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#666" }}>
                  Материалы не указаны
                </td>
              </tr>
            )}
            <tr>
              <td style={{ ...cellStyle, backgroundColor: "#FFFF99" }}>&nbsp;</td>
              <td colSpan={3} style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", backgroundColor: "#FFFF99" }}>ВСЕГО по статье МАТЕРИАЛЫ:</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", backgroundColor: "#FFFF99" }}>{formatCurrency(materialsCustomerTotal)}</td>
            </tr>
            <tr>
              <td style={cellStyle}>&nbsp;</td>
              <td colSpan={3} style={{ ...cellStyle, textAlign: "right" }}>в т.ч. НДС ({vatPercent}%):</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(materialsVat)}</td>
            </tr>
          </tbody>
        </table>

        {/* Final Totals */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, fontWeight: "bold", width: "80%" }}>ИТОГО, по расчету без НДС:</td>
              <td style={{ ...cellStyle, textAlign: "right", width: "20%" }}>{formatCurrency(grandTotalWithoutVat)}</td>
            </tr>
            <tr>
              <td style={{ ...cellStyle }}>НДС ({vatPercent}%):</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(worksVat + materialsVat)}</td>
            </tr>
            <tr>
              <td style={{ ...cellStyle, fontWeight: "bold", backgroundColor: "#FFFF99" }}>ВСЕГО ПО РАСЧЕТУ:</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", fontSize: "13pt", backgroundColor: "#FFFF99" }}>{formatCurrency(grandTotalWithVat)} руб.</td>
            </tr>
          </tbody>
        </table>

        {/* Signature */}
        <div style={{ marginTop: "40px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "150px", verticalAlign: "bottom", paddingBottom: "5px" }}>Расчет составил:</td>
                <td style={{ width: "200px", textAlign: "center", verticalAlign: "bottom", borderBottom: "1px solid #000", paddingBottom: "5px" }}></td>
                <td style={{ verticalAlign: "bottom", textAlign: "right", paddingBottom: "5px", paddingLeft: "20px" }}>{engineerName || "________________"}</td>
              </tr>
              <tr>
                <td style={{ fontSize: "9pt", color: "#666", paddingTop: "3px" }}>{engineerPosition || "Инженер"}</td>
                <td style={{ fontSize: "9pt", color: "#666", textAlign: "center", paddingTop: "3px" }}>(подпись)</td>
                <td style={{ fontSize: "9pt", color: "#666", textAlign: "right", paddingTop: "3px" }}>(ФИО)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

CustomerEstimatePDF.displayName = "CustomerEstimatePDF";
