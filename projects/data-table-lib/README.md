# Data Table Library

A powerful, feature-rich Angular data table component built with Angular Material. This library provides a comprehensive table solution with sorting, filtering, pagination, grouping, selection, and export capabilities.

![Data Table Demo](./demo.jpg)

## Features

### Core Features
- ✅ **Sorting** - Multi-column sorting with visual indicators
- ✅ **Filtering** - Global search and column-specific filters with multiple operators
- ✅ **Pagination** - Configurable page sizes with "Show All" option
- ✅ **Grouping** - Multi-level row grouping with expand/collapse
- ✅ **Selection** - Single and multi-row selection with selectable row predicates
- ✅ **Export** - Export to CSV, XLS, and XLSX formats
- ✅ **Column Management** - Show/hide columns, resizable columns, sticky columns
- ✅ **Custom Cell Templates** - Render custom content in cells
- ✅ **Conditional Row Styling** - Apply custom CSS classes based on row data
- ✅ **Performance Optimized** - Efficient rendering with change detection strategies

### Filter Operators
- Contains
- Equals
- Starts with
- Ends with
- Does not contain
- Does not equal

## Installation

### Install Dependencies

```bash
npm install @angular/material @angular/cdk
npm install xlsx
npm install --save-dev @types/xlsx
```

### Build the Library

```bash
ng build data-table-lib
```

## Quick Start

### 1. Import the Component

```typescript
import { Component, OnInit } from '@angular/core';
import { DataTableComponent } from 'data-table-lib';
import { TableConfig } from 'data-table-lib';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [DataTableComponent],
  templateUrl: './example.component.html'
})
export class ExampleComponent implements OnInit {
  tableConfig: TableConfig = {
    columns: [
      { field: 'id', label: 'ID', width: '80px', sortable: true },
      { field: 'name', label: 'Name', width: '200px', sortable: true, filterable: true },
      { field: 'email', label: 'Email', width: '250px', sortable: true, filterable: true },
    ],
    pagination: {
      enabled: true,
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100]
    },
    sorting: { enabled: true },
    filtering: {
      enabled: true,
      globalSearchEnabled: true,
      columnFiltersEnabled: true
    },
    selection: {
      enabled: true,
      multiSelect: true
    },
    export: {
      enabled: true,
      formats: ['csv', 'xlsx', 'xls'],
      fileName: 'data-export'
    }
  };

  tableData: any[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  ngOnInit() {
    // Load your data here
  }
}
```

### 2. Use in Template

```html
<lib-data-table
  [config]="tableConfig"
  [data]="tableData"
  (selectionChange)="onSelectionChange($event)"
  (rowClick)="onRowClick($event)"
  (sortChange)="onSortChange($event)"
  (pageChange)="onPageChange($event)"
></lib-data-table>
```

## Configuration

### TableConfig Interface

```typescript
interface TableConfig {
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
```

### ColumnDefinition

```typescript
interface ColumnDefinition {
  field: string;                    // Required: Data field name
  label: string;                    // Required: Column header label
  sortable?: boolean;               // Enable sorting (default: false)
  filterable?: boolean;             // Enable filtering (default: false)
  width?: string | number;         // Column width (e.g., '200px', 200)
  minWidth?: string | number;      // Minimum column width
  maxWidth?: string | number;      // Maximum column width
  resizable?: boolean;             // Allow column resizing
  sticky?: 'left' | 'right' | boolean; // Sticky column
  visible?: boolean;                // Column visibility (default: true)
  align?: 'left' | 'right' | 'center'; // Text alignment
  format?: (value: any) => string; // Custom value formatter
  cellTemplate?: string;           // Custom cell template reference name
}
```

### PaginationConfig

```typescript
interface PaginationConfig {
  enabled: boolean;
  defaultPageSize?: number;        // Default: 10
  pageSizeOptions?: number[];       // Default: [5, 10, 25, 50, 100]
  showFirstLastButtons?: boolean;  // Default: true
}
```

### GroupingConfig

```typescript
interface GroupingConfig {
  enabled: boolean;
  defaultGroupByColumns?: string[]; // Columns to group by initially
  expandAllByDefault?: boolean;     // Expand all groups on load
}
```

### SortingConfig

```typescript
interface SortingConfig {
  enabled: boolean;
  defaultSort?: {
    active: string;                // Column field to sort by
    direction: 'asc' | 'desc';     // Sort direction
  };
}
```

### FilteringConfig

```typescript
interface FilteringConfig {
  enabled: boolean;
  globalSearchEnabled?: boolean;    // Enable global search box
  columnFiltersEnabled?: boolean;  // Enable column-specific filters
  filterOperators?: FilterOperator[]; // Custom filter operators
}
```

### SelectionConfig

```typescript
interface SelectionConfig {
  enabled: boolean;
  multiSelect?: boolean;            // Allow multiple selection
  selectableRowPredicate?: (row: any) => boolean; // Custom selectable logic
}
```

### ExportConfig

```typescript
interface ExportConfig {
  enabled: boolean;
  fileName?: string;               // Export file name (without extension)
  formats?: ExportFormat[];        // Available formats: ['csv', 'xlsx', 'xls']
  defaultFormat?: ExportFormat;     // Default export format
}

type ExportFormat = 'csv' | 'xls' | 'xlsx';
```

### ColumnVisibilityConfig

```typescript
interface ColumnVisibilityConfig {
  enabled: boolean;
  defaultVisibleColumns?: string[]; // Columns visible by default
}
```

## Advanced Usage

### Custom Cell Templates

