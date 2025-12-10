import { forwardRef } from "react";
import { Assignment } from "@/types/assignment";
import { calculateWorkBlockTotal, calculateAllBlocksTotal, calculateWorkRowTotal } from "@/types/estimate";

interface AssignmentPrintViewProps {
  assignment: Assignment;
}

export const AssignmentPrintView = forwardRef<HTMLDivElement, AssignmentPrintViewProps>(
  ({ assignment }, ref) => {
    const worksTotal = assignment.workBlocks ? calculateAllBlocksTotal(assignment.workBlocks) : 0;

    return (
      <div ref={ref} className="p-8 bg-white text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">ЗАДАНИЕ НА ВЫПОЛНЕНИЕ РАБОТ</h1>
          <p className="text-lg">№ {assignment.assignmentNumber}</p>
          <p className="text-sm text-gray-600">
            от {new Date(assignment.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <div className="mb-6 border-b pb-4">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600 w-1/3">Заявка:</td>
                <td className="py-1 font-medium">{assignment.requestNumber}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Расчёт:</td>
                <td className="py-1 font-medium">{assignment.estimateName}</td>
              </tr>
              {assignment.clientName && (
                <tr>
                  <td className="py-1 text-gray-600">Клиент:</td>
                  <td className="py-1 font-medium">{assignment.clientName}</td>
                </tr>
              )}
              {assignment.objectName && (
                <tr>
                  <td className="py-1 text-gray-600">Объект:</td>
                  <td className="py-1 font-medium">{assignment.objectName}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 text-gray-600">Бригада:</td>
                <td className="py-1 font-medium">{assignment.teamName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {assignment.workBlocks && assignment.workBlocks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 border-b pb-1">Перечень работ</h2>
            <table className="w-full text-sm border-collapse mb-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">№</th>
                  <th className="border p-2 text-left">Описание работ</th>
                  <th className="border p-2 text-right">Стоимость, руб.</th>
                </tr>
              </thead>
              <tbody>
                {assignment.workBlocks.map((block, blockIndex) => (
                  <tr key={block.id}>
                    <td className="border p-2">{blockIndex + 1}</td>
                    <td className="border p-2">{block.description || "Без описания"}</td>
                    <td className="border p-2 text-right">{Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="font-bold bg-gray-100 p-2 text-right">
              Итого по работам: {Math.round(worksTotal).toLocaleString('ru-RU')} ₽
            </div>
          </div>
        )}

        {assignment.materials && assignment.materials.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 border-b pb-1">Материалы</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">№</th>
                  <th className="border p-2 text-left">Наименование</th>
                  <th className="border p-2 text-right">Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {assignment.materials.map((material, index) => (
                  <tr key={material.id || index}>
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{material.materialName}</td>
                    <td className="border p-2 text-right">{material.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-6 p-3 bg-gray-100 rounded">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>ИТОГО ПО РАБОТАМ:</span>
            <span>{Math.round(worksTotal).toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        {assignment.comments && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2 border-b pb-1">Комментарии</h2>
            <p className="text-sm whitespace-pre-wrap">{assignment.comments}</p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="mb-8">Задание выдал: _____________________</p>
              <p>Дата: _____________________</p>
            </div>
            <div>
              <p className="mb-8">Задание принял: _____________________</p>
              <p>Дата: _____________________</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AssignmentPrintView.displayName = "AssignmentPrintView";
