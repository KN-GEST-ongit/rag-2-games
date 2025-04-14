import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PongComponent } from './pong.component';

describe('PongComponent', () => {
  let component: PongComponent;
  let fixture: ComponentFixture<PongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PongComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
