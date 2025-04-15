import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugModeMenuComponent } from './debug-mode-menu.component';

describe('DebugModeMenuComponent', () => {
  let component: DebugModeMenuComponent;
  let fixture: ComponentFixture<DebugModeMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebugModeMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DebugModeMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit true when debug mode is enabled', () => {
    spyOn(component.debugModeEmitter, 'emit');

    const input = fixture.debugElement.query(
      By.css('input[type="checkbox"]')
    ).nativeElement;
    input.click();
    fixture.detectChanges();

    expect(component.debugModeEmitter.emit).toHaveBeenCalledWith(true);
  });

  it('should emit false when debug mode is disabled', () => {
    spyOn(component.debugModeEmitter, 'emit');

    const input = fixture.debugElement.query(
      By.css('input[type="checkbox"]')
    ).nativeElement;
    input.click(); // Enable
    fixture.detectChanges();

    input.click(); // Disable
    fixture.detectChanges();

    expect(component.debugModeEmitter.emit).toHaveBeenCalledWith(false);
  });
});
