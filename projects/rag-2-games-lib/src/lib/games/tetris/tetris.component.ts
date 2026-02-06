/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Tetris, TetrisSingleBoardState } from './models/tetris.class';

interface IPlayerContext{
  isRotationPressed:boolean;
  isDropDownPressed:boolean;
  tickCounter:number;
  lastMoveTick:number;
  moveCooldown:number;
}

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
      <button (click)="setMode('singleplayer')" [style.fontWeight]="currentMode === 'singleplayer' ? 'bold' : 'normal'">Singleplayer</button>
      <button (click)="setMode('multiplayer')" [style.fontWeight]="currentMode === 'multiplayer' ? 'bold' : 'normal'">Multiplayer</button>
    </div>

    @if (currentMode === 'singleplayer') {
      <div>
         Score: <b>{{ game.state.boards[0].score }}</b> | Lines: <b>{{ game.state.boards[0].lines }}</b> | Level: <b>{{ game.state.boards[0].level }}</b>
      </div>
    } @else if (currentMode === 'multiplayer') {
      <div style="display: flex; justify-content: space-around; width: 100%">
        <span>P1 Score: <b>{{ game.state.boards[0].score }}</b></span>
        <span>P2 Score: <b>{{ game.state.boards[1].score }}</b></span>
      </div>
    }

    @if (isCanvasVisible) {
      <app-canvas
        [displayMode]="canvasDisplayMode"
        #gameCanvas>
      </app-canvas>
    }
      
    <br>
    <b>FPS: {{ fps }}</b>
  `,
})

export class TetrisGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public isCanvasVisible = true;
  public currentMode: 'singleplayer' | 'multiplayer' = 'singleplayer';
  public get canvasDisplayMode(): 'vertical' | 'horizontal' {
    return this.currentMode === 'multiplayer' ? 'horizontal' : 'vertical';
  }

  private isStarted = false;

  private _blockWidth = 30;
  private _blockHeight = 30;
  private _baseTickRate = 80;

  private _playerContexts: IPlayerContext[] = [];

  private _tetrominos: number[][][][] = [
    [
      [[1, 1, 1, 1]], // I
      [[1],[1],[1],[1]],
    ],
    [
      [[2,2],[2,2]], // O
    ],
    [
      [[0,3,0],[3,3,3]], // T
      [[3,0],[3,3],[3,0]],
      [[3,3,3],[0,3,0]],
      [[0,3],[3,3],[0,3]],
    ],
    [
      [[0,4,4],[4,4,0]], // S
      [[4,0],[4,4],[0,4]],
    ],
    [
      [[5,5,0],[0,5,5]], // Z
      [[0,5],[5,5],[5,0]],
    ],
    [
      [[6,0,0],[6,6,6]], // J
      [[6,6],[6,0],[6,0]],
      [[6,6,6],[0,0,6]],
      [[0,6],[0,6],[6,6]],
    ],
    [
      [[0,0,7],[7,7,7]], // L
      [[7,0],[7,0],[7,7]],
      [[7,7,7],[7,0,0]],
      [[7,7],[0,7],[0,7]],
    ],
  ];

  private _colors = [
      '#000', '#00FFFF', '#FFFF00', '#800080', '#00FF00', '#FF0000', '#0000FF', '#FFA500'
    ];


  public override game!: Tetris;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Tetris;
    this.initPlayerContexts();
    this.currentMode = 'singleplayer';
    this.game.state.gameMode = 'singleplayer';
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.resizeCanvas();
    this.restart();
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.isStarted = false;
  }


  public setMode(mode:'singleplayer' | 'multiplayer'): void {
    if (this.currentMode === mode) return;

    super.ngOnDestroy();

    this.currentMode = mode;
    this.game.state.gameMode = mode;
    this.isCanvasVisible = false;

    setTimeout(() => {
      this.isCanvasVisible = true;
      setTimeout(() => {
        super.ngAfterViewInit();
        this.resizeCanvas();
        this.restart();
      });
    });
  }

  private resizeCanvas(): void {
    if (!this._canvas) return;

    if (this.currentMode === 'multiplayer') {
      this._canvas.width = 900; 
      this._canvas.height = 620;
    } else {
      this._canvas.width = 500;
      this._canvas.height = 620;
    }
  }

  private initPlayerContexts():void{
    this._playerContexts = [0,1].map(()=>({
      isRotationPressed:false,
      isDropDownPressed:false,
      tickCounter:0,
      lastMoveTick:0,
      moveCooldown:6,
    }));
  }

  private getPlayerInput(playerIndex: number, name: string): number {
    return (this.game.players[playerIndex].inputData[name] as number) || 0;
  }

  public override restart(): void {
    this.isStarted = false;
    this.initPlayerContexts();
    this.game.state.boards.forEach(board => board.resetBoard());
    this.spawnPiece(0);
    if(this.currentMode === 'multiplayer'){
      this.spawnPiece(1);
    }
    this.render();
  }

  protected override update(): void {
    super.update();
    if(!this.processStart()){
      this.render();
      return;
    }

    const playersToUpdate = this.currentMode === 'singleplayer' ? [0] : [0,1];
    playersToUpdate.forEach(playerIndex => {
      if(this.processGameOver(playerIndex)) return;

      this.processMovement(playerIndex);
      this.processRotation(playerIndex);
      this.processGravity(playerIndex);
      this.processHardDrop(playerIndex);
    });

    this.render();
  }

  private processStart(): boolean {
    if(this.isStarted) return true;
    
    const willStart = this.getPlayerInput(0, 'start') === 1 || this.getPlayerInput(1, 'start') === 1;
    if (willStart) {
      this.isStarted = true;
      if(this.getPlayerInput(0, 'start') === 1) this._playerContexts[0].isDropDownPressed = true;
      if(this.getPlayerInput(1, 'start') === 1) this._playerContexts[1].isDropDownPressed = true;
      return true;
    }
    return false;
  }

  private processGameOver(playerIndex:number): boolean {
    const board = this.game.state.boards[playerIndex];
    if (!board.isGameOver) return false;

    const startInput = this.getPlayerInput(playerIndex, 'start');
    const context = this._playerContexts[playerIndex];
    const isCurrentlyPressed = startInput === 1;
    if (isCurrentlyPressed && !context.isDropDownPressed) {
      board.resetBoard();
      this.spawnPiece(playerIndex);
      context.isDropDownPressed = true;
      return false;
    }

    context.isDropDownPressed = isCurrentlyPressed;
    return true;
  }

  private processMovement(playerIndex: number): void {
    const moveInput = this.getPlayerInput(playerIndex, 'move');
    const context = this._playerContexts[playerIndex];

    if (context.tickCounter - context.lastMoveTick >= context.moveCooldown) {
      if (moveInput === 1) {
        if (this.tryMove(playerIndex,-1, 0)) {
          context.lastMoveTick = context.tickCounter;
        }
      } else if (moveInput === 2) {
        if (this.tryMove(playerIndex,1, 0)) {
          context.lastMoveTick = context.tickCounter;
        }
      } else if (moveInput === 4) {
        if (this.tryMove(playerIndex,0, 1)) {
          context.lastMoveTick = context.tickCounter;
        }
      }
    }
  }

  private processRotation(playerIndex: number): void {
    const moveInput = this.getPlayerInput(playerIndex, 'move');
    const context = this._playerContexts[playerIndex];
    const isCurrentlyRotating = moveInput === 3;
    if (isCurrentlyRotating && !context.isRotationPressed) {
      this.tryRotate(playerIndex);
    }
    context.isRotationPressed = isCurrentlyRotating;
  }

  private processGravity(playerIndex: number): void {
    const board = this.game.state.boards[playerIndex];
    const context = this._playerContexts[playerIndex];
    context.tickCounter++;

    const tickRate = Math.max(5, Math.floor(this._baseTickRate - (board.level - 1) * 2));

    if (context.tickCounter % tickRate !== 0) return;

    if (this.tryMove(playerIndex,0, 1)) return;

    this.lockPiece(playerIndex);
    this.clearLines(playerIndex);
    this.spawnPiece(playerIndex);
  }

  private processHardDrop(playerIndex: number): void {
    const startInput = this.getPlayerInput(playerIndex, 'start');
    const context = this._playerContexts[playerIndex];
    const isCurrentlyPressed = startInput === 1;
    if (this.isStarted && !this.game.state.boards[playerIndex].isGameOver) {
      if (isCurrentlyPressed && !context.isDropDownPressed) {
        while (this.tryMove(playerIndex, 0, 1));
        this.lockPiece(playerIndex);
        this.clearLines(playerIndex);
        this.spawnPiece(playerIndex);
      }
    }

    context.isDropDownPressed = isCurrentlyPressed;
  }

  private spawnPiece(playerIndex: number):void{
    const board = this.game.state.boards[playerIndex];
    const next = board.nextType ?? Math.floor(Math.random()*7);
    board.nextType = Math.floor(Math.random()*7);

    const startX = Math.floor((board.cols - this.getPieceMatrix(next,0)[0].length) / 2);
    const startY = 0;

    board.active = { type:next, rotation:0, x:startX, y:startY };

    if(!this.canPlacePiece(board, board.active.type, board.active.rotation, board.active.x, board.active.y)){
      board.isGameOver = true;
    }
  }

  private getPieceMatrix(type:number, rotation:number):number[][]{
    const rotations = this._tetrominos[type];
    rotation = rotation % rotations.length;
    return rotations[rotation];
  }

  private canPlacePiece(board:TetrisSingleBoardState,type:number,rotation:number,x:number,y:number):boolean{
    const matrix = this.getPieceMatrix(type,rotation);
    for(let i=0;i<matrix.length;i++){
      for(let j=0;j<matrix[i].length;j++){
        if(matrix[i][j] === 0) continue;
        const boardX = x + j;
        const boardY = y + i;
        if(boardX < 0 || boardX >= board.cols || boardY<0 || boardY >= board.rows) return false;
        if(board.board[boardY][boardX] !== 0) return false;
      }
    }
    return true;
  }

  private tryMove(playerIndex: number, deltaX: number, deltaY: number): boolean {
    const board = this.game.state.boards[playerIndex];
    if(!board.active) return false;
    const newX = board.active.x + deltaX;
    const newY = board.active.y + deltaY;
    if(this.canPlacePiece(board,board.active.type,board.active.rotation,newX,newY)) {
      board.active.x = newX;
      board.active.y = newY;
      return true;
    }
    return false;
  }

  private tryRotate(playerIndex: number): boolean {
    const board = this.game.state.boards[playerIndex];
    if(!board.active) return false;
    const newRotation = (board.active.rotation + 1) % this._tetrominos[board.active.type].length;

    const tries = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 2, y: 0 },
    ];
    for(const t of tries){
      if(this.canPlacePiece(board,board.active.type,newRotation,board.active.x + t.x,board.active.y + t.y)){
        board.active.rotation = newRotation;
        board.active.x += t.x;
        board.active.y += t.y;
        return true;
      }
    }
    return false;
  }

  private lockPiece(playerIndex: number): void {
    const board = this.game.state.boards[playerIndex];
    if(!board.active) return;
    const matrix = this.getPieceMatrix(board.active.type,board.active.rotation);
    for(let i=0;i<matrix.length;i++){
      for(let j=0;j<matrix[i].length;j++){
        if(matrix[i][j] === 0) continue;
        const boardX = board.active.x + j;
        const boardY = board.active.y + i;
        if(boardX < board.cols && boardX >= 0 && boardY < board.rows && boardY >=0){
          board.board[boardY][boardX] = matrix[i][j];
        }
      }
    }
    board.active = null;
  }

  private clearLines(playerIndex: number):void{
    const board = this.game.state.boards[playerIndex];
    const newBoard:number[][] = [];
    let cleared = 0;
    for(let i=0;i<board.rows;i++){
      const isFull = board.board[i].every(cell => cell !== 0);
      if(isFull){
        cleared++;
      }else{
        newBoard.push(board.board[i]);
      }
    }
    while(newBoard.length < board.rows){
      newBoard.unshift(Array.from({length:board.cols}, () => 0));
    }
    if(cleared > 0){
      board.board = newBoard;
      const scoreMap:Record<number,number> = {1:100,2:300,3:500,4:800};
      board.score += scoreMap[cleared] ?? (cleared * 200);
      board.lines += cleared;
      board.level = 1 + Math.floor(board.lines / 10);
    }
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if(!context) return;

    context.clearRect(0,0,this._canvas.width,this._canvas.height);
    if (this.currentMode === 'singleplayer') {
      const boardW = this.game.state.boards[0].cols * this._blockWidth;
      const offsetX = (this._canvas.width - boardW) / 2;
      this.renderBoard(context, 0, offsetX, 10);
    } else {
      const boardW = 10 * this._blockWidth;
      // Player1
      this.renderBoard(context, 0, 50, 10); 
      // Player2
      const offsetP2 = this._canvas.width - boardW - 100;
      this.renderBoard(context, 1, offsetP2, 10);
    }
  }
  private renderBoard(ctx: CanvasRenderingContext2D, playerIndex: number, startX: number, startY: number): void {
    const boardState = this.game.state.boards[playerIndex];
    const cols = boardState.cols;
    const rows = boardState.rows;
    const bw = this._blockWidth;
    const bh = this._blockHeight;

    ctx.fillStyle = '#000';
    ctx.fillRect(startX, startY, cols * bw, rows * bh);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    for (let i = 0; i <= rows; i++) {
      ctx.moveTo(startX, startY + i * bh);
      ctx.lineTo(startX + cols * bw, startY + i * bh);
    }
    for (let j = 0; j <= cols; j++) {
      ctx.moveTo(startX + j * bw, startY);
      ctx.lineTo(startX + j * bw, startY + rows * bh);
    }
    ctx.stroke();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (boardState.board[r][c] !== 0) {
          this.drawBlock(ctx, startX + c * bw, startY + r * bh, boardState.board[r][c]);
        }
      }
    }
    if (boardState.active) {
      const matrix = this.getPieceMatrix(boardState.active.type, boardState.active.rotation);
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const bx = boardState.active.x + c;
            const by = boardState.active.y + r;
            if (by >= 0) {
              this.drawBlock(ctx, startX + bx * bw, startY + by * bh, matrix[r][c]);
            }
          }
        }
      }
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, cols * bw, rows * bh);
    ctx.lineWidth = 1;

    if (boardState.isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(startX, startY + (rows * bh) / 2 - 40, cols * bw, 80);
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', startX + (cols * bw) / 2, startY + (rows * bh) / 2 + 10);
    }
    const previewX = startX + cols * bw + 10;
    const previewY = startY;
    this.renderPreview(ctx, boardState.nextType, previewX, previewY);
  }

  private drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, colorIndex: number): void {
    ctx.fillStyle = this._colors[colorIndex] || '#888';
    ctx.fillRect(x + 1, y + 1, this._blockWidth - 2, this._blockHeight - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 1, y + 1, this._blockWidth - 2, 4);
  }

  private renderPreview(ctx: CanvasRenderingContext2D, type: number, x: number, y: number): void {
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, 80, 80);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(x, y, 80, 80);

    const matrix = this.getPieceMatrix(type, 0);
    const miniBlockSize = 15;
    const offsetX = x + (80 - matrix[0].length * miniBlockSize) / 2;
    const offsetY = y + (80 - matrix.length * miniBlockSize) / 2;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          ctx.fillStyle = this._colors[matrix[r][c]] || '#999';
          ctx.fillRect(offsetX + c * miniBlockSize, offsetY + r * miniBlockSize, miniBlockSize - 1, miniBlockSize - 1);
        }
      }
    }
  }
}