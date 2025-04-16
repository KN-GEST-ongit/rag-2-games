import {
  AfterViewChecked,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { TExchangeData } from '@gameModels/exchange-data.type';
import { Player } from '@gameModels/player.class';
import { DebugModeMenuComponent } from '../debug-mode-menu/debug-mode-menu.component';
import { DebugModePanelComponent } from '../debug-mode-panel/debug-mode-panel.component';
import { PlayerSocketConnectionMenuComponent } from '../player-socket-connection-menu/player-socket-connection-menu.component';
import { Observable } from 'rxjs';
import { Game } from '@gameModels/game.class';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-player-socket-menu',
  standalone: true,
  imports: [
    DebugModeMenuComponent,
    DebugModePanelComponent,
    PlayerSocketConnectionMenuComponent,
  ],

  template: `
    <button
      (click)="handleEditedPlayer()"
      class="flex flex-row space-x-2 items-center {{
        editedPlayersLength === 1
          ? 'cursor-[url(/cursors/stronghold.png),_auto]'
          : 'cursor-[url(/cursors/stronghold_pointer.png),_auto]'
      }}">
      <h3 class="text-mainOrange text-xl font-bold uppercase text-center">
        {{ player.name }}
      </h3>
      <span
        class="ease-in-out duration-150 transition-all {{
          editedPlayersLength === 1 ? 'hidden' : 'block'
        }} {{
          editedPlayerId !== player.id
            ? 'rotate-180 text-mainGray'
            : 'text-mainOrange'
        }}">
        <i data-feather="chevron-down" class="size-5"></i>
      </span>
    </button>
    <div class="{{ editedPlayerId === player.id ? 'block' : 'hidden' }}">
      <app-debug-mode-menu
        [canApplyDebugMode]="!isConnected"
        (debugModeEmitter)="isDebugModeActive = $event" />
      @if (isDebugModeActive) {
        <app-debug-mode-panel
          [player]="player"
          [expectedInput]="player.inputData"
          (inputEmitter)="receivedDataEmitter.emit($event)" />
      } @else {
        <app-player-socket-connection-menu
          [player]="player"
          [setDataToSend]="dataToSend"
          (receivedDataEmitter)="receivedDataEmitter.emit($event)"
          (connectedEmitter)="isConnected = $event"
          [gameName]="gameName"
          [gamePause]="gamePause"
          [gameRestart]="gameRestart" />
      }
    </div>
  `,
})
export class PlayerSocketMenuComponent implements AfterViewChecked, OnInit {
  @Input({ required: true }) public player!: Player;
  @Input({ required: true }) public gameName = '';
  @Input({ required: true }) public dataToSend!: Game;
  @Input({ required: true }) public gamePause = new Observable<boolean>();
  @Input({ required: true }) public gameRestart = new Observable<void>();
  @Input({ required: true }) public editedPlayerId = -1;
  @Input({ required: true }) public editedPlayersLength!: number;

  @Output() public receivedDataEmitter = new EventEmitter<TExchangeData>();
  @Output() public editedPlayerEmitter = new EventEmitter<number>();

  public isDebugModeActive = false;
  public isConnected = false;

  public ngOnInit(): void {
    this.editedPlayerId = this.player.id;
    this.editedPlayerEmitter.emit(this.player.id);
  }

  public ngAfterViewChecked(): void {
    feather.replace();
  }

  public handleEditedPlayer(): void {
    if (this.editedPlayersLength > 1) {
      if (this.editedPlayerId !== this.player.id) {
        this.editedPlayerId = this.player.id;
        this.editedPlayerEmitter.emit(this.player.id);
      } else {
        this.editedPlayerId = -1;
        this.editedPlayerEmitter.emit(-1);
      }
    }
  }
}
