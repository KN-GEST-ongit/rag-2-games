import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Spaceinvaders, SpaceinvadersState } from './models/spaceinvaders.class';

@Component({
  selector: 'app-spaceinvaders',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class SpaceinvadersGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Spaceinvaders;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Spaceinvaders;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.render();
  }

  public override restart(): void {
    this.game.state = new SpaceinvadersState();
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