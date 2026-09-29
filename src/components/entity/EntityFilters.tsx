import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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

  const getAbbreviation = (label: string) => {
    return label.charAt(0).toUpperCase();
  };

  const getDisplayValue = (field: EntityField, currentValue: string) => {
    if (!currentValue) {
      return field.label;
    }
    const option = field.options?.find(o => o.value === currentValue);
    return option?.label || field.label;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {selectFields.map(field => {
        const currentValue = filters.find(f => f.field === field.key)?.value || '';
        const displayValue = getDisplayValue(field, currentValue);
        const abbreviation = getAbbreviation(field.label);

        if (field.options) {
          const isActive = !!currentValue;
          return (
            <div key={field.key} className="min-w-[140px] flex-1 basis-[140px]">
              <Select
                value={currentValue || "__all__"}
                onValueChange={(value) => onFilterChange(field.key, value === "__all__" ? "" : value)}
              >
                {/* Desktop version */}
                <SelectTrigger
                  className={`h-9 px-3 hidden sm:flex ${isActive ? "border-primary/50 bg-primary/5 text-foreground" : "text-muted-foreground"}`}
                >
                  <span className="truncate">
                    {currentValue ? (field.options?.find(o => o.value === currentValue)?.label || currentValue) : field.label}
                  </span>
                </SelectTrigger>
                {/* Mobile version - custom button without chevron */}
                <SelectPrimitive.Trigger
                  className={`h-8 w-full flex sm:hidden items-center justify-center rounded-md border ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-2 text-xs font-bold uppercase ${isActive ? "border-primary/50 bg-primary/5 text-foreground" : "border-input bg-background text-muted-foreground"}`}
                  title={displayValue}
                >
                  {abbreviation}
                </SelectPrimitive.Trigger>
                <SelectContent>
                  <SelectItem value="__all__">Все</SelectItem>
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
