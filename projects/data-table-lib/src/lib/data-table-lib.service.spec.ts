import { TestBed } from '@angular/core/testing';

import { DataTableLibService } from './data-table-lib.service';

describe('DataTableLibService', () => {
  let service: DataTableLibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataTableLibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
