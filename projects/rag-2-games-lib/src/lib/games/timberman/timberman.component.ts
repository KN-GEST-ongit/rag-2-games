/* eslint-disable complexity */
/* eslint-disable max-lines */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Timberman, TimbermanState, generateSegment, generateTree, INITIAL_TIME, MAX_TIME } from './models/timberman.class';

@Component({
  selector: 'app-timberman',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    @if (isMultiplayer) {
      <div style="display: flex; justify-content: space-around; width: 85%">
        <span>P1 Score: <b>{{ game.state.score0 }}</b></span>
        <span>P2 Score: <b>{{ game.state.score1 }}</b></span>
      </div>
    } @else {
      <div>Score: <b>{{ game.state.score0 }}</b></div>
    }
    <app-canvas [displayMode]="canvasDisplayMode" #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b>
  `,
})
export class TimbermanGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Timberman;

  public get isMultiplayer(): boolean {
    return this.game.players.length > 1 && this.game.players[1].isActive;
  }

  public get canvasDisplayMode(): 'vertical' | 'horizontal' {
    return this.isMultiplayer ? 'horizontal' : 'vertical';
  }

  private _previousGameMode = '';
  private _wasChopPressed: [boolean, boolean] = [false, false];
  private _wasRestartPressed: [boolean, boolean] = [false, false];
  private _chopAnimTimer: [number, number] = [0, 0];
  private _chopAnimSide: ['left' | 'right', 'left' | 'right'] = ['left', 'left'];
  private _isStarted: [boolean, boolean] = [false, false];

  private readonly _timeDrain = 0.33;
  private readonly _initialTimeBonus = 12;
  private _timeBonusPerPlayer: [number, number] = [12, 12];
  private _levelUpTimer: [number, number] = [0, 0];

  private readonly _sectionW = 400;
  private readonly _canvasH = 600;
  private readonly _groundY = 510;
  private readonly _trunkCenterX = 200;
  private readonly _trunkW = 60;
  private readonly _segmentH = 60;
  private readonly _branchLen = 80;
  private readonly _branchH = 25;
  private readonly _playerW = 45;
  private readonly _playerH = 65;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Timberman;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.render();
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  public override restart(): void {
    this.game.state = new TimbermanState();
    this._wasChopPressed = [false, false];
    this._wasRestartPressed = [false, false];
    this._chopAnimTimer = [0, 0];
    this._chopAnimSide = ['left', 'left'];
    this._isStarted = [false, false];
    this._timeBonusPerPlayer = [this._initialTimeBonus, this._initialTimeBonus];
    this._levelUpTimer = [0, 0];
    this.resizeCanvas();
    this.render();
  }

  private restartPlayer(playerIndex: number): void {
    const st = this.game.state as TimbermanState;
    if (playerIndex === 0) {
      st.position0 = 'left'; st.score0 = 0; st.timeLeft0 = INITIAL_TIME;
      st.isGameOver0 = false; st.isDead0 = false;
      st.treeSegments0 = generateTree();
      st.level0 = 1; st.chopsThisLevel0 = 0; st.chopsToNextLevel0 = 20;
    } else {
      st.position1 = 'left'; st.score1 = 0; st.timeLeft1 = INITIAL_TIME;
      st.isGameOver1 = false; st.isDead1 = false;
      st.treeSegments1 = generateTree();
      st.level1 = 1; st.chopsThisLevel1 = 0; st.chopsToNextLevel1 = 20;
    }
    this._wasChopPressed[playerIndex] = false;
    this._wasRestartPressed[playerIndex] = false;
    this._chopAnimTimer[playerIndex] = 0;
    this._chopAnimSide[playerIndex] = 'left';
    this._isStarted[playerIndex] = false;
    this._timeBonusPerPlayer[playerIndex] = this._initialTimeBonus;
    this._levelUpTimer[playerIndex] = 0;
  }

  private resizeCanvas(): void {
    if (!this._canvas) return;
    this._canvas.width = this.isMultiplayer ? this._sectionW * 2 : this._sectionW;
    this._canvas.height = this._canvasH;
  }

  protected override update(): void {
    super.update();

    const currentMode = this.isMultiplayer ? 'multiplayer' : 'singleplayer';
    if (this._previousGameMode !== currentMode) {
      this._previousGameMode = currentMode;
      this.resizeCanvas();
      this.restart();
      return;
    }

    if (!this.isPaused) {
      this.updatePlayer(0);
      if (this.isMultiplayer) this.updatePlayer(1);
    }

    this.render();
  }

  private updatePlayer(playerIndex: number): void {
    const st = this.game.state as TimbermanState;
    const isGameOver = playerIndex === 0 ? st.isGameOver0 : st.isGameOver1;

    if (isGameOver) {
      const restartVal = (this.game.players[playerIndex]?.inputData['restart'] as number) ?? 0;
      const isRestartPressed = restartVal !== 0;
      if (isRestartPressed && !this._wasRestartPressed[playerIndex]) this.restartPlayer(playerIndex);
      this._wasRestartPressed[playerIndex] = isRestartPressed;
      return;
    }

    if (this._isStarted[playerIndex]) {
      if (playerIndex === 0) {
        st.timeLeft0 = Math.max(0, st.timeLeft0 - this._timeDrain);
        if (st.timeLeft0 <= 0) { st.isGameOver0 = true; return; }
      } else {
        st.timeLeft1 = Math.max(0, st.timeLeft1 - this._timeDrain);
        if (st.timeLeft1 <= 0) { st.isGameOver1 = true; return; }
      }
    }

    if (this._chopAnimTimer[playerIndex] > 0) this._chopAnimTimer[playerIndex]--;
    if (this._levelUpTimer[playerIndex] > 0) this._levelUpTimer[playerIndex]--;

    const chop = (this.game.players[playerIndex]?.inputData['chop'] as number) ?? 0;
    const isChopPressed = chop !== 0;

    if (isChopPressed && !this._wasChopPressed[playerIndex]) {
      this.processChop(playerIndex, chop === 1 ? 'left' : 'right');
    }

    this._wasChopPressed[playerIndex] = isChopPressed;
  }

  private processChop(playerIndex: number, side: 'left' | 'right'): void {
    this._isStarted[playerIndex] = true;
    const st = this.game.state as TimbermanState;
    const segments = playerIndex === 0 ? st.treeSegments0 : st.treeSegments1;

    if (playerIndex === 0) st.position0 = side;
    else st.position1 = side;

    this._chopAnimTimer[playerIndex] = 8;
    this._chopAnimSide[playerIndex] = side;

    segments.shift();
    segments.push(generateSegment(segments[segments.length - 1]?.branch ?? null));

    if (segments[0].branch === side) {
      if (playerIndex === 0) { st.isDead0 = true; st.isGameOver0 = true; }
      else { st.isDead1 = true; st.isGameOver1 = true; }
      return;
    }

    if (playerIndex === 0) {
      st.score0++;
      st.chopsThisLevel0++;
      st.timeLeft0 = Math.min(MAX_TIME, st.timeLeft0 + this._timeBonusPerPlayer[0]);
    } else {
      st.score1++;
      st.chopsThisLevel1++;
      st.timeLeft1 = Math.min(MAX_TIME, st.timeLeft1 + this._timeBonusPerPlayer[1]);
    }
    this.checkLevelUp(playerIndex);
  }

  private checkLevelUp(playerIndex: number): void {
    const st = this.game.state as TimbermanState;
    const chopsThisLevel = playerIndex === 0 ? st.chopsThisLevel0 : st.chopsThisLevel1;
    const chopsToNext = playerIndex === 0 ? st.chopsToNextLevel0 : st.chopsToNextLevel1;

    if (chopsThisLevel < chopsToNext) return;

    if (playerIndex === 0) {
      st.level0++;
      st.chopsThisLevel0 = 0;
      st.chopsToNextLevel0 = Math.round(st.chopsToNextLevel0 * 1.2);
    } else {
      st.level1++;
      st.chopsThisLevel1 = 0;
      st.chopsToNextLevel1 = Math.round(st.chopsToNextLevel1 * 1.2);
    }
    this._timeBonusPerPlayer[playerIndex] = Math.round(this._timeBonusPerPlayer[playerIndex] * 0.85 * 10) / 10;
    this._levelUpTimer[playerIndex] = 90;
  }

  private renderAxe(ctx: CanvasRenderingContext2D, playerIndex: number, playerX: number): void {
    const side = this._chopAnimSide[playerIndex];
    const handleW = this._branchLen / 2;
    const handleH = 12;
    const bladeSize = 18;
    const axeY = this._groundY - Math.round(this._playerH * 0.7);

    if (side === 'left') {
      const handleX = playerX + this._playerW;
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(handleX, axeY - handleH / 2, handleW, handleH);
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(handleX + handleW - bladeSize / 2, axeY - bladeSize / 2, bladeSize, bladeSize);
    } else {
      const handleX = playerX - handleW;
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(handleX, axeY - handleH / 2, handleW, handleH);
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(handleX - bladeSize / 2, axeY - bladeSize / 2, bladeSize, bladeSize);
    }
  }

  private render(): void {
    if (!this._canvas) return;
    const ctx = this._canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this.renderSection(ctx, 0, 0);
    if (this.isMultiplayer) this.renderSection(ctx, 1, this._sectionW);
  }

  private renderSection(
    ctx: CanvasRenderingContext2D,
    playerIndex: number,
    offsetX: number
  ): void {
    const st = this.game.state as TimbermanState;
    const segments  = playerIndex === 0 ? st.treeSegments0 : st.treeSegments1;
    const position  = playerIndex === 0 ? st.position0     : st.position1;
    const score     = playerIndex === 0 ? st.score0        : st.score1;
    const timeLeft  = playerIndex === 0 ? st.timeLeft0     : st.timeLeft1;
    const isGameOver = playerIndex === 0 ? st.isGameOver0  : st.isGameOver1;
    const isDead    = playerIndex === 0 ? st.isDead0       : st.isDead1;
    const trunkCX   = offsetX + this._trunkCenterX;

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(offsetX, 0, this._sectionW, this._canvasH);

    ctx.fillStyle = '#5D8A3C';
    ctx.fillRect(offsetX, this._groundY, this._sectionW, this._canvasH - this._groundY);

    for (let i = 0; i < segments.length; i++) {
      const segTopY = this._groundY - (i + 1) * this._segmentH;
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(trunkCX - this._trunkW / 2, segTopY, this._trunkW, this._segmentH);

      const branch = segments[i].branch;
      const branchY = segTopY + this._segmentH / 2 - this._branchH / 2;
      if (branch === 'left') {
        ctx.fillStyle = '#6B3410';
        ctx.fillRect(trunkCX - this._trunkW / 2 - this._branchLen, branchY, this._branchLen, this._branchH);
      } else if (branch === 'right') {
        ctx.fillStyle = '#6B3410';
        ctx.fillRect(trunkCX + this._trunkW / 2, branchY, this._branchLen, this._branchH);
      }
    }

    const playerX = position === 'left'
      ? trunkCX - this._trunkW / 2 - this._branchLen / 2 - this._playerW / 2
      : trunkCX + this._trunkW / 2 + this._branchLen / 2 - this._playerW / 2;
    ctx.fillStyle = playerIndex === 0 ? '#CC2200' : '#0022CC';
    ctx.fillRect(playerX, this._groundY - this._playerH, this._playerW, this._playerH);

    if (this._chopAnimTimer[playerIndex] > 0) {
      this.renderAxe(ctx, playerIndex, playerX);
    }

    if (!this._isStarted[playerIndex] && !isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(offsetX, this._canvasH / 2 - 35, this._sectionW, 70);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        playerIndex === 0 ? 'Press A or D to start' : 'Press ← or → to start',
        offsetX + this._sectionW / 2,
        this._canvasH / 2 + 8
      );
    }

    const barX = offsetX + 20;
    const barW = this._sectionW - 40;
    ctx.fillStyle = '#444';
    ctx.fillRect(barX, 10, barW, 20);
    ctx.fillStyle = timeLeft > 30 ? '#22CC44' : '#CC2200';
    ctx.fillRect(barX, 10, barW * (timeLeft / MAX_TIME), 20);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, offsetX + this._sectionW / 2, 50);

    const level = playerIndex === 0 ? (this.game.state as TimbermanState).level0 : (this.game.state as TimbermanState).level1;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Lv.${level}`, offsetX + this._sectionW - 8, 58);

    if (this._levelUpTimer[playerIndex] > 0) {
      const alpha = this._levelUpTimer[playerIndex] / 90;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Level ${level}!`, offsetX + this._sectionW / 2, 72);
      ctx.restore();
    }

    if (this.isMultiplayer && playerIndex === 0) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this._sectionW, 0);
      ctx.lineTo(this._sectionW, this._canvasH);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    if (isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(offsetX, this._canvasH / 2 - 60, this._sectionW, 120);
      ctx.fillStyle = isDead ? '#FF2222' : '#FFAA00';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isDead ? 'YOU DIED!' : 'TIME UP!',
        offsetX + this._sectionW / 2,
        this._canvasH / 2
      );
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px sans-serif';
      ctx.fillText(
        playerIndex === 0 ? 'Press Space to play again' : 'Press Enter to play again',
        offsetX + this._sectionW / 2,
        this._canvasH / 2 + 40
      );
    }
  }
}
