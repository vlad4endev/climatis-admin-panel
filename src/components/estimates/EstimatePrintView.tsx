import { forwardRef } from "react";
import { Estimate, calculateWorkBlockTotal, calculateAllBlocksTotal } from "@/types/estimate";

interface EstimatePrintViewProps {
  estimate: Estimate;
  engineerName?: string;
}

export const EstimatePrintView = forwardRef<HTMLDivElement, EstimatePrintViewProps>(
  ({ estimate, engineerName }, ref) => {
    const worksTotal = estimate.workBlocks ? calculateAllBlocksTotal(estimate.workBlocks) : 0;
    const materialsTotal = estimate.materials?.reduce(
      (sum, m) => sum + m.quantity * m.pricePerUnit, 
      0
    ) || 0;
    const grandTotal = worksTotal + materialsTotal;

    return (
      <div ref={ref} className="bg-white text-black" style={{ 
        fontFamily: 'Arial, sans-serif',
        width: '210mm',
        padding: '15mm 20mm',
        fontSize: '10pt',
        lineHeight: '1.3',
        boxSizing: 'border-box'
      }}>
        {/* Шапка документа */}
        <div style={{ marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ fontSize: '9pt' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>ООО «Климатис»</p>
              <p style={{ color: '#444' }}>Исполнитель</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '9pt' }}>
              <p><strong>Расчёт № {estimate.estimateNumber}</strong></p>
              <p>от {new Date(estimate.estimateDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })} г.</p>
            </div>
          </div>
          
          <h1 style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', margin: '12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            РАСЧЁТ СТОИМОСТИ РАБОТ
          </h1>
          
          <table style={{ width: '100%', fontSize: '9pt', marginTop: '12px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', width: '100px', fontWeight: 'bold', verticalAlign: 'top' }}>Заказчик:</td>
                <td style={{ padding: '4px 0', borderBottom: '1px solid #ccc' }}>{estimate.clientName || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Объект:</td>
                <td style={{ padding: '4px 0', borderBottom: '1px solid #ccc' }}>
                  {estimate.objectName || estimate.name}
                  {estimate.objectAddress && `, ${estimate.objectAddress}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {estimate.workBlocks && estimate.workBlocks.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
              1. ПЕРЕЧЕНЬ РАБОТ
            </h2>
            {estimate.workBlocks.map((block, blockIndex) => (
              <div key={block.id} style={{ marginBottom: '8px' }}>
                <h3 style={{ fontWeight: 500, marginBottom: '4px', fontSize: '9pt' }}>
                  1.{blockIndex + 1}. {block.description || "Без описания"}
                </h3>
                <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse', marginBottom: '4px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'left' }}>Категория</th>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '60px' }}>Часы</th>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '50px' }}>Кол-во</th>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '60px' }}>Ставка</th>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '70px' }}>Итого</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.filter(row => row.planHours > 0 || row.quantity > 0).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td style={{ border: '1px solid #000', padding: '2px 4px' }}>{row.category}</td>
                        <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>{row.planHours}</td>
                        <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>{row.quantity}</td>
                        <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>{row.rate.toLocaleString('ru-RU')}</td>
                        <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>
                          {Math.round(row.planHours * row.quantity * row.rate).toLocaleString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
                      <td colSpan={4} style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>Итого по блоку:</td>
                      <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>
                        {Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
            <div style={{ fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '6px 8px', textAlign: 'right', fontSize: '10pt', border: '1px solid #000' }}>
              ИТОГО ПО РАБОТАМ: {Math.round(worksTotal).toLocaleString('ru-RU')} ₽
            </div>
          </div>
        )}

        {estimate.materials && estimate.materials.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
              2. МАТЕРИАЛЫ
            </h2>
            <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '30px' }}>№</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'left' }}>Наименование</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '50px' }}>Кол-во</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '60px' }}>Цена</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '70px' }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {estimate.materials.map((material, index) => (
                  <tr key={material.id || index}>
                    <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '2px 4px' }}>{material.materialName}</td>
                    <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>{material.quantity}</td>
                    <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>{material.pricePerUnit.toLocaleString('ru-RU')}</td>
                    <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>
                      {Math.round(material.quantity * material.pricePerUnit).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                  <td colSpan={4} style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>ИТОГО ПО МАТЕРИАЛАМ:</td>
                  <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>
                    {Math.round(materialsTotal).toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Итоговый блок */}
        <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#f3f4f6', border: '2px solid #000' }}>
          <table style={{ width: '100%', fontSize: '10pt' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0' }}>Стоимость работ:</td>
                <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold' }}>{Math.round(worksTotal).toLocaleString('ru-RU')} ₽</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>Стоимость материалов:</td>
                <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold' }}>{Math.round(materialsTotal).toLocaleString('ru-RU')} ₽</td>
              </tr>
              <tr style={{ borderTop: '1px solid #000' }}>
                <td style={{ padding: '8px 0', fontSize: '12pt', fontWeight: 'bold' }}>ИТОГО:</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontSize: '12pt', fontWeight: 'bold' }}>{Math.round(grandTotal).toLocaleString('ru-RU')} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>

        {estimate.engineerComment && (
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
              ПРИМЕЧАНИЕ
            </h2>
            <p style={{ fontSize: '9pt', whiteSpace: 'pre-wrap', padding: '4px 0' }}>{estimate.engineerComment}</p>
          </div>
        )}

        {/* Подписи */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px solid #000' }}>
          <table style={{ width: '100%', fontSize: '10pt' }}>
            <tbody>
              <tr>
                <td style={{ width: '80px', verticalAlign: 'bottom', paddingBottom: '4px' }}>Инженер</td>
                <td style={{ width: '120px', borderBottom: '1px solid #000', verticalAlign: 'bottom', textAlign: 'center' }}></td>
                <td style={{ verticalAlign: 'bottom', paddingLeft: '16px', paddingBottom: '4px' }}>{engineerName || estimate.createdByName || "______________________"}</td>
              </tr>
              <tr>
                <td style={{ fontSize: '8pt', color: '#666' }}>(должность)</td>
                <td style={{ fontSize: '8pt', color: '#666', textAlign: 'center' }}>(подпись)</td>
                <td style={{ fontSize: '8pt', color: '#666', paddingLeft: '16px' }}>(ФИО)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

EstimatePrintView.displayName = "EstimatePrintView";
