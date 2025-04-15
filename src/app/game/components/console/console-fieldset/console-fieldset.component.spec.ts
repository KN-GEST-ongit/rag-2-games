import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KeyValuePipe } from '@angular/common';
import { ExchangeDataPipe } from '@utils/pipes/exchange-data.pipe';
import { ConsoleFieldsetComponent } from './console-fieldset.component';
import { TExchangeData } from '@gameModels/exchange-data.type';

describe('ConsoleFieldsetComponent', () => {
  let component: ConsoleFieldsetComponent;
  let fixture: ComponentFixture<ConsoleFieldsetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyValuePipe, ExchangeDataPipe, ConsoleFieldsetComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleFieldsetComponent);
    component = fixture.componentInstance;
    component.logData = {
      key1: 'value1',
      key2: { nestedKey: 'nestedValue' },
    } as TExchangeData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should identify objects correctly with isTLogData', () => {
    expect(component.isTLogData({})).toBeTrue();
    expect(component.isTLogData('string')).toBeFalse();
    expect(component.isTLogData(123)).toBeFalse();
    expect(component.isTLogData([])).toBeTrue();
  });
});
