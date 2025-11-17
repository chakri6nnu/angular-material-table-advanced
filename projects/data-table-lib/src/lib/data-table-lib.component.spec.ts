import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableLibComponent } from './data-table-lib.component';

describe('DataTableLibComponent', () => {
  let component: DataTableLibComponent;
  let fixture: ComponentFixture<DataTableLibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableLibComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataTableLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
