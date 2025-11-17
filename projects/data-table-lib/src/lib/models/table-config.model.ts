import { ColumnDefinition } from './column-definition.model';
import { FilterOperator } from './filter-operator.model';
import { Sort } from '@angular/material/sort';

export interface PaginationConfig {
  enabled: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  showFirstLastButtons?: boolean;
}

export interface GroupingConfig {
  enabled: boolean;
  defaultGroupByColumns?: string[];
  expandAllByDefault?: boolean;
}

export interface SortingConfig {
  enabled: boolean;
  defaultSort?: {
    active: string;
    direction: 'asc' | 'desc';
  };
}

export interface FilteringConfig {
  enabled: boolean;
  globalSearchEnabled?: boolean;
  columnFiltersEnabled?: boolean;
  filterOperators?: FilterOperator[];
}

export interface SelectionConfig {
  enabled: boolean;
  multiSelect?: boolean;
  selectableRowPredicate?: (row: any) => boolean;
}

export type ExportFormat = 'csv' | 'xls' | 'xlsx';

export interface ExportConfig {
  enabled: boolean;
  fileName?: string;
  formats?: ExportFormat[];
  defaultFormat?: ExportFormat;
}

export interface ColumnVisibilityConfig {
  enabled: boolean;
  defaultVisibleColumns?: string[];
}

export interface TableConfig {
  columns: ColumnDefinition[];
  pagination?: PaginationConfig;
  grouping?: GroupingConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  selection?: SelectionConfig;
  export?: ExportConfig;
  columnVisibility?: ColumnVisibilityConfig;
  rowClassFunction?: (row: any, index: number) => string | string[] | { [key: string]: boolean };
}

