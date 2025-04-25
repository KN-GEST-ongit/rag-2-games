import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Pacman, PacmanState } from './models/pacman.class';

@Component({
  selector: 'app-pacman',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class PacmanGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Pacman;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Pacman;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.render();
  }

  public override restart(): void {
    this.game.state = new PacmanState();
  }

  protected override update(): void {
    super.update();
    this.render();
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      // Render view here
    }
  }

  //
}