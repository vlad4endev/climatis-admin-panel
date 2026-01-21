import { LucideIcon } from "lucide-react";

export interface EntityField<T = any> {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'date' | 'textarea';
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  searchable?: boolean;
  options?: { value: string; label: string }[];
  render?: (value: any, item: T) => React.ReactNode;
  getValue?: (item: T) => any;
  cellClassName?: (item: T) => string;
}

export interface CardAction<T = any> {
  icon: LucideIcon;
  label: string;
  onClick: (item: T, e: React.MouseEvent) => void;
  disabled?: boolean | ((item: T) => boolean);
}

export interface EntityListConfig<T = any> {
  fields: EntityField<T>[];
  getItemId: (item: T) => string;
  onUpdate?: (id: string, field: string, value: any) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: T) => void;
  onRowClick?: (item: T) => void;
  customActions?: (item: T) => React.ReactNode;
  cardActions?: CardAction<T>[];
  searchPlaceholder?: string;
  cardFooter?: (item: T) => React.ReactNode;
}

export type ViewMode = 'table' | 'card' | 'kanban';

export interface FilterValue {
  field: string;
  value: string;
}
