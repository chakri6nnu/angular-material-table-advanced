import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from 'data-table-lib';
import { TableConfig } from 'data-table-lib';
import { CarTableDataService } from '../car-table-data.service';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'app-test-table',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.scss']
})
export class TestTableComponent implements OnInit {
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
      },
    ],
    pagination: {
      enabled: true,
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    grouping: {
      enabled: true,
      defaultGroupByColumns: ['brand'],
      expandAllByDefault: true,
    },
    sorting: {
      enabled: true,
      defaultSort: {
        active: 'id',
        direction: 'asc',
      },
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
      fileName: 'cars-export.csv',
    },
    columnVisibility: {
      enabled: true,
      defaultVisibleColumns: ['id', 'vin', 'brand', 'year', 'color'],
    },
  };

  tableData: any[] = [];

  constructor(private dataService: CarTableDataService) {}

  ngOnInit() {
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
