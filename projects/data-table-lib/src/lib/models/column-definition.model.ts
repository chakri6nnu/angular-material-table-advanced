export interface ColumnDefinition {
  field: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  resizable?: boolean;
  sticky?: 'left' | 'right' | boolean;
  visible?: boolean;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string;
  cellTemplate?: string; // Template reference name for custom cell template
  cellClassFunction?: (row: any, value: any, column: ColumnDefinition, index: number) => string | string[] | { [key: string]: boolean };
  cellValueFunction?: (row: any, value: any, column: ColumnDefinition, index: number) => any; // Transform cell value conditionally
}

