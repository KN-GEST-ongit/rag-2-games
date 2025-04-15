import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { Game } from '@gameModels/game.class';
import { TExchangeData } from '@gameModels/exchange-data.type';
import { PongGameWindowComponent } from '@games/pong/pong.component';
import { SkiJumpGameWindowComponent } from '@games/skijump/skijump.component';
import { FlappyBirdGameWindowComponent } from '@games/flappybird/flappybird.component';
import { HappyJumpGameWindowComponent } from '@games/happyjump/happyjump.component';
@Component({
  selector: 'app-game-renderer',
  standalone: true,
  imports: [
    PongGameWindowComponent,
    SkiJumpGameWindowComponent,
    FlappyBirdGameWindowComponent,
    HappyJumpGameWindowComponent,
  ],
  template: `
    @switch (gameName) {
      @case ('pong') {
        <app-pong
          class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      }
      @case ('skijump') {
        <app-skijump
          class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      }
      @case ('flappybird') {
        <app-flappybird
          class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      }
      @case ('happyjump') {
        <app-happyjump
          class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      }
    }
  `,
})
export class GameRendererComponent {
  @Input() public gameName!: string;
  @Input() public game!: Game;
  @Input() public socketInputData!: TExchangeData;
  @Input() public gameRestart!: Observable<void>;
  @Input() public gamePause!: Observable<boolean>;

  @Output() public gameStateDataEmitter = new EventEmitter<Game>();

  public handleGameStateData(data: Game): void {
    this.gameStateDataEmitter.emit(data);
  }
}
