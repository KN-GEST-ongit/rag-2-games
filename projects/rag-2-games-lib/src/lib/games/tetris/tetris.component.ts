import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Tetris, TetrisState } from './models/tetris.class';

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class TetrisGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  
  private isStarted = false;
  private _blockWidth = 30;
  private _blockHeight = 30;

  public override game!: Tetris;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Tetris;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.render();
  }

  public override restart(): void {
    this.game.state = new TetrisState();
  }

  protected override update(): void {
    super.update();
    this.render();
    this.checkStartButton();
    if (
      !this.isStarted &&
      this.game.state.score == 0
    ) 
      return;
  }
  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      // Render view here
    }
  }
  private checkStartButton(): void {
    if (
      this.game.players[0].inputData['start'] != 0 ||
      this.game.players[0].inputData['move'] != 0
    ) {
      this.isStarted = true;
    }
  }
  private updatePLayerYPosition(): void {
    this.game.state.playerY -= 1;
    
  }
}