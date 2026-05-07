/* eslint-disable max-lines */
import { AfterViewInit, Component, OnInit, HostListener } from '@angular/core';
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
        | Phase: <b>{{ game.state.phase === 'SELECT' ? 'Selection' : 'Move' }}</b> |
        Cursor: <b>{{ cursorNotation }}</b>
      </ng-container>
    </div>
    <div class="game-hint" *ngIf="!game.state.isGameOver && shouldDisplayCursor()">
      {{ game.state.phase === 'SELECT'
        ? 'Space: select/deselect | Enter: confirm selection | Esc: cancel'
        : 'Q/W/E/D/S/A: execute move | Esc: return' }}
    </div>
    <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b>
  `,
})
export class AbaloneGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit
{
  public override game!: Abalone;
  private readonly _hexSize = 30;

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

  public getSocketPlayerCount(): number {
    return this.game.players.filter(p => p && p.playerType === PlayerSourceType.SOCKET).length;
  }

  public getHumanPlayerColor(): 'BLACK' | 'WHITE' | null {
    const humanPlayer = this.game.players.find(p => p && p.playerType === PlayerSourceType.KEYBOARD);
    if (!humanPlayer) return null;
    return humanPlayer.id === 0 ? 'WHITE' : 'BLACK';
  }

  public shouldDisplayCursor(): boolean {
    return this.getSocketPlayerCount() !== 2;
  }

  private getShouldRotate(): boolean {
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
    this.game.state = new AbaloneState();
    this._animation = [];
    this._animationProgress = 0;
    this._animationFrame = 0;
  }

  @HostListener('window:keydown', ['$event'])
  public overrideGameOverRestart(event: KeyboardEvent): void {
    if (
      this.game.state.isGameOver &&
      (event.key === ' ' || event.key === 'Enter') &&
      document.activeElement?.id !== 'inGameMenuInputFocusAction'
    ) {
      event.preventDefault();
      this.restart();
    }
  }

  protected override update(): void {
    super.update();

    if (this.game.state.isGameOver) {
      if (this.consumeGameOverRestartRequest()) {
        this.restart();
      }
      this.render();
      return;
    }

    if (!this.isPaused) {
      this.updateActiveState();
    }
    this.render();
  }

  private updateActiveState(): void {
    this.updateAnimation();
    this.handleInput();
  }

  private consumeGameOverRestartRequest(): boolean {
    let hasRestartRequest = false;

    for (const player of this.game.players) {
      if (player && player.inputData) {
        const action = player.inputData['action'];
        if (action === 1 || action === 2) {
          hasRestartRequest = true;
          player.inputData['action'] = 0;
        }
      }
    }

    return hasRestartRequest;
  }

  private handleInput(): void {
    const state = this.game.state;
    if (state.isGameOver) return;

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
    if (move !== 0) {
      this.moveCursor(move);
    }
    if (action !== 0) {
      this.handleAction(action);
    }
  }

  private handleMovePhaseInput(move: number, action: number): void {
    if (move !== 0 && this.game.state.possibleMoves.includes(move)) {
      this.executeMove(move);
    }
    if (action === 3) {
      this.game.state.phase = 'SELECT';
      this.game.state.possibleMoves = [];
    }
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
      this.toggleSelection(currentKey);
    } else if (action === 2) {
      if (state.selectedMarbles.length > 0) {
        this.enterMovePhase();
      }
    } else if (action === 3) {
      state.selectedMarbles = [];
    }
  }

  private toggleSelection(key: string): void {
    const state = this.game.state;
    const colorAtCursor = state.board[key];

    if (colorAtCursor !== state.currentPlayer) return;

    const idx = state.selectedMarbles.indexOf(key);

    // Deselect if already selected
    if (idx > -1) {
      state.selectedMarbles.splice(idx, 1);
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
  }


  private enterMovePhase(): void {
    const possibleMoves = this.computePossibleMoves();
    if (possibleMoves.length > 0) {
      this.game.state.possibleMoves = possibleMoves;
      this.game.state.phase = 'MOVE';
    }
  }

  private computePossibleMoves(): number[] {
    const valid: number[] = [];
    for (let dirIdx = 1; dirIdx <= 6; dirIdx++) {
      if (this.isMoveValid(dirIdx)) {
        valid.push(dirIdx);
      }
    }
    return valid;
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
      return;
    }

    state.currentPlayer = state.currentPlayer === 'BLACK' ? 'WHITE' : 'BLACK';
    this.resetInactivePlayerInput();
    state.selectedMarbles = [];
    state.possibleMoves = [];
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
      drawDirectionCompass(ctx, this.game.state, this._hexSize, this._directions, this._dirKeyLabels, k => notationToCube(k));
      if (this.shouldDisplayCursor()) {
        drawHexCursor(ctx, this.game.state, this._hexSize);
      }
    }

    ctx.restore();

    drawCemetery(ctx, this.game.state, this._canvas.width, this._canvas.height, this._hexSize);

    if (this.game.state.isGameOver) {
      drawGameOver(ctx, this._canvas, this.game.state);
    }
  }
}