/* eslint-disable max-lines */
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Abalone, AbaloneState, ICubeCoords, IMarbleAnim, cubeToNotation, notationToCube } from './models/abalone.class';
import { drawHexGrid, drawMarbles, drawMoveGhosts, drawDirectionCompass, drawCursor as drawHexCursor, drawAnimatingMarbles, drawBoardLabels, drawCemetery } from './models/abalone.drawing.helper';
import { captureBroadsideAnimData, captureInlineAnimData, executeBroadsideMove, executeInlineMove } from './models/abalone.move_executor.helper';
import { TExchangeData } from '../../models/exchange-data.type';

@Component({
  selector: 'app-abalone',
  standalone: true,
  imports: [CanvasComponent, NgIf],
  template: `
    <div class="game-info">
      Tura: <b [style.color]="game.state.currentPlayer === 'BLACK' ? 'black' : 'white'">
        {{ game.state.currentPlayer }}
      </b> | 
      Punkty - Czarne: <b>{{ game.state.deadMarbles.WHITE }}</b>, 
      Białe: <b>{{ game.state.deadMarbles.BLACK }}</b> |
      Faza: <b>{{ game.state.phase === 'SELECT' ? 'Zaznaczanie' : 'Ruch' }}</b> |
      Kursor: <b>{{ cursorNotation }}</b>
    </div>
    <div class="game-hint" *ngIf="!game.state.isGameOver">
      {{ game.state.phase === 'SELECT'
        ? 'Space: zaznacz/odznacz | Enter: zatwierdź wybór | Esc: anuluj'
        : 'Q/W/E/D/S/A: wykonaj ruch | Esc: wróć' }}
    </div>
    <div class="game-over" *ngIf="game.state.isGameOver" style="color: #2200ff; font-size: 1.2em; font-weight: bold;">
      Koniec gry! Wygrywa: {{ game.state.winner === 'BLACK' ? 'Czarne' : 'Białe' }}!
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

  // 6 znormalizowanych kierunków osi hex (używane do walidacji linii)
  private readonly _hexAxisDirs: ICubeCoords[] = [
    { x: 1, y: -1, z: 0 },
    { x: 1, y: 0, z: -1 },
    { x: 0, y: 1, z: -1 },
  ];

  private readonly _dirKeyLabels: Record<number, string> = {
    1: 'Q', 2: 'W', 3: 'E', 4: 'D', 5: 'S', 6: 'A'
  };

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

  protected override update(): void {
    super.update();

    if (!this.isPaused) {
      this.updateAnimation();
      this.handleInput();
    }
    this.render();
  }

  private handleInput(): void {
    const state = this.game.state;
    if (state.isGameOver) return;

    const input = this.getCurrentTurnInput();

    // 🔴 === OBSŁUGA BOTA Z WEBSOCKETA === 🔴
    // Sprawdzamy, czy w danych wejściowych z Pythona przyszedł gotowy ruch
    if (input['marbles'] && input['direction']) {
      const dirIdx = input['direction'] as number;
      const marbles = input['marbles'] as string[];
      
      // Czyścimy input, by uniknąć wielokrotnego wykonania tego samego ruchu w kolejnych klatkach
      input['marbles'] = null;
      input['direction'] = 0;

      // Sprawdzamy, czy wylosowany przez bota ruch jest na pewno legalny
      if (this.isMoveValid(dirIdx, marbles)) {
        state.selectedMarbles = marbles;
        this.executeMove(dirIdx);
      }
      return; // ⚠️ Ważne: kończymy tutaj, żeby nie wykonywać kodu od klawiatury!
    }
    // =========================================


    // 🟢 === OBSŁUGA ZWYKŁEGO GRACZA (KLAWIATURA) === 🟢
    let move = input['move'] as number;
    const action = input['action'] as number;

    if (move !== 0) {
      // Odwróć kierunek gdy plansza jest obrócona (tura białych)
      if (state.currentPlayer === 'WHITE') {
        move = ((move - 1 + 3) % 6) + 1;
      }
      input['move'] = 0;
    }
    if (action !== 0) {
      input['action'] = 0;
    }

    if (state.phase === 'SELECT') {
      this.handleSelectPhaseInput(move, action);
    } else if (state.phase === 'MOVE') {
      this.handleMovePhaseInput(move, action);
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

    // Odznacz jeśli już zaznaczona
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
      // Pierwsza kulka — zawsze OK
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
    if (this.areNeighbors(first, next)) {
      state.selectedMarbles.push(key);
    }
  }

  private tryAddThirdMarble(key: string): void {
    const state = this.game.state;
    const c0 = notationToCube(state.selectedMarbles[0]);
    const c1 = notationToCube(state.selectedMarbles[1]);
    const c2 = notationToCube(key);
    if (this.areInLine(c0, c1, c2)) {
      state.selectedMarbles.push(key);
    }
  }

  private areNeighbors(a: ICubeCoords, b: ICubeCoords): boolean {
    return this.cubeDistance(a, b) === 1;
  }

  private cubeDistance(a: ICubeCoords, b: ICubeCoords): number {
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
  }

  private areInLine(a: ICubeCoords, b: ICubeCoords, c: ICubeCoords): boolean {
    const points = [a, b, c];

    for (const axis of this._hexAxisDirs) {
      const projections = points.map(p => p.x * axis.x + p.y * axis.y + p.z * axis.z);
      projections.sort((x, y) => x - y);

      if (projections[1] - projections[0] === 1 && projections[2] - projections[1] === 1) {
        const sorted = [...points].sort((p1, p2) => {
          return (p1.x * axis.x + p1.y * axis.y + p1.z * axis.z) -
                 (p2.x * axis.x + p2.y * axis.y + p2.z * axis.z);
        });
        const d1 = { x: sorted[1].x - sorted[0].x, y: sorted[1].y - sorted[0].y, z: sorted[1].z - sorted[0].z };
        const d2 = { x: sorted[2].x - sorted[1].x, y: sorted[2].y - sorted[1].y, z: sorted[2].z - sorted[1].z };

        if (d1.x === d2.x && d1.y === d2.y && d1.z === d2.z &&
            this.cubeDistance({ x: 0, y: 0, z: 0 }, d1) === 1) {
          return true;
        }
      }
    }
    return false;
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

  // ── Faza ruchu ──────────────────────────────────────────────

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
    // 1. Zamiast brać zawsze state.selectedMarbles, bierzemy overrideSelection (jeśli bot go podał)
    const selectionKeys = overrideSelection ?? this.game.state.selectedMarbles;
    const selected = selectionKeys.map(k => notationToCube(k));
    
    // 2. Zabezpieczenie na wypadek, gdyby bot lub gracz spróbowali sprawdzić pusty ruch
    if (selected.length === 0) {
      return false;
    }

    const dir = this._directions[dirIdx];

    // Reszta logiki walidacji pozostaje Twoja – nic tu nie zmieniamy!
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

    if (state.deadMarbles.BLACK >= 6 || state.deadMarbles.WHITE >= 6) {
      state.isGameOver = true;
      state.winner = state.deadMarbles.BLACK >= 6 ? 'WHITE' : 'BLACK';
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

    // Obrót planszy o 180° gdy tura białych
    if (this.game.state.currentPlayer === 'WHITE') {
      ctx.rotate(Math.PI);
    }

    drawHexGrid(ctx, this._hexSize);
    drawBoardLabels(ctx, this._hexSize, this.game.state.currentPlayer === 'WHITE');

    if (this.game.state.phase === 'ANIMATING' && this._animation.length > 0) {
      const skipKeys = drawAnimatingMarbles(ctx, this._animation, this._animationProgress, this._hexSize);
      drawMarbles(ctx, this.game.state, this._hexSize, skipKeys);
    } else {
      drawMarbles(ctx, this.game.state, this._hexSize);
      drawMoveGhosts(ctx, this.game.state, this._hexSize, this._directions, k => notationToCube(k), p => this.isOnBoard(p));
      drawDirectionCompass(ctx, this.game.state, this._hexSize, this._directions, this._dirKeyLabels, k => notationToCube(k));
      drawHexCursor(ctx, this.game.state, this._hexSize);
    }

    ctx.restore();

    drawCemetery(ctx, this.game.state, this._canvas.width, this._canvas.height, this._hexSize);
  }
}