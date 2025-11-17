import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from 'data-table-lib';
import { TableConfig } from 'data-table-lib';
import { CarTableDataService } from './car-table-data.service';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild('colorCellTemplate', { static: true })
  colorCellTemplate!: TemplateRef<any>;

  title = 'Grid Grouping - Using Data Table Library';

  cellTemplates = new Map<string, TemplateRef<any>>();

  tableConfig: TableConfig = {
    columns: [
      {
        field: 'id',
        label: 'ID',
        width: '80px',
        sortable: true,
        filterable: false,
      },
      {
        field: 'vin',
        label: 'VIN',
        width: '200px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'brand',
        label: 'Brand',
        width: '150px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'year',
        label: 'Year',
        width: '100px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'color',
        label: 'Color',
        width: '120px',
        sortable: true,
        filterable: true,
        cellTemplate: 'colorCell',
      },
    ],
    pagination: {
      enabled: true,
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100, 200],
      showFirstLastButtons: true,
    },
    grouping: {
      enabled: true,
      defaultGroupByColumns: [],
      expandAllByDefault: true,
    },
    sorting: {
      enabled: true,
    },
    filtering: {
      enabled: true,
      globalSearchEnabled: true,
      columnFiltersEnabled: true,
    },
    selection: {
      enabled: true,
      multiSelect: true,
    },
    export: {
      enabled: true,
      formats: ['csv', 'xlsx', 'xls'],
      fileName: 'cars-data',
    },
    columnVisibility: {
      enabled: true,
    },
  };

  tableData: any[] = [];

  constructor(private dataService: CarTableDataService) {}

  ngOnInit() {
    // Setup cell templates map
    if (this.colorCellTemplate) {
      this.cellTemplates.set('colorCell', this.colorCellTemplate);
    }

    this.dataService.getAllData().subscribe({
      next: (data: any) => {
        this.tableData = data.data.map((item: any, index: number) => ({
          ...item,
          id: index + 1,
        }));
      },
      error: (err: any) => console.error('Error loading data:', err),
    });
  }

  onSelectionChange(selected: any[]) {
    console.log('Selection changed:', selected);
  }

  onRowClick(row: any) {
    console.log('Row clicked:', row);
  }

  onSortChange(sort: Sort) {
    console.log('Sort changed:', sort);
  }

  onPageChange(event: PageEvent) {
    console.log('Page changed:', event);
  }
}
