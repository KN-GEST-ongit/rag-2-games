/* eslint-disable max-lines */
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Game } from '@gameModels/game.class';
import { ConsoleComponent } from './components/console/console.component';
import { TExchangeData } from '@gameModels/exchange-data.type';
import { DataMenuComponent } from './components/menus/data-menu/data-menu.component';
import { AiSocketMenuComponent } from './components/menus/ai-socket-menu/ai-socket-menu.component';
import { Subject, Subscription } from 'rxjs';
import { Player } from '@gameModels/player.class';
import { PlayerMenuComponent } from './components/menus/player-menu/player-menu.component';
import { PlayerSourceType } from 'app/shared/models/player-source-type.enum';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { GameMenuComponent } from './components/menus/game-menu/game-menu.component';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { GameControlsComponent } from './components/game-controls/game-controls.component';
import { CantDisplayGameComponent } from './components/cant-display-game/cant-display-game.component';
import {
  Rag2GamesLibComponent,
  games,
} from '../../../projects/rag-2-games-lib/src/public-api';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    PlayerMenuComponent,
    DataMenuComponent,
    AiSocketMenuComponent,
    ConsoleComponent,
    GameMenuComponent,
    CantDisplayGameComponent,
    GameControlsComponent,
    Rag2GamesLibComponent,
  ],
  template: `
    <div class="flex flex-col min-h-all w-full items-center bg-zinc-400">
      @if (isMinWidthXl) {
        @if (game) {
          <div>
            <div class="absolute z-10 top-20 left-0 flex flex-col">
              <app-player-menu
                [players]="game.players"
                (playerSourceChangeEmitter)="updatePlayers($event)" />
              @if (filterPlayersByActiveAndSocket(game.players).length > 0) {
                <app-ai-socket-menu
                  [dataToSend]="gameData"
                  [gameName]="game.name"
                  [players]="filterPlayersByActiveAndSocket(game.players)"
                  (receivedDataEmitter)="receiveSocketInputData($event)"
                  [gamePause]="gamePauseSubject.asObservable()"
                  [gameRestart]="gameRestartSubject.asObservable()" />
              }
            </div>
            <div class="absolute top-20 right-0 flex flex-col">
              <app-game-menu
                (pauseEmitter)="gamePauseSubject.next($event)"
                (restartEmitter)="gameRestartSubject.next()" />
              <app-data-menu
                [game]="game"
                [gamePause]="gamePauseSubject.asObservable()"
                [setDataPossibleToPersist]="gameStateData"
                [isStateChanged]="isStateChanged" />
            </div>
          </div>
          <app-game-controls [game]="game" />
          <rag-2-games-lib
            class="flex w-full items-center justify-center py-12"
            [gameName]="game.name"
            [game]="game"
            [socketInputData]="socketInputData"
            [gameRestart]="gameRestartSubject.asObservable()"
            [gamePause]="gamePauseSubject.asObservable()"
            (gameStateDataEmitter)="receiveGameOutputData($event)" />
        }
        <app-console [logData]="logData" />
      } @else {
        <app-cant-display-game />
      }
    </div>
  `,
})
export class GamePageComponent implements OnInit, OnDestroy, AfterViewInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _routerSubscription = new Subscription();
  private _breakpointSubscription = new Subscription();

  public gameName = '';
  public game!: Game;
  public logData: Record<string, TExchangeData> = {};
  public socketInputData: TExchangeData = {};
  public gameData!: Game;
  public gameStateData: TExchangeData = {};
  public gameRestartSubject = new Subject<void>();
  public gamePauseSubject = new Subject<boolean>();
  public isMinWidthXl = false;

  private _tempGameState: TExchangeData = {};
  public isStateChanged = false;

  private _elapsedTime = 0;
  private _intervalId: unknown;

  public constructor(
    private _breakpointObserver: BreakpointObserver,
    private _cdr: ChangeDetectorRef
  ) {
    this._breakpointSubscription = this._breakpointObserver
      .observe(['(min-width: 1280px)'])
      .subscribe((state: BreakpointState) => {
        this.isMinWidthXl = state.matches;
      });
  }

  public ngOnInit(): void {
    this._route.paramMap.subscribe(params => {
      this.gameName = params.get('gameName') || '';
      this.loadGame();
    });

    this.handleRouterParams();
  }

  public ngAfterViewInit(): void {
    this._cdr.detectChanges();
    this._intervalId = setInterval(() => {
      this._elapsedTime++;
    }, 1000);
  }

  public receiveGameOutputData(data: Game): void {
    this.gameData = JSON.parse(JSON.stringify(data));
    this.gameStateData = JSON.parse(
      JSON.stringify(this.gameData.state as TExchangeData)
    );
    if (
      this._elapsedTime > 3 &&
      this._tempGameState &&
      JSON.stringify(this._tempGameState) !== JSON.stringify({}) &&
      !this.deepEqual(
        this.omitField(this._tempGameState, 'wind'),
        this.omitField(this.gameStateData, 'wind')
      )
    ) {
      setTimeout(() => {
        this.isStateChanged = true;
      }, 0);
    }
    this._tempGameState = this.gameStateData;
    this.logData['game window'] = this.gameStateData;
    this.logData['gameProps'] = {
      outputSpec: this.gameData.outputSpec,
      playerExpectedInput: this.gameData.players[0].expectedDataDescription,
    };
  }

  public receiveSocketInputData(data: TExchangeData): void {
    this.socketInputData = JSON.parse(JSON.stringify(data));
  }

  public ngOnDestroy(): void {
    this._routerSubscription.unsubscribe();
    this._breakpointSubscription.unsubscribe();
  }

  public updatePlayers(players: Player[]): void {
    this.game.players = players;
  }

  public filterPlayersByActiveAndSocket(players: Player[]): Player[] {
    return players.filter(
      player => player.isActive && player.playerType === PlayerSourceType.SOCKET
    );
  }

  //

  private omitField<T extends Record<string, unknown>>(
    obj: T,
    field: string
  ): T {
    if (!obj || typeof obj !== 'object') return obj;
    const { [field]: _, ...rest } = obj;
    return rest as T;
  }

  private deepEqual(obj1: unknown, obj2: unknown): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private loadGame(): void {
    const game = games[this.gameName];
    if (!game) {
      this._router.navigate(['']);
    } else {
      this.game = game;
    }
  }

  private handleRouterParams(): void {
    this._routerSubscription = this._router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        window.location.reload();
      }
    });
  }
}
