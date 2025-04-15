import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rag2GamesLibComponent } from './rag-2-games-lib.component';

describe('Rag2GamesLibComponent', () => {
  let component: Rag2GamesLibComponent;
  let fixture: ComponentFixture<Rag2GamesLibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rag2GamesLibComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rag2GamesLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
