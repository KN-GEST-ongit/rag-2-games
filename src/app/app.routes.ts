import { Routes } from '@angular/router';
import { HomePageComponent } from './home/home.page.component';
import { GamePageComponent } from './game/game.page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: 'Home Page',
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'game/:gameName',
    component: GamePageComponent,
    title: 'Game Page',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
