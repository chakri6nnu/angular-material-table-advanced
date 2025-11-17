export interface FilterOperator {
  value: string;
  label: string;
}

export const DEFAULT_FILTER_OPERATORS: FilterOperator[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'notContains', label: 'Does not contain' },
  { value: 'notEquals', label: 'Does not equal' },
];

