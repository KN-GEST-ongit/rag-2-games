import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TExchangeData } from '@gameModels/exchange-data.type';
import { Player } from '@gameModels/player.class';
import { PlayerSourceType } from 'app/shared/models/player-source-type.enum';
import { PlayerSocketMenuComponent } from './sections/player-socket-menu/player-socket-menu.component';
import { Observable } from 'rxjs';
import { Game } from '@gameModels/game.class';
import * as feather from 'feather-icons';
import { SideMenuHelperComponent } from './sections/side-menu-helper/side-menu-helper.component';

@Component({
  selector: 'app-ai-socket-menu',
  standalone: true,
  imports: [PlayerSocketMenuComponent, SideMenuHelperComponent],
  template: `
    <button
      (click)="toggleAISocketMenu()"
      class="side-menu-left-button top-60 w-12 {{
        editedPlayerId === -1 ? 'h-60' : 'h-[22rem]'
      }} {{ isAISocketMenuVisible ? 'left-72' : 'left-0' }}">
      <span
        class="[writing-mode:vertical-rl] [text-orientation:upright] tracking-[0.325em]"
        >AI&nbsp;SOCKET</span
      >
    </button>
    <div
      class="w-72 {{
        editedPlayerId === -1 ? 'h-60' : 'h-[22rem]'
      }} overflow-y-auto overflow-x-hidden p-4 bg-lightGray font-mono text-sm side-menu-container top-60 {{
        isAISocketMenuVisible ? 'left-0' : '-left-72'
      }}">
      <app-side-menu-helper
        [menuType]="'Data menu'"
        [descriptionPart1]="
          'In this menu, you can connect selected player to be controlled by selected model or algorithm. You can use previously prepared models or connect yours by entering the correct URL for the local WebSocket server (page URL must start with http://).'
        "
        [descriptionPart2]="
          'After successful connection, you must set the data exchange interval and then start the exchange. From now, the player is controlled by the choosen model.'
        "
        [descriptionPart3]="
          'There is also a debug mode where you can manually simulate some action.'
        " />
      <div class="flex flex-col space-y-4">
        @for (player of players; track player.id) {
          @if (
            player.isActive && player.playerType === playerSourceType.SOCKET
          ) {
            <app-player-socket-menu
              class="flex flex-col {{ $first ? 'mt-5' : 'mt-0' }}"
              [player]="player"
              [gameName]="gameName"
              [dataToSend]="dataToSend"
              (receivedDataEmitter)="receiveInputData($event)"
              [gamePause]="gamePause"
              [gameRestart]="gameRestart"
              [editedPlayerId]="editedPlayerId"
              [editedPlayersLength]="players.length"
              (editedPlayerEmitter)="
                updateEditedPlayerId($event)
              "></app-player-socket-menu>
          }
        }
      </div>
    </div>
  `,
})
export class AiSocketMenuComponent implements AfterViewInit {
  @Input({ required: true }) public players: Player[] = [];
  @Input({ required: true }) public gameName = '';
  @Input({ required: true }) public dataToSend!: Game;
  @Input({ required: true }) public gamePause = new Observable<boolean>();
  @Input({ required: true }) public gameRestart = new Observable<void>();

  @Output() public receivedDataEmitter = new EventEmitter<TExchangeData>();

  public isAISocketMenuVisible = false;
  public playerSourceType = PlayerSourceType;
  public editedPlayerId = -1;

  public ngAfterViewInit(): void {
    feather.replace();
  }

  public receiveInputData(data: TExchangeData): void {
    this.receivedDataEmitter.emit(data);
  }

  public toggleAISocketMenu(): void {
    this.isAISocketMenuVisible = !this.isAISocketMenuVisible;
  }

  public updateEditedPlayerId(id: number): void {
    setTimeout(() => {
      this.editedPlayerId = id;
    });
  }
}
