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
      <div ref={ref} className="p-6 bg-white text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold mb-1">ЗАДАНИЕ НА ВЫПОЛНЕНИЕ РАБОТ</h1>
          <p className="text-base">№ {assignment.assignmentNumber}</p>
          <p className="text-sm text-gray-600">
            от {new Date(assignment.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <div className="mb-4 border-b pb-3">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-0.5 text-gray-600 w-24">Заявка:</td>
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
          <div className="mb-4">
            <h2 className="text-base font-bold mb-2 border-b pb-1">Перечень работ</h2>
            <table className="w-full text-sm border-collapse mb-1">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1.5 text-left w-8">№</th>
                  <th className="border p-1.5 text-left">Описание работ</th>
                  <th className="border p-1.5 text-center w-20">Время, ч</th>
                  <th className="border p-1.5 text-right w-28">Фонд оплаты, руб.</th>
                </tr>
              </thead>
              <tbody>
                {assignment.workBlocks.map((block, blockIndex) => (
                  <tr key={block.id}>
                    <td className="border p-1.5">{blockIndex + 1}</td>
                    <td className="border p-1.5">{block.description || "Без описания"}</td>
                    <td className="border p-1.5 text-center">{calculateBlockHours(block)}</td>
                    <td className="border p-1.5 text-right">{Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="font-bold text-sm text-right py-1">
              Итого по работам: {Math.round(worksTotal).toLocaleString('ru-RU')} ₽
            </div>
          </div>
        )}

        {assignment.materials && assignment.materials.length > 0 && (
          <div className="mb-4">
            <h2 className="text-base font-bold mb-2 border-b pb-1">Материалы</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1.5 text-left w-8">№</th>
                  <th className="border p-1.5 text-left">Наименование</th>
                  <th className="border p-1.5 text-center w-16">Ед. изм.</th>
                  <th className="border p-1.5 text-right w-16">Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {assignment.materials.map((material, index) => (
                  <tr key={material.id || index}>
                    <td className="border p-1.5">{index + 1}</td>
                    <td className="border p-1.5">{material.materialName}</td>
                    <td className="border p-1.5 text-center">шт</td>
                    <td className="border p-1.5 text-right">{material.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {assignment.engineerComment && (
          <div className="mb-4">
            <h2 className="text-base font-bold mb-1 border-b pb-1">Комментарии инженера:</h2>
            <p className="text-sm whitespace-pre-wrap">{assignment.engineerComment}</p>
          </div>
        )}

        {assignment.comments && (
          <div className="mb-4">
            <h2 className="text-base font-bold mb-1 border-b pb-1">Комментарии</h2>
            <p className="text-sm whitespace-pre-wrap">{assignment.comments}</p>
          </div>
        )}

        <div className="mt-6 pt-3 border-t">
          <div className="grid grid-cols-2 gap-6 text-sm">
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
