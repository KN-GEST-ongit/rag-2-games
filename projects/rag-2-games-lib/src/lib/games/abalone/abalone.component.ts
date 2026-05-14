/* eslint-disable max-lines */
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Abalone, AbaloneState, ICubeCoords, IMarbleAnim, cubeToNotation, notationToCube, areNeighbors, areInLine, ABALONE_WIN_SCORE } from './models/abalone.class';
import { drawHexGrid, drawMarbles, drawMoveGhosts, drawDirectionCompass, drawCursor as drawHexCursor, drawAnimatingMarbles, drawBoardLabels, drawCemetery, drawGameOver } from './models/abalone.drawing.helper';
import { captureBroadsideAnimData, captureInlineAnimData, executeBroadsideMove, executeInlineMove } from './models/abalone.move_executor.helper';
import { TExchangeData } from '../../models/exchange-data.type';
import { PlayerSourceType } from '../../models/player-source-type.enum';

@Component({
  selector: 'app-abalone',
  standalone: true,
  imports: [CanvasComponent, NgIf],
  template: `
    <div class="game-info">
      Turn: <b [style.color]="game.state.currentPlayer === 'BLACK' ? 'black' : 'white'">
        {{ game.state.currentPlayer }}
      </b> | 
      Points - Black: <b>{{ game.state.deadMarbles.WHITE }}</b>, 
      White: <b>{{ game.state.deadMarbles.BLACK }}</b>
      <ng-container *ngIf="shouldDisplayCursor()">
        | Phase: <b>{{ game.state.phase === 'MOVE' ? 'Move' : 'Selection' }}</b>
        | Cursor: <b>{{ cursorNotation }}</b>
      </ng-container>
    </div>
    <div class="game-hint" *ngIf="!game.state.isGameOver && shouldDisplayCursor()">
      {{ getHintText() }}
    </div>
    <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>
    <div *ngIf="game.state.isGameOver" class="flex justify-center gap-4 mt-2">
      <button
        class="px-6 py-2 rounded font-semibold bg-mainOrange text-black hover:brightness-110 transition-all"
        (click)="restart()">
        Play Again
      </button>
      <button *ngIf="!isGameOverDismissed"
        class="px-6 py-2 rounded font-semibold bg-mainOrange text-black hover:brightness-110 transition-all"
        (click)="isGameOverDismissed = true">
        View Board
      </button>
    </div>
<b>FPS: {{ fps }}</b>
    <div *ngIf="getSocketPlayerCount() !== 2" class="flex gap-2 flex-wrap mt-1">
      <button
        class="px-3 py-1 rounded text-sm font-semibold bg-mainOrange text-black hover:brightness-110 transition-all"
        (click)="toggleInfo()">
        [I] How to play
      </button>
      <button
        class="px-3 py-1 rounded text-sm font-semibold bg-mainOrange text-black hover:brightness-110 transition-all"
        (click)="game.isRotationEnabled = !game.isRotationEnabled">
        Rotation: {{ game.isRotationEnabled ? 'ON' : 'OFF' }}
      </button>
      <button
        class="px-3 py-1 rounded text-sm font-semibold bg-mainOrange text-black hover:brightness-110 transition-all"
        (click)="cycleHints()">
        Hints: {{ !game.isHintsEnabled ? 'OFF' : game.isNumpadHints ? 'Numpad' : 'QWEASD' }}
      </button>
      <button
        class="px-3 py-1 rounded text-sm font-semibold bg-mainOrange text-black hover:brightness-110 transition-all"
        (click)="toggleConfirmation()">
        Confirmation: {{ game.isConfirmationRequired ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div *ngIf="isInfoVisible" class="absolute inset-0 w-full h-full flex justify-center items-center bg-darkGray bg-opacity-90 z-50">
      <div class="bg-mainGray text-gray-200 p-5 md:p-10 rounded-lg border-2 border-mainOrange max-w-3xl max-h-[80vh] overflow-y-auto relative">
        <button (click)="toggleInfo()" class="absolute top-2 right-3 w-10 h-10 text-mainOrange text-xl font-bold">X</button>

        <h2 class="text-center text-2xl text-mainOrange mb-4">How to play — Abalone</h2>

        <h3 class="text-xl font-semibold text-mainOrange border-b border-lightGray pb-1 mb-2">Objective</h3>
        <p class="mb-4 text-mainCreme">Push 6 opponent marbles off the board to win. You can move 1, 2 or 3 of your own marbles in a line per turn.</p>

        <h3 class="text-xl font-semibold text-mainOrange border-b border-lightGray pb-1 mb-2">Phase 1 — Selection (SELECT)</h3>
        <p class="mb-1 text-mainCreme">Move the cursor and select up to 3 marbles in a line.</p>
        <ul class="list-disc list-inside mb-4 text-mainCreme">
          <li><b>Q W E D S A</b> or <b>Numpad 8 9 6 3 2 5</b> — move cursor</li>
          <li><b>Space</b> — select / deselect marble under cursor</li>
          <li><b>Enter</b> — confirm selection, go to Move phase</li>
          <li><b>Esc / Backspace</b> — clear selection</li>
        </ul>

        <h3 class="text-xl font-semibold text-mainOrange border-b border-lightGray pb-1 mb-2">Phase 2 — Move (MOVE)</h3>
        <p class="mb-1 text-mainCreme">Choose a direction for your marbles. Ghost marbles with arrows show where they will land.</p>
        <ul class="list-disc list-inside mb-4 text-mainCreme">
          <li><b>Q W E D S A</b> or <b>Numpad 8 9 6 3 2 5</b> — highlight a direction</li>
          <li><b>Enter</b> — execute the move</li>
          <li><b>Esc / Backspace</b> — go back to selection</li>
        </ul>

        <h3 class="text-xl font-semibold text-mainOrange border-b border-lightGray pb-1 mb-2">Other</h3>
        <ul class="list-disc list-inside mb-2 text-mainCreme">
          <li><b>I</b> — toggle this panel</li>
        </ul>
      </div>
    </div>
  `,
})
export class AbaloneGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit
{
  public override game!: Abalone;
  private readonly _hexSize = 30;
  public isInfoVisible = false;
  public isGameOverDismissed = false;

