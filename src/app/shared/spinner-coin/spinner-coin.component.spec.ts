import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinnerCoinComponent } from './spinner-coin.component';

describe('SpinnerCoinComponent', () => {
  let component: SpinnerCoinComponent;
  let fixture: ComponentFixture<SpinnerCoinComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SpinnerCoinComponent]
    });
    fixture = TestBed.createComponent(SpinnerCoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
