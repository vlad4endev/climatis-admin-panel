import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Material } from "@/types/estimate";

interface MaterialListEditorProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  availableMaterials: Array<{ id: string; name: string; price?: number }>;
}

export function MaterialListEditor({
  materials,
  onChange,
  availableMaterials,
}: MaterialListEditorProps) {
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const dropdown = dropdownRefs.current[activeDropdown];
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      materialName: "",
      quantity: 0,
      pricePerUnit: 0,
    };
    onChange([...materials, newMaterial]);
    setSearchValues({ ...searchValues, [newMaterial.id]: "" });
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter((material) => material.id !== id));
    const newSearchValues = { ...searchValues };
    delete newSearchValues[id];
    setSearchValues(newSearchValues);
  };

  const updateMaterial = (
    id: string,
    field: keyof Material,
    value: string | number
  ) => {
    onChange(
      materials.map((material) =>
        material.id === id ? { ...material, [field]: value } : material
      )
    );
  };

  const selectMaterial = (
    materialId: string,
    selectedMaterial: { id: string; name: string; price?: number }
  ) => {
    updateMaterial(materialId, "materialId", selectedMaterial.id);
    updateMaterial(materialId, "materialName", selectedMaterial.name);
    if (selectedMaterial.price) {
      updateMaterial(materialId, "pricePerUnit", selectedMaterial.price);
    }
    setSearchValues({ ...searchValues, [materialId]: selectedMaterial.name });
    setActiveDropdown(null);
  };

  const handleSearchChange = (materialId: string, value: string) => {
    setSearchValues({ ...searchValues, [materialId]: value });
    updateMaterial(materialId, "materialName", value);
    updateMaterial(materialId, "materialId", undefined);
    setActiveDropdown(materialId);
  };

  const getFilteredMaterials = (materialId: string) => {
    const searchValue = searchValues[materialId] || "";
    if (!searchValue) return availableMaterials;
    return availableMaterials.filter((material) =>
      material.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  const totalAmount = materials.reduce(
    (sum, material) => sum + material.quantity * material.pricePerUnit,
    0
  );

  return (
    <div className="space-y-4">
      {materials.length > 0 && (
        <div className="grid grid-cols-[1fr_80px_100px_100px_80px] gap-3 text-sm font-medium text-muted-foreground">
          <div>Материал</div>
          <div>Кол-во</div>
          <div>Цена/ед.</div>
          <div>Сумма</div>
          <div></div>
        </div>
      )}

      <div className="space-y-2">
        {materials.map((material) => {
          const lineTotal = material.quantity * material.pricePerUnit;
          const filteredMaterials = getFilteredMaterials(material.id);
          const showDropdown =
            activeDropdown === material.id && filteredMaterials.length > 0;

          return (
            <div
              key={material.id}
              className="grid grid-cols-[1fr_80px_100px_100px_80px] gap-3 items-center"
            >
              <div className="relative" ref={(el) => (dropdownRefs.current[material.id] = el)}>
                <Input
                  value={searchValues[material.id] ?? material.materialName}
                  onChange={(e) => handleSearchChange(material.id, e.target.value)}
                  onFocus={() => setActiveDropdown(material.id)}
                  placeholder="Поиск материала или введите название"
                />
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto z-50">
                    {filteredMaterials.map((availMaterial) => (
                      <div
                        key={availMaterial.id}
                        className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                        onClick={() => selectMaterial(material.id, availMaterial)}
                      >
                        {availMaterial.name}
                        {availMaterial.price && (
                          <span className="text-muted-foreground ml-2">
                            ({availMaterial.price} ₽)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Input
                type="number"
                min="0"
                step="1"
                value={material.quantity || ""}
                onChange={(e) =>
                  updateMaterial(
                    material.id,
                    "quantity",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0"
              />

              <Input
                type="number"
                min="0"
                step="0.01"
                value={material.pricePerUnit || ""}
                onChange={(e) =>
                  updateMaterial(
                    material.id,
                    "pricePerUnit",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0"
              />

              <div className="text-sm font-medium text-right pr-2">
                {Math.round(lineTotal).toLocaleString("ru-RU")} ₽
              </div>

              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMaterial(material.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={addMaterial}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {materials.length === 0 && (
        <div className="text-center py-8">
          <Button type="button" onClick={addMaterial} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Добавить первый материал
          </Button>
        </div>
      )}

      {materials.length > 0 && (
        <div className="flex justify-end items-center gap-2 pt-4 border-t">
          <span className="text-sm font-semibold">Итого:</span>
          <span className="text-lg font-bold">
            {Math.round(totalAmount).toLocaleString("ru-RU")} ₽
          </span>
        </div>
      )}
    </div>
  );
}
