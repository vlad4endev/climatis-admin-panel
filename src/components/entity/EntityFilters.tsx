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
  const activeFilters = filters.filter(f => f.value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {fields.map(field => {
          const currentValue = filters.find(f => f.field === field.key)?.value || '';

          if (field.type === 'select' && field.options) {
            return (
              <div key={field.key} className="min-w-[150px]">
                <Select
                  value={currentValue}
                  onValueChange={(value) => onFilterChange(field.key, value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={field.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все {field.label}</SelectItem>
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

          return (
            <Input
              key={field.key}
              placeholder={`Фильтр: ${field.label}`}
              value={currentValue}
              onChange={(e) => onFilterChange(field.key, e.target.value)}
              className="h-9 w-[200px]"
            />
          );
        })}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Активные фильтры:</span>
          {activeFilters.map(filter => {
            const field = fields.find(f => f.key === filter.field);
            if (!field) return null;

            let displayValue = filter.value;
            if (field.type === 'select' && field.options) {
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
      )}
    </div>
  );
}
