import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  ContentChildren,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuTrigger } from '@angular/material/menu';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, Observable } from 'rxjs';
import { Group } from '../../models/group.model';
import { TableConfig, PaginationConfig, GroupingConfig, SortingConfig, FilteringConfig, SelectionConfig } from '../../models/table-config.model';
import { ColumnDefinition } from '../../models/column-definition.model';
import { DEFAULT_FILTER_OPERATORS, FilterOperator } from '../../models/filter-operator.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'lib-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DataTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Input() config!: TableConfig;
  @Input() data: any[] = [];
  @Input() dataService?: Observable<any>;
  @Input() cellTemplates?: Map<string, TemplateRef<any>>;

  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  public dataSource = new MatTableDataSource<any | Group>([]);
  _alldata: any[] = [];
  _originalData: any[] = [];
  columns: ColumnDefinition[] = [];
  displayedColumns: string[] = [];
  groupByColumns: string[] = [];
  private groupMap = new Map<string, Group>();
  private groupExpandedStates = new Map<string, boolean>();

  // Search/Filter
  searchText: string = '';
  columnFilters: { [key: string]: { operator: string; value: string } } = {};
  filterOperators: FilterOperator[] = DEFAULT_FILTER_OPERATORS;

  // Performance optimizations
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private filteredDataCache: any[] | null = null;
  private filterCacheKey: string = '';

  // Selection
  selection = new SelectionModel<any>(true, []);
  selectAllChecked = false;
  selectAllIndeterminate = false;
  selectableRowCount = 0;
  actionStatusMessage = '';

  // Pagination
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100, 200];
  pageIndex = 0;
  totalDataRows = 0;
  showAllRows = false;

  // Column visibility
  columnVisibility: { [key: string]: boolean } = {};
  
  // Memoized values for template performance
  private _groupByColumnsSet: Set<string> = new Set();

  constructor(private cdr: ChangeDetectorRef) {
    // Setup debounced search
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilter();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.initializeFromConfig();
    
    if (this.dataService) {
      this.dataService.subscribe({
        next: (data: any) => {
          const dataArray = Array.isArray(data) ? data : (data?.data || []);
          dataArray.forEach((item: any, index: number) => {
            if (!item.id) {
              item.id = index + 1;
            }
          });
          this._originalData = dataArray;
          this._alldata = [...dataArray];
          this.updateDataSource();
        },
        error: (err: any) => console.error('Data service error:', err),
      });
    } else if (this.data && this.data.length > 0) {
      this.data.forEach((item: any, index: number) => {
        if (!item.id) {
          item.id = index + 1;
        }
      });
      this._originalData = [...this.data];
      this._alldata = [...this.data];
      this.updateDataSource();
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      if (item instanceof Group) {
        return '';
      }
      return item[property];
    };
  }

  private initializeFromConfig() {
    if (!this.config) {
      throw new Error('TableConfig is required');
    }

    this.columns = this.config.columns || [];
    
    // Initialize column visibility
    this.columns.forEach((col) => {
      const defaultVisible = this.config.columnVisibility?.defaultVisibleColumns 
        ? this.config.columnVisibility.defaultVisibleColumns.includes(col.field)
        : (col.visible !== false);
      this.columnVisibility[col.field] = defaultVisible;
      this.columnFilters[col.field] = { operator: 'contains', value: '' };
    });

    // Initialize filter operators
    if (this.config.filtering?.filterOperators) {
      this.filterOperators = this.config.filtering.filterOperators;
    }

    // Initialize pagination
    if (this.config.pagination?.enabled) {
      this.pageSize = this.config.pagination.defaultPageSize || 10;
      this.pageSizeOptions = this.config.pagination.pageSizeOptions || [5, 10, 25, 50, 100];
    }

    // Initialize grouping
    if (this.config.grouping?.enabled && this.config.grouping.defaultGroupByColumns) {
      this.groupByColumns = [...this.config.grouping.defaultGroupByColumns];
      this._groupByColumnsSet = new Set(this.groupByColumns);
      if (this.config.grouping.expandAllByDefault) {
        // Will be set when groups are created
      }
    }

    // Initialize sorting
    if (this.config.sorting?.enabled && this.config.sorting.defaultSort) {
      setTimeout(() => {
        if (this.sort) {
          this.sort.active = this.config.sorting!.defaultSort!.active;
          this.sort.direction = this.config.sorting!.defaultSort!.direction;
          this.sortData({
            active: this.sort.active,
            direction: this.sort.direction,
          });
        }
      }, 0);
    }

    this.updateDisplayedColumns();
  }

  private updateDisplayedColumns() {
    const baseColumns: string[] = [];
    
    if (this.config.selection?.enabled) {
      baseColumns.push('select');
    }
    
    baseColumns.push(
      ...this.columns
        .filter((col) => this.columnVisibility[col.field] !== false)
        .map((col) => col.field)
    );
    
    if (this.groupByColumns.length > 0) {
      this.displayedColumns = ['group', ...baseColumns];
    } else {
      this.displayedColumns = baseColumns;
    }
  }

  getTotalColumnCount(): number {
    return this.displayedColumns.length;
  }

  private getFilterCacheKey(): string {
    const searchKey = this.searchText?.toLowerCase().trim() || '';
    const filterKey = JSON.stringify(this.columnFilters);
    return `${searchKey}|${filterKey}`;
  }

  private applyFilters(data: any[]): any[] {
    if (!this.config.filtering?.enabled) {
      return data;
    }

    const cacheKey = this.getFilterCacheKey();
    if (this.filteredDataCache && this.filterCacheKey === cacheKey) {
      return this.filteredDataCache;
    }

    let filteredData = data;

    // Apply global search filter
    if (this.config.filtering.globalSearchEnabled) {
      const searchLower = this.searchText?.toLowerCase().trim();
      if (searchLower) {
        filteredData = filteredData.filter((item) => {
          for (let i = 0; i < this.columns.length; i++) {
            const col = this.columns[i];
            const value = String(item[col.field] || '').toLowerCase();
            if (value.includes(searchLower)) {
              return true;
            }
          }
          return false;
        });
      }
    }

    // Apply column-specific filters
    if (this.config.filtering.columnFiltersEnabled) {
      const hasColumnFilters = Object.values(this.columnFilters).some(
        (filter) => filter?.value?.trim()
      );
      if (hasColumnFilters) {
        filteredData = filteredData.filter((item) => {
          for (let i = 0; i < this.columns.length; i++) {
            const col = this.columns[i];
            const filter = this.columnFilters[col.field];
            if (!filter?.value?.trim()) {
              continue;
            }
            const itemValue = String(item[col.field] || '').toLowerCase();
            const filterLower = filter.value.toLowerCase().trim();
            const operator = filter.operator || 'contains';

            let matches = false;
            switch (operator) {
              case 'equals':
                matches = itemValue === filterLower;
                break;
              case 'contains':
                matches = itemValue.includes(filterLower);
                break;
              case 'startsWith':
                matches = itemValue.startsWith(filterLower);
                break;
              case 'endsWith':
                matches = itemValue.endsWith(filterLower);
                break;
              case 'notContains':
                matches = !itemValue.includes(filterLower);
                break;
              case 'notEquals':
                matches = itemValue !== filterLower;
                break;
              default:
                matches = itemValue.includes(filterLower);
            }
            if (!matches) {
              return false;
            }
          }
          return true;
        });
      }
    }

    this.filteredDataCache = filteredData;
    this.filterCacheKey = cacheKey;
    return filteredData;
  }

  private updateDataSource() {
    if (!this.config) return;

    const filteredData = this.applyFilters(this._alldata);
    this.totalDataRows = filteredData.length;

    let groupedData: any[] = [];
    if (this.config.grouping?.enabled && this.groupByColumns.length > 0) {
      groupedData = this.addGroups(filteredData, this.groupByColumns);
    } else {
      groupedData = filteredData;
    }

    if (this.totalDataRows === 0) {
      groupedData = [{ __noResults: true }];
    }

    if (this.config.pagination?.enabled && !this.showAllRows && this.pageSize > 0 && this.totalDataRows > 0) {
      const startIndex = this.pageIndex * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.dataSource.data = groupedData.slice(startIndex, endIndex);
    } else {
      this.dataSource.data = groupedData;
    }

    this.buildGroupMap();
    this.dataSource.filterPredicate = this.customFilterPredicate.bind(this);
    
    if (!this.dataSource.filter) {
      this.dataSource.filter = ' ';
    }
    
    this.updateSelectionState();
    this.cdr.markForCheck();
  }

  applyFilter() {
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  onSearchInput() {
    if (this.config.filtering?.globalSearchEnabled) {
      this.searchSubject$.next(this.searchText);
    }
  }

  clearFilter() {
    this.searchText = '';
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  onHeaderTitleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      target.closest('.grid-view-header-menu') ||
      target.closest('button') ||
      target.closest('mat-menu')
    ) {
      event.stopPropagation();
      return;
    }
  }

  onColumnFilterChange(column: ColumnDefinition, value: string) {
    if (!this.columnFilters[column.field]) {
      this.columnFilters[column.field] = { operator: 'contains', value: '' };
    }
    this.columnFilters[column.field].value = value;
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  onColumnFilterOperatorChange(column: ColumnDefinition, operator: string) {
    if (!this.columnFilters[column.field]) {
      this.columnFilters[column.field] = { operator: 'contains', value: '' };
    }
    this.columnFilters[column.field].operator = operator;
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  getColumnFilterOperator(column: ColumnDefinition): string {
    return this.columnFilters[column.field]?.operator || 'contains';
  }

  getFilterOperatorLabel(operator: string): string {
    const op = this.filterOperators.find((o) => o.value === operator);
    return op ? op.label : 'Contains';
  }

  getColumnFilterValue(column: ColumnDefinition): string {
    return this.columnFilters[column.field]?.value || '';
  }

  clearColumnFilter(column: ColumnDefinition) {
    this.columnFilters[column.field] = { operator: 'contains', value: '' };
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  clearAllColumnFilters() {
    this.columns.forEach((col) => {
      this.columnFilters[col.field] = { operator: 'contains', value: '' };
    });
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  hasColumnFilter(column: ColumnDefinition | null): boolean {
    if (!column || !column.field) {
      return Object.values(this.columnFilters).some(
        (filter) => filter && filter.value && filter.value.trim()
      );
    }
    return !!(
      this.columnFilters[column.field] &&
      this.columnFilters[column.field].value &&
      this.columnFilters[column.field].value.trim()
    );
  }

  groupBy(event: Event, column: ColumnDefinition) {
    if (!this.config.grouping?.enabled) return;
    
    event.stopPropagation();
    event.preventDefault();
    this.checkGroupByColumn(column.field, true);
    this.updateDisplayedColumns();
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  toggleGroupBy(event: Event, column: ColumnDefinition, menuTrigger?: MatMenuTrigger) {
    if (!this.config.grouping?.enabled) return;
    
    event.stopPropagation();
    event.preventDefault();
    const isGrouped = this._groupByColumnsSet.has(column.field);
    this.checkGroupByColumn(column.field, !isGrouped);
    this.updateDisplayedColumns();
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
    if (menuTrigger) {
      menuTrigger.closeMenu();
    }
  }

  sortData(sort: Sort) {
    if (!this.config.sorting?.enabled) return;

    this.sortChange.emit(sort);

    if (!sort.active || sort.direction === '') {
      this._alldata = [...this._originalData];
      this.filteredDataCache = null;
      this.filterCacheKey = '';
      this.updateDataSource();
      return;
    }

    const data = this._originalData.slice();
    const isAsc = sort.direction === 'asc';
    const sortKey = sort.active;
    
    data.sort((a, b) => {
      const valueA = a[sortKey];
      const valueB = b[sortKey];

      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * (isAsc ? 1 : -1);
      }

      return String(valueA).localeCompare(String(valueB), undefined, { 
        numeric: true, 
        sensitivity: 'base' 
      }) * (isAsc ? 1 : -1);
    });

    this._alldata = data;
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  checkGroupByColumn(field: string, add: boolean) {
    const found = this.groupByColumns.indexOf(field);

    if (found >= 0) {
      if (!add) {
        this.groupByColumns.splice(found, 1);
      }
    } else {
      if (add) {
        this.groupByColumns.push(field);
      }
    }
    this._groupByColumnsSet = new Set(this.groupByColumns);
  }

  isGroupedBy(column: ColumnDefinition): boolean {
    return this._groupByColumnsSet.has(column.field);
  }

  unGroupBy(event: Event, column: ColumnDefinition) {
    event.stopPropagation();
    this.checkGroupByColumn(column.field, false);
    this.updateDisplayedColumns();
    this.filteredDataCache = null;
    this.filterCacheKey = '';
    this.updateDataSource();
  }

  private buildGroupMap() {
    this.groupMap.clear();
    this.dataSource.data.forEach((row) => {
      if (row instanceof Group) {
        const key = this.getGroupKey(row);
        this.groupMap.set(key, row);
      }
    });
  }

  private getGroupKey(group: Group): string {
    return this.groupByColumns
      .map((col) => (group as any)[col] || '')
      .join('|');
  }

  private getDataGroupKey(data: any): string {
    return this.groupByColumns.map((col) => data[col] || '').join('|');
  }

  customFilterPredicate(data: any | Group, filter: string): boolean {
    if (data instanceof Group) {
      return data.visible;
    }

    if (this.groupByColumns.length === 0) {
      return true;
    }

    const groupKey = this.getDataGroupKey(data);
    const group = this.groupMap.get(groupKey);

    if (!group) {
      return true;
    }

    return group.visible && group.expanded;
  }

  groupHeaderClick(row: Group, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (!(row instanceof Group)) {
      return;
    }

    const newExpandedState = !row.expanded;
    row.expanded = newExpandedState;

    const key = this.getGroupKey(row);
    this.groupExpandedStates.set(key, newExpandedState);

    this.dataSource.data.forEach((item) => {
      if (item instanceof Group) {
        const itemKey = this.getGroupKey(item);
        if (itemKey === key) {
          item.expanded = newExpandedState;
        }
      }
    });

    this.buildGroupMap();
    this.dataSource.filterPredicate = this.customFilterPredicate.bind(this);
    this.dataSource.data = [...this.dataSource.data];

    const currentFilter = this.dataSource.filter || ' ';
    this.dataSource.filter = currentFilter === ' ' ? '' : ' ';
    setTimeout(() => {
      this.dataSource.filter = currentFilter;
      this.cdr.detectChanges();
    }, 0);
  }

  addGroups(data: any[], groupByColumns: string[]): any[] {
    const rootGroup = new Group();
    rootGroup.expanded = this.config.grouping?.expandAllByDefault ?? true;
    const result = this.getSublevel(data, 0, groupByColumns, rootGroup);

    result.forEach((row) => {
      if (row instanceof Group) {
        const key = this.getGroupKey(row);
        if (this.groupExpandedStates.has(key)) {
          row.expanded = this.groupExpandedStates.get(key)!;
        } else if (this.config.grouping?.expandAllByDefault) {
          row.expanded = true;
        }
      }
    });

    return result;
  }

  getSublevel(
    data: any[],
    level: number,
    groupByColumns: string[],
    parent: Group
  ): any[] {
    if (level >= groupByColumns.length) {
      return data;
    }

    const currentColumn = groupByColumns[level];
    const groupMap = new Map<string, { group: Group; rows: any[] }>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const key = String(row[currentColumn] || '');
      let groupEntry = groupMap.get(key);
      
      if (!groupEntry) {
        const group = new Group();
        group.level = level + 1;
        group.parent = parent;

        for (let j = 0; j <= level; j++) {
          (group as any)[groupByColumns[j]] = row[groupByColumns[j]];
        }

        groupEntry = { group, rows: [] };
        groupMap.set(key, groupEntry);
      }
      groupEntry.rows.push(row);
    }

    const subGroups: any[] = [];
    groupMap.forEach(({ group, rows }) => {
      group.totalCounts = rows.length;
      const subGroup = this.getSublevel(rows, level + 1, groupByColumns, group);
      subGroup.unshift(group);
      subGroups.push(...subGroup);
    });

    return subGroups;
  }

  isGroup(index: number, item: any): boolean {
    return !!(item instanceof Group && item.level);
  }

  isGroupRow(index: number, item: any): boolean {
    return !!(
      item instanceof Group &&
      item.level &&
      !(item && (item as any).__noResults)
    );
  }

  isNoResultsRow(index: number, item: any): boolean {
    return !!(item && item.__noResults);
  }

  isDataRowOrGroup(index: number, item: any): boolean {
    return !(item && item.__noResults) && !(item instanceof Group);
  }

  trackByColumn(index: number, column: ColumnDefinition): string {
    return column.field;
  }

  trackByRow(index: number, row: any): any {
    if (row instanceof Group) {
      const keyParts = this.groupByColumns
        .map((col) => (row as any)[col] || '')
        .join('|');
      return `group-${row.level}-${keyParts}`;
    }
    return row.id || index;
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    return (
      numSelected === this.selectableRowCount && this.selectableRowCount > 0
    );
  }

  masterToggle() {
    if (!this.config.selection?.enabled) return;
    
    const selectableRows = this.getSelectableRows();
    if (selectableRows.length === 0) {
      return;
    }

    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      selectableRows.forEach((row) => this.selection.select(row));
    }
    this.updateSelectionState();
    this.selectionChange.emit(this.selection.selected);
    this.actionStatusMessage = '';
  }

  onRowClick(row: any) {
    this.rowClick.emit(row);
    if (this.config.selection?.enabled && this.isRowSelectable(row)) {
      this.toggleRow(row);
    }
  }

  toggleRow(row: any) {
    if (!this.isRowSelectable(row)) {
      return;
    }

    this.selection.toggle(row);
    this.updateSelectionState();
    this.selectionChange.emit(this.selection.selected);
    this.actionStatusMessage = '';
  }

  isRowSelected(row: any): boolean {
    return !(row instanceof Group) && this.selection.isSelected(row);
  }

  isDataRow(row: any): boolean {
    return !(row instanceof Group);
  }

  isRowSelectable(row: any): boolean {
    if (!this.isDataRow(row)) {
      return false;
    }

    if (this.config.selection?.selectableRowPredicate) {
      return this.config.selection.selectableRowPredicate(row);
    }

    const duplicateFlag = Boolean(row?.isDupicate ?? row?.isDuplicate);
    const disabledFlag = Boolean(row?.disable ?? row?.disabled);

    return !duplicateFlag && !disabledFlag;
  }

  getRowTooltip(row: any): string {
    if (!this.isDataRow(row)) {
      return '';
    }

    if (row?.isDupicate || row?.isDuplicate) {
      return 'Duplicate row - cannot be selected';
    }

    if (row?.disable || row?.disabled) {
      return 'Disabled row - cannot be selected';
    }

    return '';
  }

  getRowClasses(row: any, index: number): { [key: string]: boolean } {
    const classes: { [key: string]: boolean } = {};

    // Default classes
    if (this.isRowSelected(row)) {
      classes['selected-row'] = true;
    }
    if (this.isDataRow(row) && !this.isRowSelectable(row)) {
      classes['row-disabled'] = true;
    }
    if (this.isDataRow(row) && (row?.isDupicate || row?.isDuplicate)) {
      classes['duplicate-row'] = true;
    }
    if (
      this.isDataRow(row) &&
      (row?.disable || row?.disabled) &&
      !(row?.isDupicate || row?.isDuplicate)
    ) {
      classes['disabled-row'] = true;
    }
    if (this.isGroupRow(0, row)) {
      classes['group-row'] = true;
    }

    // Custom row classes from config
    if (this.config?.rowClassFunction) {
      const customClasses = this.config.rowClassFunction(row, index);
      if (typeof customClasses === 'string') {
        classes[customClasses] = true;
      } else if (Array.isArray(customClasses)) {
        customClasses.forEach((cls) => {
          classes[cls] = true;
        });
      } else if (typeof customClasses === 'object') {
        Object.assign(classes, customClasses);
      }
    }

    return classes;
  }

  getCellTemplate(column: ColumnDefinition): TemplateRef<any> | null {
    if (!this.cellTemplates || !column.cellTemplate) {
      return null;
    }
    return this.cellTemplates.get(column.cellTemplate) || null;
  }

  getDataRows(): any[] {
    return this.dataSource.data.filter((row) => !(row instanceof Group));
  }

  getSelectableRows(): any[] {
    const dataRows = this.getDataRows();
    const selectableRows: any[] = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (this.isRowSelectable(row)) {
        selectableRows.push(row);
      }
    }
    return selectableRows;
  }

  private updateSelectionState() {
    const selectableRows = this.getSelectableRows();
    this.selectableRowCount = selectableRows.length;

    const selectableSet = new Set(selectableRows);
    const numSelected = this.selection.selected.filter((row) =>
      selectableSet.has(row)
    ).length;
    this.selectAllChecked =
      numSelected === this.selectableRowCount && this.selectableRowCount > 0;
    this.selectAllIndeterminate =
      numSelected > 0 && numSelected < this.selectableRowCount;
  }

  acceptSelectedRows() {
    this.handleRowLevelAction('accept');
  }

  rejectSelectedRows() {
    this.handleRowLevelAction('reject');
  }

  private handleRowLevelAction(action: 'accept' | 'reject') {
    const selectedRows = this.selection.selected.filter((row) =>
      this.isRowSelectable(row)
    );

    if (selectedRows.length === 0) {
      this.actionStatusMessage = 'Please select at least one row.';
      this.cdr.markForCheck();
      return;
    }

    const verb = action === 'accept' ? 'Accepted' : 'Rejected';
    this.actionStatusMessage = `${verb} ${selectedRows.length} ${
      selectedRows.length === 1 ? 'row' : 'rows'
    }.`;

    this.selection.clear();
    this.updateSelectionState();
    this.cdr.markForCheck();
  }

  toggleColumnVisibility(column: ColumnDefinition) {
    if (!column || !column.field) {
      return;
    }

    if (!this.config.columnVisibility?.enabled) {
      return;
    }

    const currentState = this.columnVisibility[column.field];
    this.columnVisibility[column.field] = !currentState;
    this.updateDisplayedColumns();
    this.cdr.markForCheck();
  }

  isColumnVisible(field: string): boolean {
    if (!field) {
      return false;
    }
    return this.columnVisibility[field] !== false;
  }

  private getAllGroupedData(): any[] {
    const filteredData = this.applyFilters(this._alldata);
    return this.addGroups(filteredData, this.groupByColumns);
  }

  expandAllGroups() {
    const allGroupedData = this.getAllGroupedData();
    allGroupedData.forEach((row) => {
      if (row instanceof Group) {
        const key = this.getGroupKey(row);
        this.groupExpandedStates.set(key, true);
        row.expanded = true;
      }
    });

    this.dataSource.data.forEach((row) => {
      if (row instanceof Group) {
        row.expanded = true;
      }
    });

    this.triggerFilterUpdate();
  }

  collapseAllGroups() {
    const allGroupedData = this.getAllGroupedData();
    allGroupedData.forEach((row) => {
      if (row instanceof Group) {
        const key = this.getGroupKey(row);
        this.groupExpandedStates.set(key, false);
        row.expanded = false;
      }
    });

    this.dataSource.data.forEach((row) => {
      if (row instanceof Group) {
        row.expanded = false;
      }
    });

    this.triggerFilterUpdate();
  }

  private triggerFilterUpdate() {
    this.buildGroupMap();
    const currentFilter = this.dataSource.filter;
    this.dataSource.filter = currentFilter === '' ? ' ' : '';
    this.dataSource.filter = currentFilter;
    this.cdr.markForCheck();
  }

  getExportData(): any[] {
    const selectedRows =
      this.selection.selected.length > 0
        ? this.selection.selected
        : this._alldata;

    if (selectedRows.length === 0) {
      return [];
    }

    const headers = this.columns.map((col) => col.label || col.field);
    const data: any[] = [];

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i];
      const rowData: any = {};
      for (let j = 0; j < this.columns.length; j++) {
        const col = this.columns[j];
        const value = row[col.field];
        rowData[headers[j]] = value != null ? String(value) : '';
      }
      data.push(rowData);
    }

    return data;
  }

  exportToCSV() {
    if (!this.config.export?.enabled) return;

    const data = this.getExportData();
    if (data.length === 0) {
      return;
    }

    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');
    
    const rows: string[] = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cells: string[] = new Array(headers.length);
      for (let j = 0; j < headers.length; j++) {
        const value = row[headers[j]];
        if (value == null) {
          cells[j] = '';
        } else {
          const stringValue = String(value);
          cells[j] = stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }
      }
      rows[i] = cells.join(',');
    }

    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, 'csv');
  }

  exportToXLS(format: 'xls' | 'xlsx' = 'xlsx') {
    if (!this.config.export?.enabled) return;

    const data = this.getExportData();
    if (data.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const excelBuffer = XLSX.write(workbook, { 
      bookType: format, 
      type: 'array' 
    });
    const blob = new Blob([excelBuffer], { 
      type: format === 'xlsx' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        : 'application/vnd.ms-excel' 
    });
    
    this.downloadFile(blob, format);
  }

  exportData(format: 'csv' | 'xls' | 'xlsx' = 'csv') {
    if (!this.config.export?.enabled) return;

    switch (format) {
      case 'csv':
        this.exportToCSV();
        break;
      case 'xls':
      case 'xlsx':
        this.exportToXLS(format);
        break;
    }
  }

  private downloadFile(blob: Blob, format: 'csv' | 'xls' | 'xlsx') {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const baseFileName = this.config.export?.fileName?.replace(/\.[^.]+$/, '') || `grid-export-${Date.now()}`;
    const extension = format === 'csv' ? 'csv' : format === 'xls' ? 'xls' : 'xlsx';
    const fileName = `${baseFileName}.${extension}`;
    
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getAvailableExportFormats(): ('csv' | 'xls' | 'xlsx')[] {
    if (!this.config.export?.enabled) return [];
    return this.config.export.formats || ['csv', 'xlsx'];
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.showAllRows = false;
    this.updateDataSource();
    this.pageChange.emit(event);
    this.cdr.markForCheck();
  }

  toggleShowAll() {
    this.showAllRows = !this.showAllRows;
    if (this.showAllRows) {
      this.pageIndex = 0;
    }
    this.updateDataSource();
    this.cdr.markForCheck();
  }

  getDisplayedRowsCount(): number {
    if (this.showAllRows) {
      return this.dataSource.data.length;
    }
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.totalDataRows);
    return endIndex - startIndex;
  }

  getPaginationInfo(): string {
    if (this.showAllRows) {
      return `Showing all ${this.totalDataRows} rows`;
    }
    const startIndex = this.pageIndex * this.pageSize + 1;
    const endIndex = Math.min(
      (this.pageIndex + 1) * this.pageSize,
      this.totalDataRows
    );
    return `${startIndex}-${endIndex} of ${this.totalDataRows}`;
  }

  hasNoResults(): boolean {
    return this.totalDataRows === 0;
  }

  getColumnWidth(column: ColumnDefinition): string {
    if (column.width) {
      return typeof column.width === 'number' ? `${column.width}px` : column.width;
    }
    return 'auto';
  }
}

