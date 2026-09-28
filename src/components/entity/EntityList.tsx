import { useState, useMemo, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, Table2, Kanban, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { EntityTableView } from "./EntityTableView";
import { EntityCardView } from "./EntityCardView";
import { EntityKanbanView } from "./EntityKanbanView";
import { EntityFilters, ActiveFilters } from "./EntityFilters";
import { EntityListConfig, ViewMode, FilterValue, PaginationConfig } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

interface EntityListProps<T> {
  items: T[];
  config: EntityListConfig<T>;
  emptyMessage?: string;
  kanbanGroupField?: string;
  kanbanColumns?: { value: string; label: string }[];
  defaultViewMode?: ViewMode;
  initialFilters?: FilterValue[];
  pagination?: PaginationConfig;
  /** Заголовок печатной версии списка (что видно на экране). По умолчанию "Список". */
  printTitle?: string;
  /**
   * Вызывается с задержкой при изменении строки поиска.
   * Нужен страницам с серверной пагинацией: поиск и фильтры работают по
   * массиву `items`, поэтому пока строка непустая страница должна подставлять
   * полный список — иначе совпадения ищутся только внутри текущей страницы.
   */
  onSearchChange?: (query: string) => void;
}

const SEARCH_NOTIFY_DEBOUNCE_MS = 300;

export function EntityList<T>({ items, config, emptyMessage = "Нет данных", kanbanGroupField, kanbanColumns, defaultViewMode = 'card', initialFilters = [], pagination, onSearchChange, printTitle }: EntityListProps<T>) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterValue[]>(initialFilters);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrintList = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle || "Список",
  });

  // На мобильных по умолчанию карточный вид
  useEffect(() => {
    if (isMobile && viewMode === 'table') {
      setViewMode('card');
    }
  }, [isMobile]);

  // Сообщаем родителю строку поиска (с задержкой, чтобы не дёргать запросы
  // на каждое нажатие клавиши)
  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => onSearchChange(searchQuery), SEARCH_NOTIFY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange]);

  // Фильтрация и поиск
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Поиск по всем полям
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        return config.fields.some(field => {
          if (field.searchable === false) return false;
          const value = field.getValue ? field.getValue(item) : (item as any)[field.key];
          return String(value || '').toLowerCase().includes(query);
        });
      });
    }

    // Фильтрация
    filters.forEach(filter => {
      if (!filter.value) return;
      result = result.filter(item => {
        const field = config.fields.find(f => f.key === filter.field);
        if (!field) return true;
        const value = field.getValue ? field.getValue(item) : (item as any)[field.key];
        return String(value || '').toLowerCase().includes(filter.value.toLowerCase());
      });
    });

    // Сортировка
    if (sortField) {
      result.sort((a, b) => {
        const field = config.fields.find(f => f.key === sortField);
        if (!field) return 0;
        
        const aValue = field.getValue ? field.getValue(a) : (a as any)[sortField];
        const bValue = field.getValue ? field.getValue(b) : (b as any)[sortField];
        
        if (aValue === bValue) return 0;
        const comparison = aValue > bValue ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [items, searchQuery, filters, sortField, sortDirection, config.fields]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => {
      const existing = prev.find(f => f.field === field);
      if (existing) {
        if (!value) {
          return prev.filter(f => f.field !== field);
        }
        return prev.map(f => f.field === field ? { ...f, value } : f);
      }
      return value ? [...prev, { field, value }] : prev;
    });
  };

  // Фильтрация только для select полей
  const filterableFields = config.fields.filter(f => f.filterable !== false && f.type === 'select' && f.options);

  return (
    <div className="space-y-4 min-w-0">
      {/* Панель управления - поиск 2/3, фильтры 1/3, кнопки видов */}
      <div className="flex items-center gap-3">
        {/* Поиск - 2/3 */}
        <div className="relative flex-[2] min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={config.searchPlaceholder || "Поиск..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Фильтры - 1/3 */}
        {filterableFields.length > 0 && (
          <div className="flex-1 min-w-0">
            <EntityFilters
              fields={filterableFields}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        {/* Переключатели видов */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <Table2 className="h-4 w-4" />
          </Button>
          {kanbanGroupField && kanbanColumns && (
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('kanban')}
            >
              <Kanban className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePrintList()}
            disabled={filteredItems.length === 0}
            title="Печать списка"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Активные фильтры */}
      {filterableFields.length > 0 && (
        <ActiveFilters
          fields={filterableFields}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Список */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {emptyMessage}
        </div>
      ) : viewMode === 'table' ? (
        <EntityTableView
          items={filteredItems}
          config={config}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      ) : viewMode === 'kanban' && kanbanGroupField && kanbanColumns ? (
        <EntityKanbanView
          items={filteredItems}
          config={config}
          groupByField={kanbanGroupField}
          columns={kanbanColumns}
        />
      ) : (
        <EntityCardView
          items={filteredItems}
          config={config}
        />
      )}

      {/* Печатная версия списка (скрыта, используется только при печати) */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', fontSize: '8pt', color: 'black', background: 'white', padding: '10mm' }}>
          <h1 style={{ fontSize: '12pt', margin: '0 0 1mm 0' }}>{printTitle || 'Список'}</h1>
          <p style={{ fontSize: '8pt', color: '#666', margin: '0 0 3mm 0' }}>
            {new Date().toLocaleDateString('ru-RU')} · {filteredItems.length} записей
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f3f3' }}>
                {config.fields.map(field => (
                  <th key={field.key} style={{ border: '0.5pt solid #999', padding: '1mm', textAlign: 'left' }}>
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const id = config.getItemId(item);
                return (
                  <tr key={id}>
                    {config.fields.map(field => {
                      const value = field.getValue ? field.getValue(item) : (item as any)[field.key];
                      return (
                        <td key={field.key} style={{ border: '0.5pt solid #999', padding: '1mm' }}>
                          {field.render ? field.render(value, item) : String(value ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {pagination && pagination.totalCount > pagination.pageSize && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            {pagination.page * pagination.pageSize + 1}–{Math.min((pagination.page + 1) * pagination.pageSize, pagination.totalCount)} из {pagination.totalCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={(pagination.page + 1) * pagination.pageSize >= pagination.totalCount}
            >
              Вперёд
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
