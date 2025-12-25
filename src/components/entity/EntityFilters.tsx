import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { EntityField, FilterValue } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

interface EntityFiltersProps {
  fields: EntityField[];
  filters: FilterValue[];
  onFilterChange: (field: string, value: string) => void;
}

export function EntityFilters({ fields, filters, onFilterChange }: EntityFiltersProps) {
  const isMobile = useIsMobile();
  const selectFields = fields.filter(f => f.type === 'select' && f.options);

  if (selectFields.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      {selectFields.map(field => {
        const currentValue = filters.find(f => f.field === field.key)?.value || '';
        const selectedOption = field.options?.find(o => o.value === currentValue);
        const SelectedIcon = selectedOption?.icon;
        // Get first icon from options as default placeholder icon
        const PlaceholderIcon = field.options?.[0]?.icon;

        if (field.options) {
          return (
            <div key={field.key} className="flex-1 min-w-0">
              <Select
                value={currentValue || "__all__"}
                onValueChange={(value) => onFilterChange(field.key, value === "__all__" ? "" : value)}
              >
                <SelectTrigger className="h-9">
                  {isMobile ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      {currentValue && SelectedIcon ? (
                        <>
                          <SelectedIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{selectedOption?.label}</span>
                        </>
                      ) : (
                        <>
                          {PlaceholderIcon ? (
                            <PlaceholderIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate text-muted-foreground">{field.label}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <SelectValue placeholder={field.label} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Все {field.label}</SelectItem>
                  {field.options.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4 shrink-0" />}
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
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

        const option = field.options?.find(o => o.value === filter.value);
        const Icon = option?.icon;
        const displayValue = option?.label || filter.value;

        return (
          <Badge key={filter.field} variant="secondary" className="gap-1.5">
            {Icon && <Icon className="h-3 w-3" />}
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
