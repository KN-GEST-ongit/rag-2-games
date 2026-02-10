/* eslint-disable @angular-eslint/component-selector */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TExchangeData } from './models/exchange-data.type';
import { Game } from './models/game.class';
import { Observable } from 'rxjs';
import { PongGameWindowComponent } from './games/pong/pong.component';
import { SkiJumpGameWindowComponent } from './games/skijump/skijump.component';
import { FlappyBirdGameWindowComponent } from './games/flappybird/flappybird.component';
import { HappyJumpGameWindowComponent } from './games/happyjump/happyjump.component';
import { SpaceinvadersGameWindowComponent } from './games/spaceinvaders/spaceinvaders.component';
import { SnakeGameWindowComponent } from './games/snake/snake.component';
import { PacmanGameWindowComponent } from './games/pacman/pacman.component';
import { TowerDefenseGameWindowComponent } from './games/towerdefense/towerdefense.component';
import { CrossyRoadGameWindowComponent } from './games/crossyroad/crossyroad.component';

@Component({
  selector: 'rag-2-games-lib',
  standalone: true,
  imports: [
    PongGameWindowComponent,
    SkiJumpGameWindowComponent,
    FlappyBirdGameWindowComponent,
    HappyJumpGameWindowComponent,
  	SpaceinvadersGameWindowComponent,
  	SnakeGameWindowComponent,
  	PacmanGameWindowComponent,
    TowerDefenseGameWindowComponent,
    CrossyRoadGameWindowComponent],
    
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
			@case ('spaceinvaders') {
        <app-spaceinvaders
        class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      }
			@case ('snake') {
        <app-snake
          class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      } 
			@case ('pacman') {
        <app-pacman
          class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      }
			@case ('towerdefense') {
        <app-towerdefense
          class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      }
			@case ('crossyroad') {
        <app-crossyroad
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
export class Rag2GamesLibComponent {
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