  public toggleInfo(): void {
    this.isInfoVisible = !this.isInfoVisible;
  }

  public cycleHints(): void {
    if (!this.game.isHintsEnabled) {
      this.game.isHintsEnabled = true;
      this.game.isNumpadHints = false;
    } else if (!this.game.isNumpadHints) {
      this.game.isNumpadHints = true;
    } else {
      this.game.isHintsEnabled = false;
      this.game.isNumpadHints = false;
    }
  }

  public toggleConfirmation(): void {
    this.game.isConfirmationRequired = !this.game.isConfirmationRequired;
    if (!this.game.isConfirmationRequired && this.game.state.phase === 'MOVE') {
      this.game.state.phase = 'SELECT';
      this.game.state.selectedDirection = 0;
    }
  }

  private getDisplayLabels(): Record<number, string> {
    if (!this.game.isHintsEnabled) return {};
    const base = this.game.isNumpadHints ? this._numpadLabels : this._dirKeyLabels;
    if (!this.getShouldRotate()) return base;
    const rotated: Record<number, string> = {};
    for (let i = 1; i <= 6; i++) {
      rotated[i] = base[((i - 1 + 3) % 6) + 1];
    }
    return rotated;
  }

  public get cursorNotation(): string {
    return cubeToNotation(this.game.state.cursor);
  }

  private _animation: IMarbleAnim[] = [];
  private _animationProgress = 0;
  private _animationFrame = 0;
  private readonly _animFramesTotal = 20;

