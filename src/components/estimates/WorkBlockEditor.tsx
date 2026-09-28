import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import {
  WorkBlock,
  WorkRow,
  PriceWork,
  WorkBlockMode,
  createEmptyWorkBlock,
  calculateWorkRowTotal,
  calculateWorkBlockTotal,
  calculateWorkBlockRowsTotal,
  calculateWorkBlockPriceWorksTotal,
  calculateAllBlocksTotal,
  getWorkBlockQuantity,
} from "@/types/estimate";
import { PriceWorkListEditor } from "./PriceWorkListEditor";

interface WorkBlockEditorProps {
  blocks: WorkBlock[];
  onChange: (blocks: WorkBlock[]) => void;
  readOnly?: boolean;
  availablePriceItems?: Array<{ id: string; name: string; price: number; unit: string; category?: string }>;
}

export function WorkBlockEditor({ blocks, onChange, readOnly = false, availablePriceItems = [] }: WorkBlockEditorProps) {
  const addBlock = () => {
    onChange([...blocks, createEmptyWorkBlock()]);
  };

  const removeBlock = (blockId: string) => {
    onChange(blocks.filter((b) => b.id !== blockId));
  };

  const updateBlockDescription = (blockId: string, description: string) => {
    onChange(
      blocks.map((b) => (b.id === blockId ? { ...b, description } : b))
    );
  };

  const updateBlockMode = (blockId: string, mode: WorkBlockMode) => {
    onChange(blocks.map((b) => (b.id === blockId ? { ...b, mode } : b)));
  };

  const updateBlockQuantity = (blockId: string, quantity: number) => {
    onChange(blocks.map((b) => (b.id === blockId ? { ...b, quantity } : b)));
  };

  const updateRow = (
    blockId: string,
    categoryIndex: number,
    field: keyof WorkRow,
    value: number
  ) => {
    onChange(
      blocks.map((block) => {
        if (block.id !== blockId) return block;
        const newRows = [...block.rows];
        newRows[categoryIndex] = { ...newRows[categoryIndex], [field]: value };
        return { ...block, rows: newRows };
      })
    );
  };

  const setBlockPriceWorks = (blockId: string, updater: PriceWork[] | ((prev: PriceWork[]) => PriceWork[])) => {
    onChange(
      blocks.map((block) => {
        if (block.id !== blockId) return block;
        const prev = block.priceWorks || [];
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        return { ...block, priceWorks: next };
      })
    );
  };

  const grandTotal = calculateAllBlocksTotal(blocks);

  return (
    <div className="space-y-4">
      {blocks.map((block, blockIndex) => {
        const mode: WorkBlockMode = block.mode || "manual";
        const blockQty = getWorkBlockQuantity(block);
        const rowsTotal = calculateWorkBlockRowsTotal(block);
        const priceWorksTotal = calculateWorkBlockPriceWorksTotal(block);
        const blockTotal = calculateWorkBlockTotal(block);
        return (
          <div
            key={block.id}
            className="bg-form-section p-4 rounded-lg space-y-4 border border-border/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-form-label mb-1 block">
                      Блок {blockIndex + 1}: способ расчёта
                    </label>
                    <RadioGroup
                      value={mode}
                      onValueChange={(v) => !readOnly && updateBlockMode(block.id, v as WorkBlockMode)}
                      className="flex flex-row gap-4"
                      disabled={readOnly}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id={`mode-manual-${block.id}`} />
                        <Label htmlFor={`mode-manual-${block.id}`} className="cursor-pointer">Вручную</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price" id={`mode-price-${block.id}`} />
                        <Label htmlFor={`mode-price-${block.id}`} className="cursor-pointer">По прайсу</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="w-28">
                    <label className="text-sm font-medium text-form-label mb-1 block" title="Сколько раз выполняется этот блок работ (например, одна и та же услуга на нескольких единицах оборудования) — сумма блока умножается на это число">
                      Кол-во услуг
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={blockQty}
                      onChange={(e) => updateBlockQuantity(block.id, Math.max(1, parseInt(e.target.value) || 1))}
                      className={`h-9 text-center ${readOnly ? "bg-muted/50" : ""}`}
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {mode === "manual" && (
                  <div>
                    <label className="text-sm font-medium text-form-label mb-1 block">
                      Описание работы
                    </label>
                    <Textarea
                      value={block.description}
                      onChange={(e) => updateBlockDescription(block.id, e.target.value)}
                      placeholder="Описание работы..."
                      rows={2}
                      readOnly={readOnly}
                      className={readOnly ? "bg-muted/50" : ""}
                    />
                  </div>
                )}
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBlock(block.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {mode === "price" ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-form-label">Работы из прайса</div>
                <PriceWorkListEditor
                  items={block.priceWorks || []}
                  onChange={(updater) => setBlockPriceWorks(block.id, updater as any)}
                  availableItems={availablePriceItems}
                  readOnly={readOnly}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="text-sm font-semibold text-form-label mb-2">Расчёт по категориям</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[160px]">Категория</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground w-[100px]">План, час</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground w-[100px]">Кол-во, чел</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground w-[120px]">Ставка, руб.</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground w-[120px]">Всего, руб.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => {
                      const rowTotal = calculateWorkRowTotal(row);
                      return (
                        <tr key={row.category} className="border-b border-border/30">
                          <td className="py-2 px-2 font-medium">{row.category}</td>
                          <td className="py-2 px-2">
                            <Input
                              type="number" min="0" step="0.5"
                              value={row.planHours || ""}
                              onChange={(e) => updateRow(block.id, rowIndex, "planHours", parseFloat(e.target.value) || 0)}
                              className={`h-8 text-center ${readOnly ? "bg-muted/50" : ""}`}
                              placeholder="0" readOnly={readOnly}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number" min="0" step="1"
                              value={row.quantity || ""}
                              onChange={(e) => updateRow(block.id, rowIndex, "quantity", parseInt(e.target.value) || 0)}
                              className={`h-8 text-center ${readOnly ? "bg-muted/50" : ""}`}
                              placeholder="0" readOnly={readOnly}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number" min="0" step="1"
                              value={row.rate || ""}
                              onChange={(e) => updateRow(block.id, rowIndex, "rate", parseFloat(e.target.value) || 0)}
                              className={`h-8 text-center ${readOnly ? "bg-muted/50" : ""}`}
                              placeholder="0" readOnly={readOnly}
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-medium">
                            {Math.round(rowTotal * blockQty).toLocaleString("ru-RU")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30">
                      <td colSpan={4} className="py-2 px-2 text-right font-semibold">Итого по категориям:</td>
                      <td className="py-2 px-2 text-right font-bold text-primary">
                        {Math.round(rowsTotal).toLocaleString("ru-RU")} ₽
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="flex justify-end items-center bg-muted/40 rounded-md px-3 py-2">
              <div className="text-base font-bold text-primary">
                Итого блок: {Math.round(blockTotal).toLocaleString("ru-RU")} ₽
              </div>
            </div>
          </div>
        );
      })}

      {!readOnly && (
        <Button type="button" variant="outline" onClick={addBlock} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Добавить блок работ
        </Button>
      )}

      {blocks.length > 0 && (
        <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/30">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Итого стоимость работ по всем блокам:</span>
            <span className="text-xl font-bold text-primary">
              {Math.round(grandTotal).toLocaleString("ru-RU")} ₽
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
