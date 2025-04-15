import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameMenuComponent } from './game-menu.component';
import { By } from '@angular/platform-browser';

describe('GameMenuComponent', () => {
  let component: GameMenuComponent;
  let fixture: ComponentFixture<GameMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameMenuComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle isPaused and emit pauseEmitter on onPauseClick', () => {
    spyOn(component.pauseEmitter, 'emit');
    component.onPauseClick();
    expect(component.isPaused).toBe(true);
    expect(component.pauseEmitter.emit).toHaveBeenCalledWith(true);

    component.onPauseClick();
    expect(component.isPaused).toBe(false);
    expect(component.pauseEmitter.emit).toHaveBeenCalledWith(false);
  });

  it('should emit restartEmitter on restart button click', () => {
    spyOn(component.restartEmitter, 'emit');
    const button = fixture.debugElement.queryAll(By.css('button'))[2]
      .nativeElement;
    button.click();
    expect(component.restartEmitter.emit).toHaveBeenCalled();
  });

  it('should display "Pause" when isPaused is false', () => {
    component.isPaused = false;
    fixture.detectChanges();
    const button = fixture.debugElement.queryAll(By.css('button'))[1]
      .nativeElement;
    expect(button.textContent).toContain('Pause');
  });

  it('should display "Resume" when isPaused is true', () => {
    component.isPaused = true;
    fixture.detectChanges();
    const button = fixture.debugElement.queryAll(By.css('button'))[1]
      .nativeElement;
    expect(button.textContent).toContain('Resume');
  });
});
