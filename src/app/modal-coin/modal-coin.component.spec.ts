import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCoinComponent } from './modal-coin.component';

describe('ModalCoinComponent', () => {
  let component: ModalCoinComponent;
  let fixture: ComponentFixture<ModalCoinComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalCoinComponent]
    });
    fixture = TestBed.createComponent(ModalCoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
