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

  // Different colors for different filter types on mobile
  const getFilterColor = (index: number, hasValue: boolean) => {
    const colors = [
      { bg: 'bg-blue-500/20', text: 'text-blue-600', activeBg: 'bg-blue-500', activeText: 'text-white' },
      { bg: 'bg-purple-500/20', text: 'text-purple-600', activeBg: 'bg-purple-500', activeText: 'text-white' },
      { bg: 'bg-orange-500/20', text: 'text-orange-600', activeBg: 'bg-orange-500', activeText: 'text-white' },
      { bg: 'bg-green-500/20', text: 'text-green-600', activeBg: 'bg-green-500', activeText: 'text-white' },
      { bg: 'bg-rose-500/20', text: 'text-rose-600', activeBg: 'bg-rose-500', activeText: 'text-white' },
    ];
    const color = colors[index % colors.length];
    return hasValue 
      ? `${color.activeBg} ${color.activeText}` 
      : `${color.bg} ${color.text}`;
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {selectFields.map((field, index) => {
        const currentValue = filters.find(f => f.field === field.key)?.value || '';
        const displayValue = getDisplayValue(field, currentValue);
        const abbreviation = getAbbreviation(field.label);
        const hasValue = !!currentValue;

        if (field.options) {
          return (
            <div key={field.key} className="flex-1 min-w-0">
              <Select
                value={currentValue || "__all__"}
                onValueChange={(value) => onFilterChange(field.key, value === "__all__" ? "" : value)}
              >
                <SelectTrigger className="h-9 sm:px-3 px-2">
                  <span className="hidden sm:inline truncate">
                    {currentValue ? (field.options?.find(o => o.value === currentValue)?.label || currentValue) : field.label}
                  </span>
                  <span 
                    className={`sm:hidden text-[10px] font-bold leading-none rounded-full w-5 h-5 flex items-center justify-center ${getFilterColor(index, hasValue)}`} 
                    title={displayValue}
                  >
                    {currentValue ? getAbbreviation(displayValue) : abbreviation}
                  </span>
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
