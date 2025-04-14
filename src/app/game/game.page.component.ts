import { Component, OnInit, Type, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { PongComponent } from './components/pong/pong.component';
import { TetrisComponent } from './components/tetris/tetris.component';
import { BaseGameComponent } from './models/base-game.component';

const gameComponents: Record<string, Type<BaseGameComponent>> = {
  pong: PongComponent,
  tetris: TetrisComponent,
};

@Component({
  selector: 'app-game-base',
  standalone: true,
  template: `
    <div class="min-h-screen w-full">
      <h1 class="text-4xl font-bold text-center mt-10">Game: {{ gameName }}</h1>
      @if (component) {
        <ng-container *ngComponentOutlet="component"></ng-container>
      }
    </div>
  `,
  imports: [NgComponentOutlet],
})
export class GamePageComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);

  public gameName = '';
  public component: Type<unknown> | null = null;

  public ngOnInit(): void {
    this.gameName = this._route.snapshot.paramMap.get('gameName') || '';

    this.component = gameComponents[this.gameName] || null;

    if (!this.component) {
      this._router.navigate(['']);
    }
  }
}
