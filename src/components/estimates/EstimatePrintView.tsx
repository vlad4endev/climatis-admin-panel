import { forwardRef } from "react";
import { Estimate, calculateWorkBlockTotal, calculateAllBlocksTotal } from "@/types/estimate";

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

    return (
      <div ref={ref} className="p-8 bg-white text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">РАСЧЁТ (СМЕТА)</h1>
          <p className="text-lg">№ {estimate.estimateNumber}</p>
          <p className="text-sm text-gray-600">
            от {new Date(estimate.estimateDate).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <div className="mb-6 border-b pb-4">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600 w-1/3">Наименование:</td>
                <td className="py-1 font-medium">{estimate.name}</td>
              </tr>
              {estimate.requestName && (
                <tr>
                  <td className="py-1 text-gray-600">Заявка:</td>
                  <td className="py-1 font-medium">{estimate.requestName}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 text-gray-600">Тип расчёта:</td>
                <td className="py-1 font-medium">{estimate.type}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Статус:</td>
                <td className="py-1 font-medium">{estimate.status}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Расчёт составил:</td>
                <td className="py-1 font-medium">{estimate.createdByName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {estimate.workBlocks && estimate.workBlocks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 border-b pb-1">Перечень работ</h2>
            {estimate.workBlocks.map((block, blockIndex) => (
              <div key={block.id} className="mb-4">
                <h3 className="font-medium mb-2">
                  {blockIndex + 1}. {block.description || "Без описания"}
                </h3>
                <table className="w-full text-sm border-collapse mb-2">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Категория</th>
                      <th className="border p-2 text-right">План. часы</th>
                      <th className="border p-2 text-right">Кол-во</th>
                      <th className="border p-2 text-right">Ставка</th>
                      <th className="border p-2 text-right">Итого</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.filter(row => row.planHours > 0 || row.quantity > 0).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border p-2">{row.category}</td>
                        <td className="border p-2 text-right">{row.planHours}</td>
                        <td className="border p-2 text-right">{row.quantity}</td>
                        <td className="border p-2 text-right">{row.rate.toLocaleString('ru-RU')}</td>
                        <td className="border p-2 text-right">
                          {Math.round(row.planHours * row.quantity * row.rate).toLocaleString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-medium">
                      <td colSpan={4} className="border p-2 text-right">Итого по блоку:</td>
                      <td className="border p-2 text-right">
                        {Math.round(calculateWorkBlockTotal(block)).toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
            <div className="font-bold bg-gray-100 p-2 text-right">
              Итого по работам: {Math.round(worksTotal).toLocaleString('ru-RU')} ₽
            </div>
          </div>
        )}

        {estimate.materials && estimate.materials.length > 0 && (
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
                {estimate.materials.map((material, index) => (
                  <tr key={material.id || index}>
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{material.materialName}</td>
                    <td className="border p-2 text-right">{material.quantity}</td>
                    <td className="border p-2 text-right">{material.pricePerUnit.toLocaleString('ru-RU')}</td>
                    <td className="border p-2 text-right">
                      {Math.round(material.quantity * material.pricePerUnit).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td colSpan={4} className="border p-2 text-right">Итого по материалам:</td>
                  <td className="border p-2 text-right">
                    {Math.round(materialsTotal).toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="mb-6 p-3 bg-gray-100 rounded">
          <div className="grid grid-cols-3 gap-4 text-sm mb-2">
            <div className="flex justify-between">
              <span>Работы:</span>
              <span className="font-medium">{Math.round(worksTotal).toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex justify-between">
              <span>Материалы:</span>
              <span className="font-medium">{Math.round(materialsTotal).toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
            <span>ОБЩАЯ СУММА:</span>
            <span>{Math.round(grandTotal).toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        {estimate.engineerComment && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2 border-b pb-1">Комментарий инженера</h2>
            <p className="text-sm whitespace-pre-wrap">{estimate.engineerComment}</p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="mb-8">Расчёт составил: _____________________</p>
              <p>Дата: _____________________</p>
            </div>
            <div>
              <p className="mb-8">Согласовал: _____________________</p>
              <p>Дата: _____________________</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EstimatePrintView.displayName = "EstimatePrintView";
