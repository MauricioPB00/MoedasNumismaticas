import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPriceComponent } from './modal-price.component';

describe('ModalPriceComponent', () => {
  let component: ModalPriceComponent;
  let fixture: ComponentFixture<ModalPriceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalPriceComponent]
    });
    fixture = TestBed.createComponent(ModalPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
