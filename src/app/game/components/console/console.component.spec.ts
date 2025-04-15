import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConsoleComponent } from './console.component';
import { ExchangeDataPipe } from '@utils/pipes/exchange-data.pipe';
import { ConsoleFieldsetComponent } from './console-fieldset/console-fieldset.component';

describe('ConsoleComponent', () => {
  let component: ConsoleComponent;
  let fixture: ComponentFixture<ConsoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsoleComponent, ExchangeDataPipe, ConsoleFieldsetComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleComponent);
    component = fixture.componentInstance;
    component.logData = {}; // Provide required input
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle console visibility', () => {
    expect(component.isConsoleVisible).toBeFalse();
    component.toggleConsole();
    expect(component.isConsoleVisible).toBeTrue();
    component.toggleConsole();
    expect(component.isConsoleVisible).toBeFalse();
  });

  it('should pass logData to console-fieldset component', () => {
    const consoleFieldset = fixture.debugElement.query(
      By.directive(ConsoleFieldsetComponent)
    );
    expect(consoleFieldset.componentInstance.logData).toBe(component.logData);
  });
});