  private readonly _directions: Record<number, ICubeCoords> = {
    1: { x: 0, y: -1, z: 1 },
    2: { x: 1, y: -1, z: 0 },
    3: { x: 1, y: 0, z: -1 },
    4: { x: 0, y: 1, z: -1 },
    5: { x: -1, y: 1, z: 0 },
    6: { x: -1, y: 0, z: 1 }
  };

  private readonly _dirKeyLabels: Record<number, string> = {
    1: 'Q', 2: 'W', 3: 'E', 4: 'D', 5: 'S', 6: 'A'
  };

  private readonly _numpadLabels: Record<number, string> = {
    1: '8', 2: '9', 3: '6', 4: '3', 5: '2', 6: '5'
  };

  public getSocketPlayerCount(): number {
    return this.game.players.filter(p => p && p.playerType === PlayerSourceType.SOCKET).length;
  }

  public getHumanPlayerColor(): 'BLACK' | 'WHITE' | null {
    const humanPlayer = this.game.players.find(p => p && p.playerType === PlayerSourceType.KEYBOARD);
    if (!humanPlayer) return null;
    return humanPlayer.id === 0 ? 'WHITE' : 'BLACK';
  }

  public getHintText(): string {
    if (this.game.state.phase === 'MOVE') {
      return this.game.isConfirmationRequired
        ? 'Q/W/E/D/S/A: select direction | Enter: execute | Esc/Backspace: go back'
        : 'Q/W/E/D/S/A: select direction to execute | Esc/Backspace: go back';
    }
    return 'Space: select/deselect | Enter: go to Move phase | Esc/Backspace: cancel';
  }

  public shouldDisplayCursor(): boolean {
    return this.getSocketPlayerCount() !== 2;
  }

