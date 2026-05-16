import { Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { Base3DGameWindowComponent } from '../../engine-3d/base-3d-game.component';
import { Base3DRenderer } from '../../engine-3d/base-3d.renderer';
import { Crashball } from './models/crashball.class';
import { CrashballRenderer } from './models/crashball.renderer';

@Component({
  selector: 'app-crashball',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <app-canvas
      [displayMode]="'horizontal'"
      [is3DEnabled]="true"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b>
  `,
})
export class CrashballGameWindowComponent
  extends Base3DGameWindowComponent
  implements OnInit, OnDestroy
{
  public override game!: Crashball;

  protected override renderer3D?: CrashballRenderer;

  public override ngOnInit(): void {
    this.game = new Crashball();
    super.ngOnInit();
  }

  protected override createRenderer(canvas: HTMLCanvasElement): Base3DRenderer {
    const renderer = new CrashballRenderer(canvas);
    this.renderer3D = renderer;
    return renderer;
  }

  public override restart(): void {
    if (this.renderer3D) {
      this.renderer3D.clear();
    }
    this.game = new Crashball();
  }

  protected override update(): void {
    super.update();

    if (!this.renderer3D || this.isPaused) {
      return;
    }

    this.handleInput();
    this.updateGameLogic();
    this.renderer3D.render(this.game.state);
  }

  private handleInput(): void {
    // to implement
  }

  private updateGameLogic(): void {
    // to implement
  }
}
