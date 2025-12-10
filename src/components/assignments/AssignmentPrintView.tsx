import { forwardRef } from "react";
import { Assignment } from "@/types/assignment";
import { calculateWorkBlockTotal, calculateAllBlocksTotal, calculateWorkRowTotal } from "@/types/estimate";

interface AssignmentPrintViewProps {
  assignment: Assignment;
}

export const AssignmentPrintView = forwardRef<HTMLDivElement, AssignmentPrintViewProps>(
  ({ assignment }, ref) => {
    const worksTotal = assignment.workBlocks ? calculateAllBlocksTotal(assignment.workBlocks) : 0;

    const materialsTotal = assignment.materials?.reduce(
      (sum, material) => sum + material.quantity * material.pricePerUnit,
      0
    ) || 0;

    const grandTotal = worksTotal + materialsTotal;

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
            {assignment.workBlocks.map((block, blockIndex) => (
              <div key={block.id} className="mb-4">
                <h3 className="font-bold text-sm mb-2">
                  {blockIndex + 1}. {block.description || "Без описания"}
                </h3>
                <table className="w-full text-sm border-collapse mb-2">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Категория</th>
                      <th className="border p-2 text-right">План, час</th>
                      <th className="border p-2 text-right">Кол-во, чел</th>
                      <th className="border p-2 text-right">Ставка, руб.</th>
                      <th className="border p-2 text-right">Всего, руб.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.filter(row => row.planHours > 0 || row.quantity > 0 || row.rate > 0).map((row) => (
                      <tr key={row.category}>
                        <td className="border p-2">{row.category}</td>
                        <td className="border p-2 text-right">{row.planHours}</td>
                        <td className="border p-2 text-right">{row.quantity}</td>
                        <td className="border p-2 text-right">{Math.round(row.rate).toLocaleString('ru-RU')}</td>
                        <td className="border p-2 text-right">{Math.round(calculateWorkRowTotal(row)).toLocaleString('ru-RU')}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-50">
                      <td colSpan={4} className="border p-2 text-right">Итого по блоку:</td>
                      <td className="border p-2 text-right">{Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
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
                  <th className="border p-2 text-right">Цена</th>
                  <th className="border p-2 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {assignment.materials.map((material, index) => (
                  <tr key={material.id || index}>
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{material.materialName}</td>
                    <td className="border p-2 text-right">{material.quantity}</td>
                    <td className="border p-2 text-right">{Math.round(material.pricePerUnit).toLocaleString('ru-RU')} ₽</td>
                    <td className="border p-2 text-right">{Math.round(material.quantity * material.pricePerUnit).toLocaleString('ru-RU')} ₽</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td colSpan={4} className="border p-2 text-right">Итого по материалам:</td>
                  <td className="border p-2 text-right">{Math.round(materialsTotal).toLocaleString('ru-RU')} ₽</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-6 p-3 bg-gray-100 rounded">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>ОБЩАЯ СУММА:</span>
            <span>{Math.round(grandTotal).toLocaleString('ru-RU')} ₽</span>
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