  private getShouldRotate(): boolean {
    if (!this.game.isRotationEnabled) return false;
    const socketCount = this.getSocketPlayerCount();

    if (socketCount === 0) {
      return this.game.state.currentPlayer === 'WHITE';
    }

    if (socketCount === 1) {
      const humanColor = this.getHumanPlayerColor();
      return humanColor === 'WHITE';
    }

    return false;
  }

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Abalone;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.render();
  }

  public override restart(): void {
    if (this._canvas) {
      const w = this._canvas.width;
      this._canvas.width = w;
    }
    this.game.state = new AbaloneState();
    this._animation = [];
    this._animationProgress = 0;
    this._animationFrame = 0;
    this.isGameOverDismissed = false;
  }

  private consumeGlobalInputs(): boolean {
    let shouldRestart = false;
    let shouldToggleInfo = false;
    for (const player of this.game.players) {
      if (!player?.inputData) continue;
      if (player.inputData['restart'] === 1) {
        shouldRestart = true;
        player.inputData['restart'] = 0;
      }
      if (player.inputData['info'] === 1) {
        shouldToggleInfo = true;
        player.inputData['info'] = 0;
      }
    }
    if (shouldToggleInfo) this.toggleInfo();
    return shouldRestart;
  }

  protected override update(): void {
    this.consumeGlobalInputs();
    super.update();

    if (!this.isPaused) {
      this.updateAnimation();
      this.handleInput();
    }
    this.render();
  }

  private clearAllPlayersAction(): void {
    for (const p of this.game.players) {
      if (p?.inputData) p.inputData['action'] = 0;
    }
  }

  private handleInput(): void {
    const state = this.game.state;

    if (state.isGameOver) {
      const isTriggered = this.game.players.some(p => {
        const action = p?.inputData?.['action'] as number;
        return action === 1 || action === 2 || action === 3;
      });
      if (isTriggered) {
        this.restart();
        this.clearAllPlayersAction();
      }
      return;
    }

    const input = this.getCurrentTurnInput();

    if (this.handleQueuedMoveInput(state, input)) {
      return; 
    }

    const rawMove = input['move'] as number;
    const action = input['action'] as number;

    this.clearInputCommands(input, rawMove, action);

    const move = this.translateMoveIfRotated(rawMove);

    if (state.phase === 'SELECT') {
      this.handleSelectPhaseInput(move, action);
    } else if (state.phase === 'MOVE') {
      this.handleMovePhaseInput(move, action);
    }
  }

  // Invert the keyboard movement mapping if the board is visually rotated.
  // This translates visual directions into correct physical board coordinates.
  private translateMoveIfRotated(move: number): number {
    if (move >= 1 && move <= 6 && this.getShouldRotate()) {
      return ((move - 1 + 3) % 6) + 1;
    }
    return move;
  }

  private handleQueuedMoveInput(state: AbaloneState, input: TExchangeData): boolean {
    if (!input['marbles'] || !input['direction']) {
      return false;
    }

    const dirIdx = input['direction'] as number;
    const marbles = input['marbles'] as string[];

    input['marbles'] = null;
    input['direction'] = 0;

    if (this.isMoveValid(dirIdx, marbles)) {
      state.selectedMarbles = marbles;
      this.executeMove(dirIdx);
    }

    return true;
  }

  private clearInputCommands(input: TExchangeData, move: number, action: number): void {
    if (move && move !== 0) {
      input['move'] = 0;
    }
    if (action && action !== 0) {
      input['action'] = 0;
    }
  }

  private getCurrentTurnInput(): TExchangeData {
    const playerIndex = this.game.state.currentPlayer === 'WHITE' ? 0 : 1;
    const currentPlayer = this.game.players[playerIndex] ?? this.game.players[0];
    return currentPlayer?.inputData ?? {};
  }

  private resetInactivePlayerInput(): void {
    const activePlayerIndex = this.game.state.currentPlayer === 'WHITE' ? 0 : 1;
    for (let i = 0; i < this.game.players.length; i++) {
      if (i === activePlayerIndex) continue;
      const player = this.game.players[i];
      if (player) {
        player.inputData['move'] = 0;
        player.inputData['action'] = 0;
      }
    }
  }

  private handleSelectPhaseInput(move: number, action: number): void {
    if (move !== 0) this.moveCursor(move);
    if (action !== 0) this.handleAction(action);
  }

  private moveCursor(dirIdx: number): void {
    const d = this._directions[dirIdx];
    if (!d) return;

    const cur = this.game.state.cursor;
    const next = { x: cur.x + d.x, y: cur.y + d.y, z: cur.z + d.z };

    if (Math.max(Math.abs(next.x), Math.abs(next.y), Math.abs(next.z)) <= 4) {
      this.game.state.cursor = next;
    }
  }

  private handleAction(action: number): void {
    const state = this.game.state;
    const currentKey = cubeToNotation(state.cursor);

    if (action === 1) {
      if (state.board[currentKey] === state.currentPlayer) {
        this.toggleSelection(currentKey);
      }
    } else if (action === 2) {
      const possible = this.computePossibleMoves();
      if (possible.length > 0) {
        state.possibleMoves = possible;
        state.selectedDirection = 0;
        state.phase = 'MOVE';
        return;
      }
    } else if (action === 3) {
      state.selectedMarbles = [];
    }

    state.possibleMoves = this.computePossibleMoves();
  }

  private handleMovePhaseInput(move: number, action: number): void {
    const state = this.game.state;

    if (move !== 0 && state.possibleMoves.includes(move)) {
      if (!this.game.isConfirmationRequired) {
        this.executeMove(move);
        return;
      }
      state.selectedDirection = move;
    }

    if (action === 2 && state.selectedDirection !== 0) {
      this.executeMove(state.selectedDirection);
    } else if (action === 3) {
      state.phase = 'SELECT';
      state.selectedDirection = 0;
    }
  }

  private computePossibleMoves(): number[] {
    const valid: number[] = [];
    if (this.game.state.selectedMarbles.length > 0) {
      for (let dirIdx = 1; dirIdx <= 6; dirIdx++) {
        if (this.isMoveValid(dirIdx)) {
          valid.push(dirIdx);
        }
      }
    }
    return valid;
  }

  private getIntentDirection(cursor: ICubeCoords): number | null {
    const validMoves = this.game.state.possibleMoves;
    if (validMoves.length === 0) return null;

    const exactMatches: number[] = [];
    for (const dirIdx of validMoves) {
      const d = this._directions[dirIdx];
      const selected = this.game.state.selectedMarbles.map(k => notationToCube(k));
      let covers = false;
      for (const cube of selected) {
        if (cube.x + d.x === cursor.x && cube.y + d.y === cursor.y && cube.z + d.z === cursor.z) {
          covers = true;
          break;
        }
      }
      
      if (!covers && selected.length > 1) {
        let isInline = false;
        const axis = this.getLineAxis(selected);
        if (this.isInlineDirection(axis, d)) {
          isInline = true;
        }

        if (isInline) {
          const sorted = this.sortMarblesAlongDir(selected, d);
          const front = sorted[sorted.length - 1];
          let pushPos = { x: front.x + d.x, y: front.y + d.y, z: front.z + d.z };
          while (this.isOnBoard(pushPos) && this.game.state.board[cubeToNotation(pushPos)] && this.game.state.board[cubeToNotation(pushPos)] !== this.game.state.currentPlayer) {
            if (pushPos.x === cursor.x && pushPos.y === cursor.y && pushPos.z === cursor.z) {
              covers = true;
              break;
            }
            pushPos = { x: pushPos.x + d.x, y: pushPos.y + d.y, z: pushPos.z + d.z };
          }
          if (pushPos.x === cursor.x && pushPos.y === cursor.y && pushPos.z === cursor.z) {
            covers = true;
          }
        }
      }

      if (covers) {
        exactMatches.push(dirIdx);
      }
    }

    if (exactMatches.length === 1) return exactMatches[0];

    if (exactMatches.length > 1) {
      const selectedCubes = this.game.state.selectedMarbles.map(k => notationToCube(k));
      const cx = selectedCubes.reduce((a, b) => a + b.x, 0) / selectedCubes.length;
      const cy = selectedCubes.reduce((a, b) => a + b.y, 0) / selectedCubes.length;
      const cz = selectedCubes.reduce((a, b) => a + b.z, 0) / selectedCubes.length;

      const tx = cursor.x - cx;
      const ty = cursor.y - cy;
      const tz = cursor.z - cz;

      let maxDot = -Infinity;
      let bestDir: number | null = null;

      for (const dirIdx of exactMatches) {
        const d = this._directions[dirIdx];
        const dot = tx * d.x + ty * d.y + tz * d.z;
        if (dot > maxDot) {
          maxDot = dot;
          bestDir = dirIdx;
        }
      }
      return bestDir;
    }

    return null;
  }

  private toggleSelection(key: string): void {
    const state = this.game.state;
    const colorAtCursor = state.board[key];

    if (colorAtCursor !== state.currentPlayer) return;

    const idx = state.selectedMarbles.indexOf(key);

    // Deselect if already selected
    if (idx > -1) {
      state.selectedMarbles.splice(idx, 1);
      if (state.selectedMarbles.length === 2) {
        const c0 = notationToCube(state.selectedMarbles[0]);
        const c1 = notationToCube(state.selectedMarbles[1]);
        if (!areNeighbors(c0, c1)) state.selectedMarbles = [];
      }
      return;
    }

    if (state.selectedMarbles.length >= 3) return;

    this.addToSelection(key);
  }

  private addToSelection(key: string): void {
    const state = this.game.state;

    if (state.selectedMarbles.length === 0) {
      // First marble — always OK
      state.selectedMarbles.push(key);
    } else if (state.selectedMarbles.length === 1) {
      this.tryAddSecondMarble(key);
    } else if (state.selectedMarbles.length === 2) {
      this.tryAddThirdMarble(key);
    }
  }

  private tryAddSecondMarble(key: string): void {
    const state = this.game.state;
    const first = notationToCube(state.selectedMarbles[0]);
    const next = notationToCube(key);
    if (areNeighbors(first, next)) {
      state.selectedMarbles.push(key);
    }
  }

  private tryAddThirdMarble(key: string): void {
    const state = this.game.state;
    const c0 = notationToCube(state.selectedMarbles[0]);
    const c1 = notationToCube(state.selectedMarbles[1]);
    const c2 = notationToCube(key);
    if (areInLine(c0, c1, c2)) {
      state.selectedMarbles.push(key);
    }
  }

  private executeMove(dirIdx: number): void {
    const state = this.game.state;
    const selected = state.selectedMarbles.map(k => notationToCube(k));
    const dir = this._directions[dirIdx];

    // Capture animation data BEFORE executing the move
    if (selected.length === 1) {
      this._animation = captureInlineAnimData(state, selected, dir, this.sortMarblesAlongDir, this.isOnBoard);
      executeInlineMove(state, selected, dir, this.sortMarblesAlongDir, this.isOnBoard);
    } else {
      const axis = this.getLineAxis(selected);
      if (this.isInlineDirection(axis, dir)) {
        this._animation = captureInlineAnimData(state, selected, dir, this.sortMarblesAlongDir, this.isOnBoard);
        executeInlineMove(state, selected, dir, this.sortMarblesAlongDir, this.isOnBoard);
      } else {
        this._animation = captureBroadsideAnimData(state, selected, dir);
        executeBroadsideMove(state, selected, dir);
      }
    }

    // Start animation instead of immediately switching turns
    this._animationProgress = 0;
    this._animationFrame = 0;
    state.phase = 'ANIMATING';
    state.possibleMoves = [];
  }