```typescript
import { Component, ViewChild, TemplateRef } from '@angular/core';

export class MyComponent {
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;
  cellTemplates = new Map<string, TemplateRef<any>>();

  ngOnInit() {
    this.cellTemplates.set('statusCell', this.statusCellTemplate);
  }

  tableConfig: TableConfig = {
    columns: [
      {
        field: 'status',
        label: 'Status',
        cellTemplate: 'statusCell' // Reference to template
      }
    ]
  };
}
```

```html
<ng-template #statusCellTemplate let-row let-value="value">
  <span [class]="'status-' + value">{{ value }}</span>
</ng-template>

<lib-data-table
  [config]="tableConfig"
  [data]="tableData"
  [cellTemplates]="cellTemplates"
></lib-data-table>
```

### Conditional Row Classes

```typescript
tableConfig: TableConfig = {
  columns: [...],
  rowClassFunction: (row: any, index: number) => {
    const classes: { [key: string]: boolean } = {};
    
    if (row.status === 'active') {
      classes['row-active'] = true;
    }
    if (row.priority === 'high') {
      classes['row-high-priority'] = true;
    }
    
    return classes;
  }
};
```

### Custom Selectable Row Logic

```typescript
tableConfig: TableConfig = {
  columns: [...],
  selection: {
    enabled: true,
    multiSelect: true,
    selectableRowPredicate: (row: any) => {
      // Only allow selection of rows with status 'pending'
      return row.status === 'pending';
    }
  }
};
```

### Using Data Service

```typescript
import { Observable } from 'rxjs';

export class MyComponent {
  dataService$: Observable<any>;

  constructor(private http: HttpClient) {
    this.dataService$ = this.http.get('/api/data');
  }
}
```

```html
<lib-data-table
  [config]="tableConfig"
  [dataService]="dataService$"
></lib-data-table>
```

## Events

### selectionChange
Emitted when row selection changes.

```typescript
onSelectionChange(selected: any[]) {
  console.log('Selected rows:', selected);
}
```

### rowClick
Emitted when a row is clicked.

```typescript
onRowClick(row: any) {
  console.log('Row clicked:', row);
}
```

### sortChange
Emitted when sorting changes.

```typescript
import { Sort } from '@angular/material/sort';

onSortChange(sort: Sort) {
  console.log('Sort changed:', sort.active, sort.direction);
}
```

### pageChange
Emitted when pagination changes.

```typescript
import { PageEvent } from '@angular/material/paginator';

onPageChange(event: PageEvent) {
  console.log('Page:', event.pageIndex, 'Size:', event.pageSize);
}
```

## Complete Example

```typescript
import { Component, OnInit } from '@angular/core';
import { DataTableComponent } from 'data-table-lib';
import { TableConfig } from 'data-table-lib';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'app-data-table-example',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <lib-data-table
      [config]="tableConfig"
      [data]="tableData"
      (selectionChange)="onSelectionChange($event)"
      (rowClick)="onRowClick($event)"
      (sortChange)="onSortChange($event)"
      (pageChange)="onPageChange($event)"
    ></lib-data-table>
  `
})
export class DataTableExampleComponent implements OnInit {
  tableConfig: TableConfig = {
    columns: [
      {
        field: 'id',
        label: 'ID',
        width: '80px',
        sortable: true
      },
      {
        field: 'name',
        label: 'Name',
        width: '200px',
        sortable: true,
        filterable: true
      },
      {
        field: 'email',
        label: 'Email',
        width: '250px',
        sortable: true,
        filterable: true
      },
      {
        field: 'status',
        label: 'Status',
        width: '120px',
        sortable: true,
        filterable: true
      }
    ],
    pagination: {
      enabled: true,
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100],
      showFirstLastButtons: true
    },
    grouping: {
      enabled: true,
      defaultGroupByColumns: [],
      expandAllByDefault: true
    },
    sorting: {
      enabled: true,
      defaultSort: {
        active: 'id',
        direction: 'asc'
      }
    },
    filtering: {
      enabled: true,
      globalSearchEnabled: true,
      columnFiltersEnabled: true
    },
    selection: {
      enabled: true,
      multiSelect: true
    },
    export: {
      enabled: true,
      formats: ['csv', 'xlsx', 'xls'],
      fileName: 'data-export'
    },
    columnVisibility: {
      enabled: true
    },
    rowClassFunction: (row: any, index: number) => {
      return {
        'row-active': row.status === 'active',
        'row-inactive': row.status === 'inactive'
      };
    }
  };

  tableData: any[] = [];

  ngOnInit() {
    // Load your data
    this.tableData = [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    ];
  }

  onSelectionChange(selected: any[]) {
    console.log('Selected:', selected);
  }

  onRowClick(row: any) {
    console.log('Clicked:', row);
  }

  onSortChange(sort: Sort) {
    console.log('Sort:', sort);
  }

  onPageChange(event: PageEvent) {
    console.log('Page:', event);
  }
}
```

## Styling

The component uses Angular Material theming. You can customize styles by:

1. Overriding Material theme variables
2. Using component-specific CSS classes
3. Using the `rowClassFunction` for conditional row styling

### Available CSS Classes

- `.selected-row` - Applied to selected rows
- `.row-disabled` - Applied to disabled rows
- `.duplicate-row` - Applied to duplicate rows
- `.group-row` - Applied to group header rows
- Custom classes from `rowClassFunction`

## Building

To build the library:

```bash
ng build data-table-lib
```

The build artifacts will be in the `dist/data-table-lib` directory.

## Publishing

To publish the library to npm:

```bash
cd dist/data-table-lib
npm publish
```

## Requirements

- Angular 19+
- Angular Material 19+
- Angular CDK 19+
- xlsx library (for Excel export)

## Browser Support

Supports all modern browsers that support Angular 19+.

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the GitHub issue tracker.
