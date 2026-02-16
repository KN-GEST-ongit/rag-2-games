/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable complexity */
/* eslint-disable max-lines */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  DoCheck,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { TExchangeData } from '../models/exchange-data.type';
import { Player } from '../models/player.class';
import { Observable, Subscription } from 'rxjs';
import { CanvasComponent } from '../components/canvas/canvas.component';
import { Game } from '../models/game.class';
import { IPlayerInputData } from '../models/player-input-data.type';
import { PlayerSourceType } from '../models/player-source-type.enum';

@Component({
  selector: 'app-base-game-window',
  standalone: true,
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class BaseGameWindowComponent
  implements OnInit, OnDestroy, DoCheck, AfterViewInit
{
  @Input() public gameRestart = new Observable<void>();
  @Input() public gamePause = new Observable<boolean>();
  @Input({ required: true }) public set setAbstractGame(value: Game) {
    this.game = value;
  }
  @Input() public set setSocketInputDataReceive(value: TExchangeData) {
    const playerInputData = this.mapReceivedToPlayerAndData(value);
    if (!playerInputData.data || !playerInputData.player) return;

    this.game.players.forEach(player => {
      if (player.id === playerInputData.player.id) {
        player.inputData = playerInputData.data;
      }
    });
  }

  @Output() public gameStateDataEmitter = new EventEmitter<Game>();
  @ViewChild('gameCanvas') public gameCanvas!: CanvasComponent;

  public constructor(public el: ElementRef) {}

  private _restartSubscription = new Subscription();
  private _pauseSubscription = new Subscription();

  private _fpsLimit = 60;
  public fps = 0;
  private _fpsMeasureInterval = 500;
  private _lastFrameTime = performance.now();
  private _deltaTimeAccumulator = 0;
  private _frameCount = 0;
  private _activeKeyBindings = new Map<string, Record<string, Set<string>>>();
  private _playerInactivityTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  protected _updateTimeout: ReturnType<typeof setTimeout> | undefined;
  protected isPaused = false;
  protected game!: Game;
  protected _canvas!: HTMLCanvasElement;

  /** always call super when override (at top) */
  public ngOnInit(): void {
    this._restartSubscription = this.gameRestart.subscribe(() => {
      setTimeout(() => this.restart());
      console.log('Game restarted');
    });
    this._pauseSubscription = this.gamePause.subscribe(value => {
      this.isPaused = value;
      console.log('Pause state: ', this.isPaused);
    });
  }

  /** always call super when override (at top) */
  public ngAfterViewInit(): void {
    this._canvas = this.gameCanvas.canvasElement.nativeElement;

    window.addEventListener('keydown', event => this.onKeyDown(event));
    window.addEventListener('keyup', event => this.onKeyUp(event));
    window.addEventListener('mousedown', event =>
      this.onMouseDownOutsideCanvas(event)
    );
    document.addEventListener('visibilitychange', () =>
      this.onVisibilityChange()
    );
    window.addEventListener('blur', () => this.onWindowBlur());

    this.update();
    setTimeout(() => this.restart());
  }

  /** always call super when override (at top) */
  public ngOnDestroy(): void {
    this._restartSubscription.unsubscribe();
    this._pauseSubscription.unsubscribe();

    window.removeEventListener('keydown', event => this.onKeyDown(event));
    window.removeEventListener('keyup', event => this.onKeyUp(event));
    window.removeEventListener('mousedown', event =>
      this.onMouseDownOutsideCanvas(event)
    );
    document.removeEventListener('visibilitychange', () =>
      this.onVisibilityChange()
    );
    window.removeEventListener('blur', () => this.onWindowBlur());

    this._playerInactivityTimers.forEach(timer => clearTimeout(timer));
    this._playerInactivityTimers.clear();

    if (this._updateTimeout) {
      clearTimeout(this._updateTimeout);
    }
  }

  /** always call super when override (at top) */
  public ngDoCheck(): void {
    this.emitGameStateData();
  }

  /** called on reset button click; implement to reset all values to initial state */
  public abstract restart(): void;

  /** called efery frame; always call super on override (at top) */
  protected update(): void {
    this.calculateFPS();

    this._updateTimeout = setTimeout(
      () => this.update(),
      1000 / this._fpsLimit
    );
  }

  //

  private onVisibilityChange(): void {
    if (document.hidden) {
      this.resetActiveKeyBindings();
    }
  }

  private onWindowBlur(): void {
    this.resetActiveKeyBindings();
  }

  private onMouseDownOutsideCanvas(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;

    if (
      clickedElement !== this._canvas &&
      !this._canvas.contains(clickedElement)
    ) {
      this.resetActiveKeyBindings();
    }
  }

  private resetActiveKeyBindings(): void {
    this._activeKeyBindings.clear();

    for (const player of this.game.players) {
      if (player.playerType === PlayerSourceType.KEYBOARD) {
        for (const key in player.controlsBinding) {
          const variableName = player.controlsBinding[key].variableName;
          const releasedValue = player.controlsBinding[key].releasedValue;
          player.inputData[variableName] = releasedValue;
        }
      }
    }
  }

  private resetInactivityTimer(player: Player): void {
    if (this._playerInactivityTimers.has(player.id.toString())) {
      clearTimeout(this._playerInactivityTimers.get(player.id.toString()));
    }

    const inactivityTimeout = setTimeout(() => {
      for (const key in player.controlsBinding) {
        const variableName = player.controlsBinding[key].variableName;
        const releasedValue = player.controlsBinding[key].releasedValue;
        player.inputData[variableName] = releasedValue;
      }

      const playerBindings = this._activeKeyBindings.get(player.id.toString());
      if (playerBindings) {
        for (const variableName in playerBindings) {
          playerBindings[variableName]?.clear();
        }
      }
    }, 1000);

    this._playerInactivityTimers.set(player.id.toString(), inactivityTimeout);
  }

  private onKeyDown(event: KeyboardEvent): void {
    for (const player of this.game.players) {
      if (
        player.playerType === PlayerSourceType.KEYBOARD &&
        player.isActive &&
        player.controlsBinding[event.key] !== undefined &&
        document.activeElement?.id !== 'inGameMenuInputFocusAction'
      ) {
        event.preventDefault();

        const control = player.controlsBinding[event.key];
        const variableName = control.variableName;
        const pressedValue = control.pressedValue;

        const playerId = player.id.toString();
        if (!this._activeKeyBindings.has(playerId)) {
          this._activeKeyBindings.set(playerId, {});
        }

        const playerBindings = this._activeKeyBindings.get(playerId)!;
        if (!playerBindings[variableName]) {
          playerBindings[variableName] = new Set<string>();
        }

        playerBindings[variableName].add(event.key);
        player.inputData[variableName] = pressedValue;

        this.resetInactivityTimer(player);
      }
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    for (const player of this.game.players) {
      if (
        player.playerType === PlayerSourceType.KEYBOARD &&
        player.isActive &&
        player.controlsBinding[event.key] !== undefined &&
        document.activeElement?.id !== 'inGameMenuInputFocusAction'
      ) {
        event.preventDefault();

        const control = player.controlsBinding[event.key];
        const variableName = control.variableName;
        const releasedValue = control.releasedValue;

        const playerId = player.id.toString();
        const playerBindings = this._activeKeyBindings.get(playerId);

        if (playerBindings?.[variableName]) {
          playerBindings[variableName].delete(event.key);

          if (playerBindings[variableName].size === 0) {
            player.inputData[variableName] = releasedValue;
          }
        }

        this.resetInactivityTimer(player);
      }
    }
  }

  private calculateFPS(): void {
    const now = performance.now();
    const delta = now - this._lastFrameTime;
    this._lastFrameTime = now;

    this._deltaTimeAccumulator += delta;
    this._frameCount++;

    if (this._deltaTimeAccumulator >= this._fpsMeasureInterval) {
      this.fps = Math.round(
        (this._frameCount * 1000) / this._deltaTimeAccumulator
      );
      this._deltaTimeAccumulator = 0;
      this._frameCount = 0;
    }
  }

  private emitGameStateData(): void {
    this.gameStateDataEmitter.emit(this.game);
  }

  private mapReceivedToPlayerAndData(value: TExchangeData): IPlayerInputData {
    const data = value['data'] as TExchangeData;
    const player = value['player'] as Player;

    return {
      data: data,
      player: player,
    };
  }
}