public isMoveValid(dirIdx: number, overrideSelection?: string[]): boolean {
    const selectionKeys = overrideSelection ?? this.game.state.selectedMarbles;
    const selected = selectionKeys.map(k => notationToCube(k));
    
    if (selected.length === 0) {
      return false;
    }

    const dir = this._directions[dirIdx];

    if (selected.length === 1) {
      return this.isInlineMoveValid(selected, dir);
    }

    const axis = this.getLineAxis(selected);
    if (this.isInlineDirection(axis, dir)) {
      return this.isInlineMoveValid(selected, dir);
    }
    return this.isBroadsideMoveValid(selected, dir);
  }

  private isInlineMoveValid(selected: ICubeCoords[], dir: ICubeCoords): boolean {
    const state = this.game.state;
    const sorted = this.sortMarblesAlongDir(selected, dir);
    const front = sorted[sorted.length - 1];

    const pos: ICubeCoords = { x: front.x + dir.x, y: front.y + dir.y, z: front.z + dir.z };

    if (!this.isOnBoard(pos)) return false;

    const posKey = cubeToNotation(pos);
    if (!state.board[posKey]) return true;
    if (state.board[posKey] === state.currentPlayer) return false;

    return this.canPushOpponents(pos, dir, selected.length);
  }

  private canPushOpponents(startPos: ICubeCoords, dir: ICubeCoords, ownCount: number): boolean {
    const state = this.game.state;
    let pos = { ...startPos };
    let opponentCount = 0;

    while (
      this.isOnBoard(pos) &&
      state.board[cubeToNotation(pos)] &&
      state.board[cubeToNotation(pos)] !== state.currentPlayer
    ) {
      opponentCount++;
      pos = { x: pos.x + dir.x, y: pos.y + dir.y, z: pos.z + dir.z };
    }

    if (ownCount <= opponentCount) return false;

    if (this.isOnBoard(pos) && state.board[cubeToNotation(pos)]) {
      return false;
    }

    return true;
  }

  private isBroadsideMoveValid(selected: ICubeCoords[], dir: ICubeCoords): boolean {
    const state = this.game.state;

    for (const marble of selected) {
      const dest: ICubeCoords = { x: marble.x + dir.x, y: marble.y + dir.y, z: marble.z + dir.z };
      const destKey = cubeToNotation(dest);

      if (!this.isOnBoard(dest)) return false;
      if (state.board[destKey]) return false;
    }
    return true;
  }

  private getLineAxis(marbles: ICubeCoords[]): ICubeCoords {
    return {
      x: marbles[1].x - marbles[0].x,
      y: marbles[1].y - marbles[0].y,
      z: marbles[1].z - marbles[0].z,
    };
  }

  private isInlineDirection(axis: ICubeCoords, dir: ICubeCoords): boolean {
    return (
      (dir.x === axis.x && dir.y === axis.y && dir.z === axis.z) ||
      (dir.x === -axis.x && dir.y === -axis.y && dir.z === -axis.z)
    );
  }

  private sortMarblesAlongDir(marbles: ICubeCoords[], dir: ICubeCoords): ICubeCoords[] {
    return [...marbles].sort((a, b) => {
      const projA = a.x * dir.x + a.y * dir.y + a.z * dir.z;
      const projB = b.x * dir.x + b.y * dir.y + b.z * dir.z;
      return projA - projB;
    });
  }

  private isOnBoard(pos: ICubeCoords): boolean {
    return Math.max(Math.abs(pos.x), Math.abs(pos.y), Math.abs(pos.z)) <= 4;
  }


  private updateAnimation(): void {
    if (this.game.state.phase !== 'ANIMATING') return;

    this._animationFrame++;
    this._animationProgress = Math.min(this._animationFrame / this._animFramesTotal, 1);

    if (this._animationProgress >= 1) {
      this.finishAnimation();
    }
  }

  private finishAnimation(): void {
    const state = this.game.state;
    this._animation = [];
    this._animationProgress = 0;
    this._animationFrame = 0;

    if (state.deadMarbles.BLACK >= ABALONE_WIN_SCORE || state.deadMarbles.WHITE >= ABALONE_WIN_SCORE) {
      state.isGameOver = true;
      state.winner = state.deadMarbles.BLACK >= ABALONE_WIN_SCORE ? 'WHITE' : 'BLACK';
      state.selectedMarbles = [];
      state.possibleMoves = [];
      state.selectedDirection = 0;
      state.phase = 'SELECT';
      return;
    }

    state.currentPlayer = state.currentPlayer === 'BLACK' ? 'WHITE' : 'BLACK';
    this.resetInactivePlayerInput();
    state.selectedMarbles = [];
    state.possibleMoves = [];
    state.selectedDirection = 0;
    state.phase = 'SELECT';
  }

  private render(): void {
    const ctx = this._canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.save();
    ctx.translate(this._canvas.width / 2, this._canvas.height / 2);

    // Rotation logic: depends on socket configuration
    if (this.getShouldRotate()) {
      ctx.rotate(Math.PI);
    }

    drawHexGrid(ctx, this._hexSize);
    drawBoardLabels(ctx, this._hexSize, this.getShouldRotate());

    if (this.game.state.phase === 'ANIMATING' && this._animation.length > 0) {
      const skipKeys = drawAnimatingMarbles(ctx, this._animation, this._animationProgress, this._hexSize);
      drawMarbles(ctx, this.game.state, this._hexSize, skipKeys);
    } else {
      drawMarbles(ctx, this.game.state, this._hexSize);
      drawMoveGhosts(ctx, this.game.state, this._hexSize, this._directions, k => notationToCube(k), p => this.isOnBoard(p));
      drawDirectionCompass(ctx, this.game.state, this._hexSize, this._directions, this.getDisplayLabels(), k => notationToCube(k), this.getShouldRotate());
      if (this.shouldDisplayCursor() && this.game.state.phase === 'SELECT') {
        drawHexCursor(ctx, this.game.state, this._hexSize);
      }
    }

    ctx.restore();

    drawCemetery(ctx, this.game.state, this._canvas.width, this._canvas.height, this._hexSize);

    if (this.game.state.isGameOver && !this.isGameOverDismissed) {
      drawGameOver(ctx, this._canvas, this.game.state);
    }
  }
}