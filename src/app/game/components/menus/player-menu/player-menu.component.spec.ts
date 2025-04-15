import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerMenuComponent } from './player-menu.component';
import { By } from '@angular/platform-browser';
import { Player } from '@gameModels/player.class';
import { AiSocketService } from 'app/game/services/ai-socket.service';
import { PlayerSourceType } from 'app/shared/models/player-source-type.enum';

describe('PlayerMenuComponent', () => {
  let component: PlayerMenuComponent;
  let fixture: ComponentFixture<PlayerMenuComponent>;
  let mockPlayers: Player[];

  beforeEach(async () => {
    const aiSocketServiceStub = {
      getIsSocketConnected: jasmine
        .createSpy('getIsSocketConnected')
        .and.returnValue(false),
      getIsDataSendingActive: jasmine
        .createSpy('getIsDataSendingActive')
        .and.returnValue(false),
      getSocket: jasmine.createSpy('getSocket').and.returnValue({
        close: jasmine.createSpy('close'),
      } as unknown as WebSocket),
      stopDataExchange: jasmine.createSpy('stopDataExchange'),
      startDataExchange: jasmine.createSpy('startDataExchange'),
      connect: jasmine
        .createSpy('connect')
        .and.callFake((_url, onOpen, _onMessage, _onClose) => {
          onOpen();
        }),
      sendDataToSocket: jasmine.createSpy('sendDataToSocket'),
    };
    await TestBed.configureTestingModule({
      imports: [PlayerMenuComponent],
      providers: [{ provide: AiSocketService, useValue: aiSocketServiceStub }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerMenuComponent);
    component = fixture.componentInstance;

    mockPlayers = [
      new Player(1, true, 'p1', {}, {}, PlayerSourceType.KEYBOARD),
    ];

    component.players = mockPlayers;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update player active status and emit event', () => {
    spyOn(component.playerSourceChangeEmitter, 'emit');
    const player = mockPlayers[0];
    const isNewActiveStatus = false;

    component.updatePlayerActive(player, isNewActiveStatus);

    expect(player.isActive).toBe(isNewActiveStatus);
    expect(component.playerSourceChangeEmitter.emit).toHaveBeenCalledWith(
      mockPlayers
    );
  });

  it('should bind player source types to select options', () => {
    const select = fixture.debugElement.query(By.css('select'));
    const options = select.queryAll(By.css('option'));

    expect(options.length).toBe(component.playerSourceType.length);
    options.forEach((option, index) => {
      expect(option.nativeElement.value).toBe(
        component.playerSourceType[index]
      );
    });
  });
});
