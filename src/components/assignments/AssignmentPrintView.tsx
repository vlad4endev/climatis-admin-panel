import { forwardRef } from "react";
import { Assignment } from "@/types/assignment";
import { calculateWorkBlockTotal, calculateAllBlocksTotal, WorkBlock } from "@/types/estimate";

interface AssignmentPrintViewProps {
  assignment: Assignment;
}

// Calculate total hours for a work block (sum of planHours * quantity for all rows)
const calculateBlockHours = (block: WorkBlock): number => {
  return block.rows.reduce((sum, row) => sum + (row.planHours * row.quantity), 0);
};

export const AssignmentPrintView = forwardRef<HTMLDivElement, AssignmentPrintViewProps>(
  ({ assignment }, ref) => {
    const worksTotal = assignment.workBlocks ? calculateAllBlocksTotal(assignment.workBlocks) : 0;

    return (
      <div ref={ref} className="p-4 bg-white text-black" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: '1.3', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
        <div className="text-center mb-3">
          <h1 className="text-base font-bold mb-0.5">ЗАДАНИЕ НА ВЫПОЛНЕНИЕ РАБОТ</h1>
          <p className="text-sm">№ {assignment.assignmentNumber}</p>
          <p className="text-xs text-gray-600">
            от {new Date(assignment.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <div className="mb-3 border-b pb-2">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="py-0.5 text-gray-600 w-20">Заявка:</td>
                <td className="py-0.5 font-medium">{assignment.requestNumber}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-gray-600">Расчёт:</td>
                <td className="py-0.5 font-medium">{assignment.estimateName}</td>
              </tr>
              {assignment.clientName && (
                <tr>
                  <td className="py-0.5 text-gray-600">Клиент:</td>
                  <td className="py-0.5 font-medium">{assignment.clientName}</td>
                </tr>
              )}
              {assignment.objectName && (
                <tr>
                  <td className="py-0.5 text-gray-600">Объект:</td>
                  <td className="py-0.5 font-medium">{assignment.objectName}</td>
                </tr>
              )}
              <tr>
                <td className="py-0.5 text-gray-600">Бригада:</td>
                <td className="py-0.5 font-medium">{assignment.teamName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {assignment.workBlocks && assignment.workBlocks.length > 0 && (
          <div className="mb-3">
            <h2 className="text-xs font-bold mb-1 border-b pb-0.5">Перечень работ</h2>
            <table className="w-full text-xs border-collapse mb-0.5">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 text-left w-6">№</th>
                  <th className="border p-1 text-left">Описание работ</th>
                  <th className="border p-1 text-center w-16">Время, ч</th>
                  <th className="border p-1 text-right w-24">Фонд оплаты, руб.</th>
                </tr>
              </thead>
              <tbody>
                {assignment.workBlocks.map((block, blockIndex) => (
                  <tr key={block.id}>
                    <td className="border p-1">{blockIndex + 1}</td>
                    <td className="border p-1">{block.description || "Без описания"}</td>
                    <td className="border p-1 text-center">{calculateBlockHours(block)}</td>
                    <td className="border p-1 text-right">{Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="font-bold text-xs py-0.5 flex justify-between">
              <span className="flex-1 text-center">Итого:</span>
              <span className="w-24 text-right">{Math.round(worksTotal).toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        )}

        {assignment.materials && assignment.materials.length > 0 && (
          <div className="mb-3">
            <h2 className="text-xs font-bold mb-1 border-b pb-0.5">Материалы</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 text-left w-6">№</th>
                  <th className="border p-1 text-left">Наименование</th>
                  <th className="border p-1 text-center w-14">Ед. изм.</th>
                  <th className="border p-1 text-right w-14">Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {assignment.materials.map((material, index) => (
                  <tr key={material.id || index}>
                    <td className="border p-1">{index + 1}</td>
                    <td className="border p-1">{material.materialName}</td>
                    <td className="border p-1 text-center">шт</td>
                    <td className="border p-1 text-right">{material.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {assignment.engineerComment && (
          <div className="mb-3">
            <h2 className="text-xs font-bold mb-0.5 border-b pb-0.5">Комментарии инженера:</h2>
            <p className="text-xs whitespace-pre-wrap">{assignment.engineerComment}</p>
          </div>
        )}

        {assignment.comments && (
          <div className="mb-3">
            <h2 className="text-xs font-bold mb-0.5 border-b pb-0.5">Комментарии</h2>
            <p className="text-xs whitespace-pre-wrap">{assignment.comments}</p>
          </div>
        )}

        <div className="mt-4 pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="mb-6">Задание выдал: _____________________</p>
              <p>Дата: _____________________</p>
            </div>
            <div>
              <p className="mb-6">Задание принял: _____________________</p>
              <p>Дата: _____________________</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AssignmentPrintView.displayName = "AssignmentPrintView";
