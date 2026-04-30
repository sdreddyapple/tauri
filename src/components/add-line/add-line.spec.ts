import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLine } from './add-line';

describe('AddLine', () => {
  let component: AddLine;
  let fixture: ComponentFixture<AddLine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddLine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
