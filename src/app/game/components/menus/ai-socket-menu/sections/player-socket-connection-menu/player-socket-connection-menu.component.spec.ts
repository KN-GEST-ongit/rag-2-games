import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerSocketConnectionMenuComponent } from './player-socket-connection-menu.component';
import { By } from '@angular/platform-browser';
import { AiSocketService } from 'app/game/services/ai-socket.service';
import { SocketConnectedMenuComponent } from '../socket-connected-menu/socket-connected-menu.component';
import { SocketDomainInputComponent } from '../socket-domain-input/socket-domain-input.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PlayerSocketConnectionMenuComponent', () => {
  let component: PlayerSocketConnectionMenuComponent;
  let fixture: ComponentFixture<PlayerSocketConnectionMenuComponent>;
  let aiSocketService: AiSocketService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PlayerSocketConnectionMenuComponent,
        SocketDomainInputComponent,
        SocketConnectedMenuComponent,
        HttpClientTestingModule,
      ],
      providers: [AiSocketService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerSocketConnectionMenuComponent);
    component = fixture.componentInstance;
    aiSocketService = TestBed.inject(AiSocketService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set gameName input', () => {
    component.gameName = 'Test Game';
    fixture.detectChanges();
    expect(component.gameName).toBe('Test Game');
  });

  // it('should display "Disconnected" when socket is not connected', () => {
  //   spyOn(aiSocketService, 'getIsSocketConnected').and.returnValue(false);
  //   fixture.detectChanges();
  //   const span = fixture.debugElement.query(By.css('span')).nativeElement;
  //   expect(span.textContent).toContain('Disconnected');
  // });

  it('should call onConnectButtonClick when connect button is clicked', () => {
    spyOn(component, 'onConnectButtonClick');
    spyOn(aiSocketService, 'getIsSocketConnected').and.returnValue(false);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button')).nativeElement;
    button.click();
    expect(component.onConnectButtonClick).toHaveBeenCalled();
  });

  it('should not render SocketConnectedMenuComponent when socket is not connected', () => {
    spyOn(aiSocketService, 'getIsSocketConnected').and.returnValue(false);
    fixture.detectChanges();
    const socketConnectedMenu = fixture.debugElement.query(
      By.directive(SocketConnectedMenuComponent)
    );
    expect(socketConnectedMenu).toBeFalsy();
  });
});
