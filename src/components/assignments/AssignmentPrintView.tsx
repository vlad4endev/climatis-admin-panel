import { forwardRef } from "react";
import { Assignment } from "@/types/assignment";
import { calculateWorkBlockTotal, calculateAllBlocksTotal, WorkBlock } from "@/types/estimate";

interface AssignmentPrintViewProps {
  assignment: Assignment;
}

const calculateBlockHours = (block: WorkBlock): number => {
  return block.rows.reduce((sum, row) => sum + (row.planHours * row.quantity), 0);
};

export const AssignmentPrintView = forwardRef<HTMLDivElement, AssignmentPrintViewProps>(
  ({ assignment }, ref) => {
    const worksTotal = assignment.workBlocks ? calculateAllBlocksTotal(assignment.workBlocks) : 0;

    return (
      <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt', lineHeight: '1.2', width: '210mm', minHeight: '297mm', boxSizing: 'border-box', padding: '10mm 15mm', background: 'white', color: 'black' }}>
        <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
          <h1 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '0 0 1mm 0' }}>ЗАДАНИЕ НА ВЫПОЛНЕНИЕ РАБОТ</h1>
          <p style={{ fontSize: '9pt', margin: '0' }}>№ {assignment.assignmentNumber}</p>
          <p style={{ fontSize: '8pt', color: '#666', margin: '0' }}>
            от {new Date(assignment.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <div style={{ marginBottom: '2mm', borderBottom: '0.5pt solid #ccc', paddingBottom: '1mm' }}>
          <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.5mm 0', color: '#666', width: '18mm' }}>Заявка:</td>
                <td style={{ padding: '0.5mm 0', fontWeight: 500 }}>{assignment.requestNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5mm 0', color: '#666' }}>Расчёт:</td>
                <td style={{ padding: '0.5mm 0', fontWeight: 500 }}>{assignment.estimateName}</td>
              </tr>
              {assignment.clientName && (
                <tr>
                  <td style={{ padding: '0.5mm 0', color: '#666' }}>Клиент:</td>
                  <td style={{ padding: '0.5mm 0', fontWeight: 500 }}>{assignment.clientName}</td>
                </tr>
              )}
              {assignment.objectName && (
                <tr>
                  <td style={{ padding: '0.5mm 0', color: '#666' }}>Объект:</td>
                  <td style={{ padding: '0.5mm 0', fontWeight: 500 }}>{assignment.objectName}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '0.5mm 0', color: '#666' }}>Бригада:</td>
                <td style={{ padding: '0.5mm 0', fontWeight: 500 }}>{assignment.teamName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {assignment.workBlocks && assignment.workBlocks.length > 0 && (
          <div style={{ marginBottom: '2mm' }}>
            <h2 style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0 0 1mm 0', borderBottom: '0.5pt solid #ccc', paddingBottom: '0.5mm' }}>Перечень работ</h2>
            <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse', marginBottom: '0.5mm' }}>
              <thead>
                <tr style={{ background: '#f3f3f3' }}>
                  <th style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'left', width: '6mm' }}>№</th>
                  <th style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'left' }}>Описание работ</th>
                  <th style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'center', width: '14mm' }}>Время, ч</th>
                  <th style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'right', width: '22mm' }}>Фонд оплаты, руб.</th>
                </tr>
              </thead>
              <tbody>
                {assignment.workBlocks.map((block, blockIndex) => (
                  <tr key={block.id}>
                    <td style={{ border: '0.5pt solid #999', padding: '1mm' }}>{blockIndex + 1}</td>
                    <td style={{ border: '0.5pt solid #999', padding: '1mm' }}>{block.description || "Без описания"}</td>
                    <td style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'center' }}>{calculateBlockHours(block)}</td>
                    <td style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'right' }}>{Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontWeight: 'bold', fontSize: '8pt', padding: '0.5mm 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ flex: 1, textAlign: 'center' }}>Итого:</span>
              <span style={{ width: '22mm', textAlign: 'right' }}>{Math.round(worksTotal).toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        )}

        {assignment.materials && assignment.materials.length > 0 && (
          <div style={{ marginBottom: '2mm' }}>
            <h2 style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0 0 1mm 0', borderBottom: '0.5pt solid #ccc', paddingBottom: '0.5mm' }}>Материалы</h2>
            <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f3f3' }}>
                  <th style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'left', width: '6mm' }}>№</th>
                  <th style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'left' }}>Наименование</th>
                  <th style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'center', width: '12mm' }}>Ед. изм.</th>
                  <th style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'right', width: '12mm' }}>Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {assignment.materials.map((material, index) => (
                  <tr key={material.id || index}>
                    <td style={{ border: '0.5pt solid #999', padding: '1mm' }}>{index + 1}</td>
                    <td style={{ border: '0.5pt solid #999', padding: '1mm' }}>{material.materialName}</td>
                    <td style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'center' }}>шт</td>
                    <td style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'right' }}>{material.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {assignment.engineerComment && (
          <div style={{ marginBottom: '2mm' }}>
            <h2 style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0 0 0.5mm 0', borderBottom: '0.5pt solid #ccc', paddingBottom: '0.5mm' }}>Комментарии инженера:</h2>
            <p style={{ fontSize: '8pt', margin: 0, whiteSpace: 'pre-wrap' }}>{assignment.engineerComment}</p>
          </div>
        )}

        {assignment.comments && assignment.comments !== assignment.engineerComment && (
          <div style={{ marginBottom: '2mm' }}>
            <h2 style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0 0 0.5mm 0', borderBottom: '0.5pt solid #ccc', paddingBottom: '0.5mm' }}>Комментарии</h2>
            <p style={{ fontSize: '8pt', margin: 0, whiteSpace: 'pre-wrap' }}>{assignment.comments}</p>
          </div>
        )}

        <div style={{ marginTop: '4mm', paddingTop: '2mm', borderTop: '0.5pt solid #ccc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', fontSize: '8pt' }}>
            <div>
              <p style={{ margin: '0 0 5mm 0' }}>Задание выдал: _____________________</p>
              <p style={{ margin: 0 }}>Дата: _____________________</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5mm 0' }}>Задание принял: _____________________</p>
              <p style={{ margin: 0 }}>Дата: _____________________</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AssignmentPrintView.displayName = "AssignmentPrintView";
