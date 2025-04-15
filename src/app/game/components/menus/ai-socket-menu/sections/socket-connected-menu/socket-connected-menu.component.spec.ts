import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SocketConnectedMenuComponent } from './socket-connected-menu.component';

describe('SocketConnectedMenuComponent', () => {
  let component: SocketConnectedMenuComponent;
  let fixture: ComponentFixture<SocketConnectedMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocketConnectedMenuComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SocketConnectedMenuComponent);
    component = fixture.componentInstance;
    component.isDataSendingActive = false;
    component.vSendingInterval = { value: 500 };
    component.socket = {
      close: jasmine.createSpy('close'),
    } as unknown as WebSocket;
    component.startDataExchange = jasmine.createSpy('startDataExchange');
    component.stopDataExchange = jasmine.createSpy('stopDataExchange');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call socket.close when disconnect button is clicked', () => {
    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);
    expect(component.socket?.close).toHaveBeenCalled();
  });

  it('should call startDataExchange with correct interval when start button is clicked', () => {
    component.isDataSendingActive = false;
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input'));
    input.nativeElement.value = 600;
    input.triggerEventHandler('change', { target: input.nativeElement });

    const button = fixture.debugElement.queryAll(By.css('button'))[1];
    button.triggerEventHandler('click', null);

    expect(component.startDataExchange).toHaveBeenCalledWith(600);
  });

  it('should call stopDataExchange when stop button is clicked', () => {
    component.isDataSendingActive = true;
    fixture.detectChanges();

    const button = fixture.debugElement.queryAll(By.css('button'))[1];
    button.triggerEventHandler('click', null);

    expect(component.stopDataExchange).toHaveBeenCalled();
  });

  it('should render correct buttons based on isDataSendingActive', () => {
    component.isDataSendingActive = false;
    fixture.detectChanges();

    let buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);
    expect(buttons[1].nativeElement.textContent).toContain(
      'Start data exchange'
    );

    component.isDataSendingActive = true;
    fixture.detectChanges();

    buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);
    expect(buttons[1].nativeElement.textContent).toContain(
      'Stop data exchange'
    );
  });
});
