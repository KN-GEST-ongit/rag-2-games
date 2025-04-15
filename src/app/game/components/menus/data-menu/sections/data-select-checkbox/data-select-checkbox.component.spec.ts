import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DataSelectCheckboxComponent } from './data-select-checkbox.component';

describe('DataSelectCheckboxComponent', () => {
  let component: DataSelectCheckboxComponent;
  let fixture: ComponentFixture<DataSelectCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSelectCheckboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataSelectCheckboxComponent);
    component = fixture.componentInstance;
    component.variable = { key: 'testKey', value: 'testValue' };
    component.dataToPersist = { testKey: true };
    component.isDataCollectingActive = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable checkbox if data collecting is active', () => {
    component.isDataCollectingActive = true;
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(input.disabled).toBeTruthy();
  });

  it('should check checkbox if key is in data to persist', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(input.checked).toBeTruthy();
  });

  it('should emit updateDataToPersist event on change', () => {
    spyOn(component, 'updateDataToPersist');
    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    input.click();
    fixture.detectChanges();
    expect(component.updateDataToPersist).toHaveBeenCalledWith(
      'testKey',
      'testValue',
      false
    );
  });
});
