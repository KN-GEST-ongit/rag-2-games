import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketDomainInputComponent } from './socket-domain-input.component';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('SocketDomainInputComponent', () => {
  let component: SocketDomainInputComponent;
  let fixture: ComponentFixture<SocketDomainInputComponent>;
  let inputEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocketDomainInputComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SocketDomainInputComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.css('input'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit socketDomain value on input change', () => {
    spyOn(component.socketDomainEmitter, 'emit');
    const input = inputEl.nativeElement;
    input.value = 'localhost:8001';
    input.dispatchEvent(new Event('change'));

    expect(component.socketDomainEmitter.emit).toHaveBeenCalledWith(
      'localhost:8001'
    );
  });

  it('should render recent phrases in datalist', () => {
    component.recentPhrases = ['localhost:8001', 'localhost:8002'];
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.css('datalist option'));
    expect(options.length).toBe(2);
    expect(options[0].nativeElement.value).toBe('localhost:8001');
    expect(options[1].nativeElement.value).toBe('localhost:8002');
  });
});
