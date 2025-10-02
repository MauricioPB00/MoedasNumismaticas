import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaMundiComponent } from './mapa-mundi.component';

describe('MapaMundiComponent', () => {
  let component: MapaMundiComponent;
  let fixture: ComponentFixture<MapaMundiComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapaMundiComponent]
    });
    fixture = TestBed.createComponent(MapaMundiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
