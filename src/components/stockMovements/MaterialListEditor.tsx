import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { StockMovementMaterial } from "@/types/stockMovement";

interface MaterialListEditorProps {
  materials: StockMovementMaterial[];
  onChange: (materials: StockMovementMaterial[]) => void;
  spareParts: Array<{ id: string; name: string }>;
}

export function MaterialListEditor({ materials, onChange, spareParts }: MaterialListEditorProps) {
  const [searchValues, setSearchValues] = useState<{ [key: number]: string }>({});
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Initialize search values with material names
  useEffect(() => {
    const newSearchValues: { [key: number]: string } = {};
    materials.forEach((material, index) => {
      newSearchValues[index] = material.materialName;
    });
    setSearchValues(newSearchValues);
  }, [materials]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown !== null) {
        const inputRef = inputRefs.current[activeDropdown];
        const dropdownRef = dropdownRefs.current[activeDropdown];
        
        if (
          inputRef && !inputRef.contains(event.target as Node) &&
          dropdownRef && !dropdownRef.contains(event.target as Node)
        ) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  const addMaterial = () => {
    onChange([...materials, { materialId: "", materialName: "", quantity: 0 }]);
  };

  const removeMaterial = (index: number) => {
    onChange(materials.filter((_, i) => i !== index));
    const newSearchValues = { ...searchValues };
    delete newSearchValues[index];
    setSearchValues(newSearchValues);
  };

  const updateMaterial = (index: number, field: keyof StockMovementMaterial, value: any) => {
    const updated = materials.map((material, i) =>
      i === index ? { ...material, [field]: value } : material
    );
    onChange(updated);
  };

  const selectMaterial = (index: number, sparePart: { id: string; name: string }) => {
    updateMaterial(index, "materialId", sparePart.id);
    updateMaterial(index, "materialName", sparePart.name);
    setSearchValues({ ...searchValues, [index]: sparePart.name });
    setActiveDropdown(null);
  };

  const getFilteredSpareParts = (index: number) => {
    const search = searchValues[index] || "";
    return spareParts.filter((part) =>
      part.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr,120px,40px] gap-2 text-sm font-medium text-muted-foreground mb-2">
        <div>Материал</div>
        <div>Количество</div>
        <div></div>
      </div>

      {materials.map((material, index) => {
        const filteredParts = getFilteredSpareParts(index);
        const showDropdown = activeDropdown === index && filteredParts.length > 0;

        return (
          <div key={index} className="grid grid-cols-[1fr,120px,40px] gap-2 items-start">
            <div className="relative">
              <Input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={searchValues[index] || ""}
                onChange={(e) => {
                  setSearchValues({ ...searchValues, [index]: e.target.value });
                  setActiveDropdown(index);
                }}
                onFocus={() => setActiveDropdown(index)}
                placeholder="Начните вводить..."
                autoComplete="off"
                className="h-9"
              />
              {showDropdown && (
                <div
                  ref={(el) => (dropdownRefs.current[index] = el)}
                  className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
                >
                  {filteredParts.map((part) => (
                    <div
                      key={part.id}
                      className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                      onClick={() => selectMaterial(index, part)}
                    >
                      {part.name}
                    </div>
                  ))}
                </div>
              )}
              {activeDropdown === index && searchValues[index] && filteredParts.length === 0 && (
                <div
                  ref={(el) => (dropdownRefs.current[index] = el)}
                  className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md px-3 py-2 text-muted-foreground text-sm"
                >
                  Материал не найден
                </div>
              )}
            </div>
            <Input
              type="number"
              value={material.quantity}
              onChange={(e) => updateMaterial(index, "quantity", parseFloat(e.target.value) || 0)}
              className="h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeMaterial(index)}
              className="h-9 w-9 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMaterial}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Добавить материал
      </Button>
    </div>
  );
}
