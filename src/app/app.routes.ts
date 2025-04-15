import { Routes } from '@angular/router';
import { GamePageComponent } from './game/game.page.component';

export const routes: Routes = [
  {
    path: 'game/:gameName',
    component: GamePageComponent,
    title: 'Game Page',
  },
  {
    path: '',
    redirectTo: 'game/pong',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'game/pong',
    pathMatch: 'full',
  },
];
