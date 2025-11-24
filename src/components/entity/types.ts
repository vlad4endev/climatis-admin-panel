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
}

export interface EntityListConfig<T = any> {
  fields: EntityField<T>[];
  getItemId: (item: T) => string;
  onUpdate?: (id: string, field: string, value: any) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: T) => void;
}

export type ViewMode = 'table' | 'card';

export interface FilterValue {
  field: string;
  value: string;
}
