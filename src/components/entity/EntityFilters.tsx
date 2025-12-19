import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { EntityField, FilterValue } from "./types";

interface EntityFiltersProps {
  fields: EntityField[];
  filters: FilterValue[];
  onFilterChange: (field: string, value: string) => void;
}

export function EntityFilters({ fields, filters, onFilterChange }: EntityFiltersProps) {
  const selectFields = fields.filter(f => f.type === 'select' && f.options);

  if (selectFields.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-nowrap">
      {selectFields.map(field => {
        const currentValue = filters.find(f => f.field === field.key)?.value || '';

        if (field.options) {
          return (
            <div key={field.key} className="min-w-[120px]">
              <Select
                value={currentValue || "__all__"}
                onValueChange={(value) => onFilterChange(field.key, value === "__all__" ? "" : value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={field.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Все {field.label}</SelectItem>
                  {field.options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

interface ActiveFiltersProps {
  fields: EntityField[];
  filters: FilterValue[];
  onFilterChange: (field: string, value: string) => void;
}

export function ActiveFilters({ fields, filters, onFilterChange }: ActiveFiltersProps) {
  const selectFields = fields.filter(f => f.type === 'select' && f.options);
  const activeFilters = filters.filter(f => f.value);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Фильтры:</span>
      {activeFilters.map(filter => {
        const field = selectFields.find(f => f.key === filter.field);
        if (!field) return null;

        let displayValue = filter.value;
        if (field.options) {
          const option = field.options.find(o => o.value === filter.value);
          if (option) displayValue = option.label;
        }

        return (
          <Badge key={filter.field} variant="secondary" className="gap-1">
            {field.label}: {displayValue}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onFilterChange(filter.field, '')}
            />
          </Badge>
        );
      })}
    </div>
  );
}
