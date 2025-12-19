/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Tetris, TetrisState } from './models/tetris.class';

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div>
      score: <b>{{ game.state.score }}</b>,
      lines: <b>{{ game.state.lines }}</b>,
      level: <b>{{ game.state.level }}</b>
    </div>
    <app-canvas
      [displayMode]="'vertical'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class TetrisGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  
  private isStarted = false;
  private isRotationPressed = false;
  private isDropDownPressed = false;

  private _blockWidth = 30;
  private _blockHeight = 30;

  private _tickCounter = 0;
  private _tickRate = 60;
  private _moveCooldown = 6;
  private _lastMoveTick = 0;

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


  public override game!: Tetris;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Tetris;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.restart();
    this.render();
  }

  public override restart(): void {
    this.game.state = new TetrisState();
    this.spawnPiece();
    this._tickCounter = 0;
    this._lastMoveTick = 0;
    this.isRotationPressed = false;
    this.isDropDownPressed = false; 
    this.isStarted = false;
    this.render();
  }

  protected override update(): void {
    super.update();
    if(!this.processStart()){
      this.render();
      return;
    }

    if(this.processGameOver()){
      this.render();
      return;
    }

    this.processHardDrop();
    this.processMovement();
    this.processRotation();
    this.processGravity();

    this.render();
  }

  private processStart(): boolean {
    if (this.isStarted) return true;
    const startInput = (this.game.players[0].inputData['start'] as number) || 0;
    const moveInput = (this.game.players[0].inputData['move'] as number) || 0;
    
    if (startInput !== 0 || moveInput !== 0) {
      this.isStarted = true;
      if (startInput === 1) {
        this.isDropDownPressed = true;
      }
      
      return true;
    }
    return false;
  }

  private processGameOver(): boolean {
    if (!this.game.state.isGameOver) return false;

    const startInput = (this.game.players[0].inputData['start'] as number) || 0;
    const isCurrentlyPressed = startInput === 1;
    if (isCurrentlyPressed && !this.isDropDownPressed) {
      this.restart();
      return false;
    }

    this.isDropDownPressed = isCurrentlyPressed;
    return true;
  }

  private processMovement(): void {
    const moveInput = (this.game.players[0].inputData['move'] as number) || 0;

    if (this._tickCounter - this._lastMoveTick >= this._moveCooldown) {
      if (moveInput === 1) {
        if (this.tryMove(-1, 0)) {
          this._lastMoveTick = this._tickCounter;
        }
      } else if (moveInput === 2) {
        if (this.tryMove(1, 0)) {
          this._lastMoveTick = this._tickCounter;
        }
      } else if (moveInput === 4) {
        if (this.tryMove(0, 1)) {
          this._lastMoveTick = this._tickCounter;
        }
      }
    }
  }

  private processRotation(): void {
    const moveInput = (this.game.players[0].inputData['move'] as number) || 0;
    const isCurrentlyRotating = moveInput === 3;
    if (isCurrentlyRotating && !this.isRotationPressed) {
      this.tryRotate();
    }
    this.isRotationPressed = isCurrentlyRotating;
  }

  private processGravity(): void {
    this._tickCounter++;

    const tickRate = Math.max(5, Math.floor(this._tickRate - (this.game.state.level - 1) * 2));
    
    if (this._tickCounter % tickRate !== 0) return;

    if (this.tryMove(0, 1)) return;

    this.lockPiece();
    this.clearLines();
    this.spawnPiece();
  }

  private processHardDrop(): void {
    const startInput = (this.game.players[0].inputData['start'] as number) || 0;
    const isCurrentlyPressed = startInput === 1;
    if (this.isStarted && !this.game.state.isGameOver) {
      if (isCurrentlyPressed && !this.isDropDownPressed) {
        while (this.tryMove(0, 1));
        this.lockPiece();
        this.clearLines();
        this.spawnPiece();
      }
    }

    this.isDropDownPressed = isCurrentlyPressed;
  }

  private spawnPiece():void{
    const state = this.game.state;
    const next = state.nextType ?? Math.floor(Math.random()*7);
    state.nextType = Math.floor(Math.random()*7);

    const startX = Math.floor((state.cols - this.getPieceMatrix(next,0)[0].length) / 2);
    const startY = 0;

    state.active = { type:next, rotation:0, x:startX, y:startY };

    if(!this.canPlacePiece(state, state.active.type, state.active.rotation, state.active.x, state.active.y)){
      state.isGameOver = true;
    }
  }

  private getPieceMatrix(type:number, rotation:number):number[][]{
    const rotations = this._tetrominos[type];
    rotation = rotation % rotations.length;
    return rotations[rotation];
  }

  private canPlacePiece(state:TetrisState,type:number,rotation:number,x:number,y:number):boolean{
    const matrix = this.getPieceMatrix(type,rotation);
    for(let i=0;i<matrix.length;i++){
      for(let j=0;j<matrix[i].length;j++){
        if(matrix[i][j] === 0) continue;
        const boardX = x + j;
        const boardY = y + i;
        if(boardX < 0 || boardX >= state.cols || boardY<0 || boardY >= state.rows) return false;
        if(state.board[boardY][boardX] !== 0) return false;
      }
    }
    return true;
  }

  private tryMove(deltaX:number,deltaY:number):boolean{
    const state = this.game.state;
    if(!state.active) return false;
    const newX = state.active.x + deltaX;
    const newY = state.active.y + deltaY;
    if(this.canPlacePiece(state,state.active.type,state.active.rotation,newX,newY)) {
      state.active.x = newX;
      state.active.y = newY;
      return true;
    }
    return false;
  }

  private tryRotate():boolean{
    const state = this.game.state;
    if(!state.active) return false;
    const newRotation = (state.active.rotation + 1) % this._tetrominos[state.active.type].length;

    const tries = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 2, y: 0 },
    ];
    for(const t of tries){
      if(this.canPlacePiece(state,state.active.type,newRotation,state.active.x + t.x,state.active.y + t.y)){
        state.active.rotation = newRotation;
        state.active.x += t.x;
        state.active.y += t.y;
        return true;
      }
    }
    return false;
  }

  private lockPiece():void{
    const state = this.game.state;
    if(!state.active) return;
    const matrix = this.getPieceMatrix(state.active.type,state.active.rotation);
    for(let i=0;i<matrix.length;i++){
      for(let j=0;j<matrix[i].length;j++){
        if(matrix[i][j] === 0) continue;
        const boardX = state.active.x + j;
        const boardY = state.active.y + i;
        if(boardX < state.cols && boardX >= 0 && boardY < state.rows && boardY >=0){
          state.board[boardY][boardX] = matrix[i][j];
        }
      }
    }
    state.active = null;
  }

  private clearLines():void{
    const state = this.game.state;
    const newBoard:number[][] = [];
    let cleared = 0;
    for(let i=0;i<state.rows;i++){
      const isFull = state.board[i].every(cell => cell !== 0);
      if(isFull){
        cleared++;
      }else{
        newBoard.push(state.board[i]);
      }
    }
    while(newBoard.length < state.rows){
      newBoard.unshift(Array.from({length:state.cols}, () => 0));
    }
    if(cleared > 0){
      state.board = newBoard;
      const scoreMap:Record<number,number> = {1:100,2:300,3:500,4:800};
      state.score += scoreMap[cleared] ?? (cleared * 200);
      state.lines += cleared;
      state.level = 1 + Math.floor(state.lines / 10);
    }
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if(!context) return;

    context.clearRect(0,0,this._canvas.width,this._canvas.height);
    const state = this.game.state;
    const cols = state.cols;
    const rows = state.rows;

    const blockW = this._blockWidth;
    const blockH = this._blockHeight;

    context.fillStyle = '#111';
    const boardW = cols * blockW;
    const boardH = rows * blockH;
    context.fillRect(0,0,boardW,boardH);

    context.strokeStyle = 'rgba(255,255,255,0.05)';
    for(let i=0;i<=rows;i++){
      context.beginPath();
      context.moveTo(0,i*blockH);
      context.lineTo(boardW,i*blockH);
      context.stroke();
    }
    for(let i=0;i<=cols;i++){
      context.beginPath();
      context.moveTo(i*blockW,0);
      context.lineTo(i*blockW,boardH);
      context.stroke();
    }

    const drawBlock = (x:number,y:number,colorIndex:number) : void => {
      if(colorIndex === 0) return;
      const colors = [
        '#000000',
        '#00FFFF',
        '#FFFF00',
        '#800080',
        '#00FF00',
        '#FF0000',
        '#0000FF',
        '#FFA500',
      ];
      const fill = colors[colorIndex] || '#888';
      context.fillStyle = fill;
      context.fillRect(x*blockW + 1,y * blockH + 1,blockW - 2,blockH -2);

      context.strokeStyle = 'rgba(255,255,255,0.15)';
      context.strokeRect(x*blockW+1,y*blockH+1,blockW-2,blockH-2);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = state.board[r][c];
        if (cell !== 0) {
          drawBlock(c, r, cell);
        }
      }
    }

    if(state.active){
      const matrix = this.getPieceMatrix(state.active.type,state.active.rotation);
      for(let i=0; i<matrix.length;i++){
        for(let j=0;j<matrix[i].length;j++){
          if(matrix[i][j] !== 0){
            const boardX = state.active.x + j;
            const boardY = state.active.y + i;
            if(boardY >= 0) drawBlock(boardX,boardY,matrix[i][j]);
          }
        }
      }
    }

    const previewX = cols * blockW + 20;
    const previewY = 10;
    context.fillStyle = '#222';
    context.fillRect(previewX - 5,previewY-5,6*20,6*20);
    const nextMatrix = this.getPieceMatrix(state.nextType,0);
    for(let i=0;i<nextMatrix.length;i++){
      for(let j=0;j<nextMatrix[i].length;j++){
        if(nextMatrix[i][j] !== 0){
          const drawX = previewX + j * 20;
          const drawY = previewY + i * 20;
          context.fillStyle = '#999';
          context.fillRect(drawX+1,drawY+1,20-2,20-2);
        }
      }
    }

    if(state.isGameOver){
      context.fillStyle = 'rgba(0,0,0,0.7)';
      context.fillRect(0,boardH/2-40,boardW,80);
      context.fillStyle = 'white';
      context.font = '30px sans-serif';
      context.fillText('GAME OVER',boardW/2-90,boardH/2);
      context.font = '16px sans-serif';
      context.fillText('Press SPACE to Restart', boardW/2-80, boardH/2 + 30);
    }
  }
}