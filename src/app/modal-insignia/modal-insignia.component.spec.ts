import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalInsigniaComponent } from './modal-insignia.component';

describe('ModalInsigniaComponent', () => {
  let component: ModalInsigniaComponent;
  let fixture: ComponentFixture<ModalInsigniaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalInsigniaComponent]
    });
    fixture = TestBed.createComponent(ModalInsigniaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
