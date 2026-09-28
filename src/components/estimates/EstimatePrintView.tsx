import { forwardRef } from "react";
import { Estimate, calculateWorkBlockTotal, calculateAllBlocksTotal, getWorkBlockQuantity } from "@/types/estimate";

interface EstimatePrintViewProps {
  estimate: Estimate;
}

export const EstimatePrintView = forwardRef<HTMLDivElement, EstimatePrintViewProps>(
  ({ estimate }, ref) => {
    const worksTotal = estimate.workBlocks ? calculateAllBlocksTotal(estimate.workBlocks) : 0;
    const materialsTotal = estimate.materials?.reduce(
      (sum, m) => sum + m.quantity * m.pricePerUnit, 
      0
    ) || 0;
    const grandTotal = worksTotal + materialsTotal;

    const getExecutorLabel = () => {
      const execValue = (estimate.customerCalculation as any)?.executorCompany;
      if (execValue === "ip") return "ИП Щеткин А.Г.";
      return 'ООО "Климатис"';
    };

    return (
      <div ref={ref} className="bg-white text-black" style={{ 
        fontFamily: 'Arial, sans-serif',
        width: '210mm',
        padding: '15mm 20mm',
        fontSize: '10pt',
        lineHeight: '1.3',
        boxSizing: 'border-box'
      }}>
        <div className="text-center" style={{ marginBottom: '12px' }}>
          <h1 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '4px' }}>РАСЧЁТ (СМЕТА)</h1>
          <p style={{ fontSize: '11pt' }}>№ {estimate.estimateNumber}</p>
          <p style={{ fontSize: '9pt', color: '#666' }}>
            от {new Date(estimate.estimateDate).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <div style={{ marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
          <table style={{ width: '100%', fontSize: '9pt' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0', color: '#666', width: '80px' }}>Заказчик:</td>
                <td style={{ padding: '2px 0', fontWeight: 500 }}>{estimate.clientName || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', color: '#666' }}>Объект:</td>
                <td style={{ padding: '2px 0', fontWeight: 500 }}>
                  {estimate.objectName || estimate.name}
                  {estimate.objectAddress && `, ${estimate.objectAddress}`}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', color: '#666' }}>Исполнитель:</td>
                <td style={{ padding: '2px 0', fontWeight: 500 }}>{getExecutorLabel()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {estimate.workBlocks && estimate.workBlocks.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #ddd', paddingBottom: '2px' }}>Перечень работ</h2>
            {estimate.workBlocks.map((block, blockIndex) => {
              const blockQty = getWorkBlockQuantity(block);
              return (
              <div key={block.id} style={{ marginBottom: '8px' }}>
                <h3 style={{ fontWeight: 500, marginBottom: '4px', fontSize: '9pt' }}>
                  {blockIndex + 1}. {block.description || "Без описания"}{blockQty > 1 ? ` (×${blockQty})` : ""}
                </h3>
                <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse', marginBottom: '4px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'left' }}>Категория</th>
                      <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'right', width: '60px' }}>Часы</th>
                      <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'right', width: '50px' }}>Кол-во</th>
                      <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'right', width: '60px' }}>Ставка</th>
                      <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'right', width: '70px' }}>Итого</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.filter(row => row.planHours > 0 || row.quantity > 0).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px' }}>{row.category}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.planHours}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.quantity}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.rate.toLocaleString('ru-RU')}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>
                          {Math.round(row.planHours * row.quantity * row.rate * blockQty).toLocaleString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f9fafb', fontWeight: 500 }}>
                      <td colSpan={4} style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>Итого по блоку:</td>
                      <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>
                        {Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              );
            })}
            <div style={{ fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: '4px 8px', textAlign: 'right', fontSize: '9pt' }}>
              Итого по работам: {Math.round(worksTotal).toLocaleString('ru-RU')} ₽
            </div>
          </div>
        )}

        {estimate.materials && estimate.materials.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #ddd', paddingBottom: '2px' }}>Материалы</h2>
            <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'left', width: '30px' }}>№</th>
                  <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'left' }}>Наименование</th>
                  <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'right', width: '50px' }}>Кол-во</th>
                  <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'right', width: '60px' }}>Цена</th>
                  <th style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'right', width: '70px' }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {estimate.materials.map((material, index) => (
                  <tr key={material.id || index}>
                    <td style={{ border: '1px solid #ddd', padding: '2px 4px' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #ddd', padding: '2px 4px' }}>{material.materialName}</td>
                    <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{material.quantity}</td>
                    <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{material.pricePerUnit.toLocaleString('ru-RU')}</td>
                    <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>
                      {Math.round(material.quantity * material.pricePerUnit).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f9fafb', fontWeight: 500 }}>
                  <td colSpan={4} style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>Итого по материалам:</td>
                  <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>
                    {Math.round(materialsTotal).toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', marginBottom: '4px' }}>
            <span>Работы: <strong>{Math.round(worksTotal).toLocaleString('ru-RU')} ₽</strong></span>
            <span>Материалы: <strong>{Math.round(materialsTotal).toLocaleString('ru-RU')} ₽</strong></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11pt', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '4px' }}>
            <span>ОБЩАЯ СУММА:</span>
            <span>{Math.round(grandTotal).toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        {estimate.engineerComment && (
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #ddd', paddingBottom: '2px' }}>Комментарий инженера</h2>
            <p style={{ fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{estimate.engineerComment}</p>
          </div>
        )}

        <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
            <div>
              <p style={{ marginBottom: '20px' }}>Расчёт составил: _____________________</p>
              <p>Дата: _____________________</p>
            </div>
            <div>
              <p style={{ marginBottom: '20px' }}>Согласовал: _____________________</p>
              <p>Дата: _____________________</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EstimatePrintView.displayName = "EstimatePrintView";
