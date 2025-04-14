import { Component } from '@angular/core';
import { BaseGameComponent } from '../../models/base-game.component';

@Component({
  selector: 'app-pong',
  standalone: true,
  imports: [],
  template: ` <p>pong works!</p> `,
  styles: ``,
})
export class PongComponent extends BaseGameComponent {}
