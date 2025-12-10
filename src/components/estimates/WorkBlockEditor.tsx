import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import {
  WorkBlock,
  WorkRow,
  WORKER_CATEGORIES,
  createEmptyWorkBlock,
  calculateWorkRowTotal,
  calculateWorkBlockTotal,
  calculateAllBlocksTotal,
} from "@/types/estimate";

interface WorkBlockEditorProps {
  blocks: WorkBlock[];
  onChange: (blocks: WorkBlock[]) => void;
  readOnly?: boolean;
}

export function WorkBlockEditor({ blocks, onChange, readOnly = false }: WorkBlockEditorProps) {
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

  const grandTotal = calculateAllBlocksTotal(blocks);

  return (
    <div className="space-y-4">
      {blocks.map((block, blockIndex) => (
        <div
          key={block.id}
          className="bg-form-section p-4 rounded-lg space-y-4 border border-border/50"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-form-label mb-1 block">
                Блок {blockIndex + 1}: Описание работы
              </label>
              <Textarea
                value={block.description}
                onChange={(e) =>
                  updateBlockDescription(block.id, e.target.value)
                }
                placeholder="Описание работы..."
                rows={2}
                readOnly={readOnly}
                className={readOnly ? "bg-muted/50" : ""}
              />
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

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[160px]">
                    Категория
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground w-[100px]">
                    План, час
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground w-[100px]">
                    Кол-во, чел
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground w-[120px]">
                    Ставка, руб.
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground w-[120px]">
                    Всего, руб.
                  </th>
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
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.planHours || ""}
                          onChange={(e) =>
                            updateRow(
                              block.id,
                              rowIndex,
                              "planHours",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`h-8 text-center ${readOnly ? "bg-muted/50" : ""}`}
                          placeholder="0"
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={row.quantity || ""}
                          onChange={(e) =>
                            updateRow(
                              block.id,
                              rowIndex,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className={`h-8 text-center ${readOnly ? "bg-muted/50" : ""}`}
                          placeholder="0"
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={row.rate || ""}
                          onChange={(e) =>
                            updateRow(
                              block.id,
                              rowIndex,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`h-8 text-center ${readOnly ? "bg-muted/50" : ""}`}
                          placeholder="0"
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {Math.round(rowTotal).toLocaleString("ru-RU")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30">
                  <td colSpan={4} className="py-2 px-2 text-right font-semibold">
                    Итого по блоку:
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-primary">
                    {Math.round(calculateWorkBlockTotal(block)).toLocaleString(
                      "ru-RU"
                    )}{" "}
                    ₽
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={addBlock}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить блок работ
        </Button>
      )}

      {blocks.length > 0 && (
        <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/30">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">
              Итого стоимость работ по всем блокам:
            </span>
            <span className="text-xl font-bold text-primary">
              {Math.round(grandTotal).toLocaleString("ru-RU")} ₽
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
