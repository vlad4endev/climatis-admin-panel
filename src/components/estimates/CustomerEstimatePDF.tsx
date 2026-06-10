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
  executorCompany?: string;
  estimateName?: string;
}

// Format number with 2 decimal places and space as thousands separator
const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ").replace(".", ",");
};

// Format date as DD.MM.YYYYг.
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "__.__.____";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}г.`;
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
      executorCompany = 'ООО «Климатис»',
      estimateName,
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
    const grandTotalVat = worksVat + materialsVat;
    const grandTotalWithVat = grandTotalWithoutVat + worksVat;

    const vatNote = customerCalc.vatRate === 22 
      ? "(0 либо 22%, как указано в расчете)" 
      : "(0 либо 22%, как указано в расчете)";
    const objectFull = objectAddress ? `${objectName}, ${objectAddress}` : objectName;

    const cellStyle: React.CSSProperties = {
      border: "1px solid #000",
      padding: "4px 6px",
      verticalAlign: "top",
      fontSize: "9pt",
    };

    const headerCellStyle: React.CSSProperties = {
      ...cellStyle,
      fontWeight: "normal",
      textAlign: "center",
      backgroundColor: "#fff",
    };

    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          padding: "30px 50px",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "10pt",
          lineHeight: "1.4",
          color: "#000",
          backgroundColor: "#fff",
        }}
      >
        {/* Header */}
        <table style={{ width: "100%", marginBottom: "10px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", verticalAlign: "top" }}>
                <div style={{ fontWeight: "bold" }}>СОГЛАСОВАНО:</div>
                <div style={{ marginTop: "20px" }}>"____"______________2026 г.</div>
                <div style={{ borderBottom: "1px solid #000", width: "150px", marginTop: "5px" }}></div>
                <div style={{ borderBottom: "1px solid #000", width: "100px", marginTop: "5px" }}></div>
              </td>
              <td style={{ width: "50%", textAlign: "right", verticalAlign: "top" }}>
                к Договору № ___ от ________
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <div style={{ textAlign: "center", margin: "25px 0 15px" }}>
          <div style={{ fontSize: "14pt", fontWeight: "bold" }}>РАСЧЕТ СТОИМОСТИ</div>
          <div style={{ marginTop: "5px", fontSize: "10pt" }}>№ {estimateNumber || "б/н"} от {formatDate(estimateDate)}</div>
        </div>

        {/* Requisites */}
        <table style={{ width: "100%", marginBottom: "20px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "100px", fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Заказчик:</td>
              <td style={{ padding: "2px 0 2px 10px", verticalAlign: "top", wordBreak: "break-word", overflowWrap: "break-word" }}>{clientName || "—"}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Объект:</td>
              <td style={{ padding: "2px 0 2px 10px", verticalAlign: "top", wordBreak: "break-word", overflowWrap: "break-word" }}>{objectFull || "—"}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Исполнитель:</td>
              <td style={{ padding: "2px 0 2px 10px", verticalAlign: "top", wordBreak: "break-word", overflowWrap: "break-word" }}>{executorCompany}</td>
            </tr>
            {estimateName && (
            <tr>
              <td style={{ width: "100px", padding: "2px 0 0 0" }}></td>
              <td style={{ padding: "2px 0 0 10px", verticalAlign: "top" }}>{estimateName}</td>
            </tr>
            )}
          </tbody>
        </table>

        {/* Section 1: РАБОТЫ */}
        <div style={{ fontWeight: "bold", marginBottom: "5px", fontSize: "10pt" }}>
          <span style={{ borderBottom: "1px solid #000", paddingBottom: "1px" }}>1. РАБОТЫ</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: "25px" }}>№</th>
              <th style={{ ...headerCellStyle, textAlign: "center" }}>Перечень выполняемых работ</th>
              <th style={{ ...headerCellStyle, width: "90px" }}>Стоимость, руб</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const worksMarkup = 1 + customerCalc.overheadPercent / 100 + customerCalc.estimatedProfitPercent / 100;
              const rows: JSX.Element[] = [];
              let rowNum = 0;
              workBlocks.forEach((block) => {
                if (block.mode === "price") {
                  const items = block.priceWorks || [];
                  if (items.length === 0) {
                    rowNum += 1;
                    rows.push(
                      <tr key={block.id}>
                        <td style={{ ...cellStyle, textAlign: "center" }}>{rowNum}</td>
                        <td style={{ ...cellStyle, textAlign: "left" }}>{block.description || "Работа"}</td>
                        <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(0)}</td>
                      </tr>
                    );
                  } else {
                    items.forEach((pw) => {
                      rowNum += 1;
                      const total = pw.quantity * pw.pricePerUnit * worksMarkup;
                      rows.push(
                        <tr key={`${block.id}-${pw.id}`}>
                          <td style={{ ...cellStyle, textAlign: "center" }}>{rowNum}</td>
                          <td style={{ ...cellStyle, textAlign: "left" }}>{pw.name || "Работа"}</td>
                          <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(total)}</td>
                        </tr>
                      );
                    });
                  }
                } else {
                  rowNum += 1;
                  const blockBase = calculateWorkBlockTotal(block);
                  const blockCustomerPrice = blockBase * worksMarkup;
                  rows.push(
                    <tr key={block.id}>
                      <td style={{ ...cellStyle, textAlign: "center" }}>{rowNum}</td>
                      <td style={{ ...cellStyle, textAlign: "left" }}>{block.description || "Работа"}</td>
                      <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(blockCustomerPrice)}</td>
                    </tr>
                  );
                }
              });
              if (rows.length === 0) {
                return (
                  <tr>
                    <td colSpan={3} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#666" }}>
                      Работы не указаны
                    </td>
                  </tr>
                );
              }
              return rows;
            })()}
            {/* ИТОГО row */}
            <tr>
              <td style={cellStyle}></td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold" }}>ИТОГО:</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(worksCustomerTotal)}</td>
            </tr>
            {/* НДС row */}
            <tr>
              <td style={cellStyle}></td>
              <td style={{ ...cellStyle, textAlign: "right" }}>
                НДС <span style={{ fontStyle: "italic", fontSize: "8pt" }}>{vatNote}</span>:
              </td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(worksVat)}</td>
            </tr>
            {/* ВСЕГО row - yellow */}
            <tr>
              <td style={{ ...cellStyle, backgroundColor: "#FFFF00" }}></td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", backgroundColor: "#FFFF00" }}>ВСЕГО, по статье РАБОТЫ:</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", backgroundColor: "#FFFF00" }}>{formatCurrency(worksWithVat)}</td>
            </tr>
          </tbody>
        </table>

        {/* Section 2: Материалы */}
        <div style={{ fontWeight: "bold", marginBottom: "5px", fontSize: "10pt" }}>
          <span style={{ borderBottom: "1px solid #000", paddingBottom: "1px" }}>2. Материалы</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: "25px" }}>№</th>
              <th style={{ ...headerCellStyle, textAlign: "center" }}>Спецификация используемых материалов</th>
              <th style={{ ...headerCellStyle, width: "50px" }}>Ед. изм.</th>
              <th style={{ ...headerCellStyle, width: "45px" }}>Кол-во</th>
              <th style={{ ...headerCellStyle, width: "90px" }}>Стоимость, руб</th>
            </tr>
          </thead>
          <tbody>
            {materials.length > 0 ? (
              materials.map((material, index) => {
                const materialPrice = material.quantity * material.pricePerUnit * (1 + customerCalc.transportPercent / 100 + customerCalc.warehousePercent / 100);
                return (
                  <tr key={material.id}>
                    <td style={{ ...cellStyle, textAlign: "center" }}>{index + 1}</td>
                    <td style={{ ...cellStyle, textAlign: "left" }}>
                      {material.materialName}
                    </td>
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
            {/* ВСЕГО row - yellow */}
            <tr>
              <td style={{ ...cellStyle, backgroundColor: "#FFFF00" }}></td>
              <td colSpan={3} style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", backgroundColor: "#FFFF00" }}>ВСЕГО по статье МАТЕРИАЛЫ:</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", backgroundColor: "#FFFF00" }}>{formatCurrency(materialsCustomerTotal)}</td>
            </tr>
            {/* НДС row */}
            <tr>
              <td style={cellStyle}></td>
              <td colSpan={3} style={{ ...cellStyle, textAlign: "right" }}>
                в т.ч. НДС <span style={{ fontStyle: "italic", fontSize: "8pt" }}>{vatNote}</span>:
              </td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatCurrency(materialsVat)}</td>
            </tr>
          </tbody>
        </table>

        {/* Final Totals - NO BORDERS */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "3px 0", borderTop: "1px solid #000" }}>
                <strong>ИТОГО, по расчету без НДС</strong> <span style={{ fontStyle: "italic", fontSize: "8pt" }}>(здесь суммы по формуле, без НДС)</span>:
              </td>
              <td style={{ padding: "3px 0", textAlign: "right", width: "100px", borderTop: "1px solid #000" }}>{formatCurrency(grandTotalWithoutVat)}</td>
            </tr>
            <tr>
              <td style={{ padding: "3px 0" }}>
                <strong>НДС</strong> <span style={{ fontStyle: "italic", fontSize: "8pt" }}>{vatNote}</span>:
              </td>
              <td style={{ padding: "3px 0", textAlign: "right" }}>{formatCurrency(grandTotalVat)}</td>
            </tr>
            <tr>
              <td style={{ padding: "5px 8px", backgroundColor: "#FFFF00", fontWeight: "bold", fontSize: "11pt" }}>
                ВСЕГО по расчету:
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", backgroundColor: "#FFFF00", fontWeight: "bold", fontSize: "11pt" }}>
                {formatCurrency(grandTotalWithVat)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signature - minimal */}
        <table style={{ width: "100%", marginTop: "40px" }}>
          <tbody>
            <tr>
              <td style={{ width: "40%", textAlign: "center", paddingTop: "20px" }}>Расчет составил</td>
              <td style={{ width: "20%" }}></td>
              <td style={{ width: "40%", textAlign: "center", paddingTop: "20px" }}>{engineerName || "________________"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

CustomerEstimatePDF.displayName = "CustomerEstimatePDF";
