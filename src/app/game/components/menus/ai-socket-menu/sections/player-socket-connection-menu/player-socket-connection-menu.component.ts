/* eslint-disable max-lines */
import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { AiSocketService } from 'app/game/services/ai-socket.service';
import { TExchangeData } from '@gameModels/exchange-data.type';
import { PlayerSourceType } from 'app/shared/models/player-source-type.enum';
import { Player } from '@gameModels/player.class';
import { SocketDomainInputComponent } from '../socket-domain-input/socket-domain-input.component';
import { SocketConnectedMenuComponent } from '../socket-connected-menu/socket-connected-menu.component';
import { Observable, Subscription } from 'rxjs';
import { PageVisibilityService } from 'app/shared/services/page-visibility.service';
import { UrlParamService } from 'app/shared/services/url-param.service';
import { ModelSelectionComponent } from '../model-selection/model-selection.component';
import { Game } from '@gameModels/game.class';
import { SideMenuHelperComponent } from '../side-menu-helper/side-menu-helper.component';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-player-socket-connection-menu',
  standalone: true,
  imports: [
    SocketDomainInputComponent,
    SocketConnectedMenuComponent,
    ModelSelectionComponent,
    SideMenuHelperComponent,
  ],
  providers: [AiSocketService],
  template: `
    <div class="flex flex-col w-full">
      <app-model-selection
        class="mb-2"
        [isDisabled]="isConnected ? true : false"
        [gameName]="gameName"
        [currentSocketDomain]="socketUrl"
        (socketDomainEmitter)="socketUrl = $event"
        (isModelSelected)="isPreparedModelSelected = $event" />
      <span class="text-mainCreme font-bold">Custom model address:</span>
      <app-socket-domain-input
        class="mb-2"
        [isDisabled]="isConnected || !canEditInput"
        [initialValue]="socketUrl"
        [gameName]="gameName"
        (socketDomainEmitter)="socketUrl = $event"
        (recentPhrasesEmitter)="recentPhrases = $event" />
      @if (isPreparedModelSelected) {
        <div class="relative -top-4 -left-4">
          <app-side-menu-helper
            [menuType]="'Warning'"
            [descriptionPart1]="
              'When utilizing pre-trained models, the quality of your network connection significantly impacts the model performance. It will consistently be slightly less efficient compared to running it in a local environment.'
            "
            [descriptionPart2]="null"
            [descriptionPart3]="null"
            [iconType]="'warning'" />
        </div>
      }
      <span
        class="text-mainOrange font-bold {{
          isPreparedModelSelected ? 'mt-6' : 'mt-0'
        }}"
        >STATUS:</span
      >
      <span
        class="w-full text-start {{
          aiSocketService.getIsSocketConnected()
            ? 'text-green-500'
            : 'text-red-500'
        }}"
        >{{
          aiSocketService.getIsSocketConnected() ? 'Connected' : 'Disconnected'
        }}</span
      >
      @if (aiSocketService.getIsSocketConnected()) {
        <span class="text-mainCreme">
          Ping: <b>{{ aiSocketService.getSocketPing() }} ms</b>
        </span>
        <app-socket-connected-menu
          [isDataSendingActive]="aiSocketService.getIsDataSendingActive()"
          [vSendingInterval]="vSendingInterval"
          [socket]="aiSocketService.getSocket()"
          [startDataExchange]="onStartDataExchangeClick"
          [stopDataExchange]="aiSocketService.stopDataExchange"
          [isPaused]="isPaused"
          [playerId]="player.id" />
      } @else {
        <button
          (click)="onConnectButtonClick()"
          class="mt-2 border-b-[1px] border-mainOrange w-full text-center font-black cursor-[url('/cursors/stronghold.png'),_auto] {{
            canEditInput ? 'opacity-100' : 'opacity-50'
          }}">
          Connect
        </button>
      }
    </div>
  `,
})
export class PlayerSocketConnectionMenuComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input({ required: true }) public gameName = '';
  @Input({ required: true }) public set setDataToSend(data: Game) {
    if (!data) return;
    this.dataToSend = {
      name: data.name,
      outputSpec: data.outputSpec,
      players: data.players,
      state: data.state,
    } as TExchangeData;
    this.aiSocketService.setDataToSend(this.dataToSend);
  }
  @Input({ required: true }) public player!: Player;
  @Input({ required: true }) public gamePause = new Observable<boolean>();
  @Input({ required: true }) public gameRestart = new Observable<void>();

  @Output() public receivedDataEmitter = new EventEmitter<TExchangeData>();
  @Output() public connectedEmitter = new EventEmitter<boolean>();

  private _pageVisibilityService = inject(PageVisibilityService);
  private _urlParamService = inject(UrlParamService);
  public aiSocketService = inject(AiSocketService);

  private _pingSubscription = new Subscription();
  private _pauseSubscription = new Subscription();
  private _restartSubscription = new Subscription();
  private _pageVisibilitySubscription = new Subscription();

  public isConnected = false;
  public dataToSend: TExchangeData = {};
  public socketUrl = '';
  public recentPhrases: string[] = [];
  public playerSourceType = PlayerSourceType;
  public vSendingInterval = { value: 100 };
  public isPaused = false;
  public isPreparedModelSelected = false;
  public canEditInput = true;

  public ngOnInit(): void {
    this._restartSubscription = this.gameRestart.subscribe(() => {
      console.log('Restart - ai socket'); //can be used
    });
    this._pauseSubscription = this.gamePause.subscribe(value => {
      if (value) {
        this.isPaused = true;
        this.aiSocketService.pauseDataExchange();
      } else {
        this.isPaused = false;
        this.aiSocketService.resumeDataExchange(
          this.vSendingInterval.value,
          this.player.inputData,
          this.player.id
        );
      }
    });
    this._pageVisibilitySubscription = this._pageVisibilityService
      .getVisibilityState()
      .subscribe(isVisible => {
        if (!isVisible) {
          this.aiSocketService.pauseDataExchange();
        } else if (!this.isPaused) {
          this.aiSocketService.resumeDataExchange(
            this.vSendingInterval.value,
            this.player.inputData,
            this.player.id
          );
        }
      });

    this.syncPropsWithUrl();
  }
  public ngAfterViewInit(): void {
    feather.replace();
  }
  public ngOnDestroy(): void {
    this.aiSocketService.stopDataExchange();
    this.aiSocketService.closeSocket();
    this._pauseSubscription.unsubscribe();
    this._restartSubscription.unsubscribe();
    this._pingSubscription.unsubscribe();
    this._pageVisibilitySubscription.unsubscribe();
  }
  public onConnectButtonClick(): void {
    this.canEditInput = false;
    this.aiSocketService.connect(
      this.socketUrl,
      () => {
        this.canEditInput = true;
        this.saveRecentPhrase(this.socketUrl);
        this.isConnected = true;
        this.connectedEmitter.emit(true);
      },
      (event: MessageEvent<string>) => {
        this.emitSocketInput(JSON.parse(event.data));
      },
      () => {
        this.canEditInput = true;
      },
      () => {
        this.isConnected = false;
        this._pingSubscription.unsubscribe();
        this.connectedEmitter.emit(false);
      }
    );
    this._urlParamService.setQueryParam(
      'player-' + this.player.id + '-socketUrl',
      this.socketUrl
    );
  }
  public onStartDataExchangeClick = (): void => {
    if (this.vSendingInterval.value) {
      this.aiSocketService.startDataExchange(
        this.vSendingInterval.value,
        this.player.inputData,
        this.player.id
      );
    }
  };
  //
  private emitSocketInput(data: TExchangeData): void {
    this.receivedDataEmitter.emit({ player: this.player, data: data });
  }
  private saveRecentPhrase(phrase: string): void {
    if (this.recentPhrases.includes(phrase)) return;
    this.recentPhrases.unshift(phrase);

    if (this.recentPhrases.length > 5) {
      this.recentPhrases.pop();
    }

    localStorage.setItem(
      'recentPhrases_' + this.gameName,
      JSON.stringify(this.recentPhrases)
    );
  }
  private syncPropsWithUrl(): void {
    setTimeout(() => {
      const socketUrl = this._urlParamService.getQueryParam(
        'player-' + this.player.id + '-socketUrl'
      );

      if (socketUrl !== null) {
        this.socketUrl = socketUrl;
      } else {
        this._urlParamService.setQueryParam(
          'player-' + this.player.id + '-socketUrl',
          this.socketUrl
        );
      }
    });
  }
}
