/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/component-selector */
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewContainerRef,
  ViewChild,
  ComponentRef,
  OnChanges,
  SimpleChanges,
  Type
} from '@angular/core';
import { TExchangeData } from './models/exchange-data.type';
import { Game } from './models/game.class';
import { Observable } from 'rxjs';

@Component({
  selector: 'rag-2-games-lib',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col items-center w-3/4">
      <ng-container #gameContainer></ng-container>
      @if (isLoading) {
        <div class="flex items-center justify-center p-8">Loading game...</div>
      }
    </div>
  `,
})
export class Rag2GamesLibComponent implements OnChanges {
  @ViewChild('gameContainer', { read: ViewContainerRef, static: true })
  public gameContainer!: ViewContainerRef;

  @Input() public gameName!: string;
  @Input() public game!: Game;
  @Input() public socketInputData!: TExchangeData;
  @Input() public gameRestart!: Observable<void>;
  @Input() public gamePause!: Observable<boolean>;

  @Output() public gameStateDataEmitter = new EventEmitter<Game>();

  public isLoading = false;
  private _currentComponentRef?: ComponentRef<any>;

  public async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['gameName'] && this.gameName) {
      await this.loadGameComponent(this.gameName);
    } else if (this._currentComponentRef) {
      if (changes['gameRestart'] && this.gameRestart) {
        this._currentComponentRef.setInput('gameRestart', this.gameRestart);
      }
      if (changes['gamePause'] && this.gamePause) {
        this._currentComponentRef.setInput('gamePause', this.gamePause);
      }
      if (changes['game'] && this.game) {
        this._currentComponentRef.setInput('setAbstractGame', this.game);
      }
      if (changes['socketInputData']) {
        this._currentComponentRef.setInput('setSocketInputDataReceive', this.socketInputData);
      }
    }
  }

  private async loadGameComponent(gameName: string): Promise<void> {
    this.isLoading = true;

    if (this._currentComponentRef) {
      this._currentComponentRef.destroy();
    }
    this.gameContainer.clear();

    try {
      let ComponentClass: Type<any>;

      switch (gameName) {
        case 'pong':
          ComponentClass = (await import('./games/pong/pong.component')).PongGameWindowComponent;
          break;
        case 'skijump':
          ComponentClass = (await import('./games/skijump/skijump.component')).SkiJumpGameWindowComponent;
          break;
        case 'flappybird':
          ComponentClass = (await import('./games/flappybird/flappybird.component')).FlappyBirdGameWindowComponent;
          break;
        case 'happyjump':
          ComponentClass = (await import('./games/happyjump/happyjump.component')).HappyJumpGameWindowComponent;
          break;
        case 'spaceinvaders':
          ComponentClass = (await import('./games/spaceinvaders/spaceinvaders.component')).SpaceinvadersGameWindowComponent;
          break;
        case 'snake':
          ComponentClass = (await import('./games/snake/snake.component')).SnakeGameWindowComponent;
          break;
        case 'pacman':
          ComponentClass = (await import('./games/pacman/pacman.component')).PacmanGameWindowComponent;
          break;
        case 'towerdefense':
          ComponentClass = (await import('./games/towerdefense/towerdefense.component')).TowerDefenseGameWindowComponent;
          break;
        case 'tetris':
          ComponentClass = (await import('./games/tetris/tetris.component')).TetrisGameWindowComponent;
          break;
        case 'crossyroad':
          ComponentClass = (await import('./games/crossyroad/crossyroad.component')).CrossyRoadGameWindowComponent;
          break;
        default:
          console.error(`Unknown game: ${gameName}`);
          this.isLoading = false;
          return;
      }

      this._currentComponentRef = this.gameContainer.createComponent(ComponentClass);

      this._currentComponentRef.setInput('gameRestart', this.gameRestart);
      this._currentComponentRef.setInput('gamePause', this.gamePause);
      this._currentComponentRef.setInput('setAbstractGame', this.game);
      this._currentComponentRef.setInput('setSocketInputDataReceive', this.socketInputData);

      if (this._currentComponentRef.instance.gameStateDataEmitter) {
        this._currentComponentRef.instance.gameStateDataEmitter.subscribe((data: Game) => {
          this.handleGameStateData(data);
        });
      }

      const element = this._currentComponentRef.location.nativeElement;
      element.classList.add('flex', 'flex-col', 'items-center');

    } catch (error) {
      console.error(`Failed to load game: ${gameName}`, error);
    } finally {
      this.isLoading = false;
    }
  }
  public handleGameStateData(data: Game): void {
    this.gameStateDataEmitter.emit(data);
  }
}
