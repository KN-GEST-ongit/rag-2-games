import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { games } from '../../../../../projects/rag-2-games-lib/src/public-api';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [RouterModule],
  template: `
    <ul id="gamesNavbarList" class="text-base xs:text-lg space-y-2 px-4 py-4">
      @for (game of games; track $index) {
        <li class="w-full group">
          <a
            [routerLink]="['game/', game]"
            [attr.aria-label]="game + 'game page'"
            class="flex flex-row justify-between items-center">
            <span
              class="uppercase text-mainOrange group-hover:text-green-500 ease-in-out transition-all duration-500"
              >{{ game }}</span
            >
            <i
              data-feather="corner-down-right"
              class="size-4 xs:size-5 ease-in-out transition-all duration-500 opacity-0 group-hover:opacity-100 text-mainOrange group-hover:text-green-500"></i>
          </a>
          <hr
            class="border-mainOrange group-hover:border-green-500 w-3/5 2xl:w-1/2 group-hover:w-full ease-in-out transition-all duration-500" />
        </li>
      }
      <div class="group">
        <div class="flex flex-row justify-between items-center">
          <a
            [routerLink]="['game-list']"
            aria-label="Game list page"
            class="text-sm xs:text-base text-start 3xl:text-center text-mainOrange group-hover:text-green-500 ease-in-out transition-all duration-500">
            Read more...
          </a>
          <i
            data-feather="corner-down-right"
            class="size-4 xs:size-5 ease-in-out transition-all duration-500 opacity-0 group-hover:opacity-100 text-mainOrange group-hover:text-green-500"></i>
        </div>
        <hr
          class="border-mainOrange group-hover:border-green-500 w-3/5 2xl:w-1/2 group-hover:w-full ease-in-out transition-all duration-500" />
      </div>
    </ul>
  `,
})
export class GameListComponent implements OnInit, OnDestroy {
  private _getGamesSubscription = new Subscription();

  public games: string[] | null = null;

  public ngOnInit(): void {
    this.games = Object.keys(games);
  }

  public ngOnDestroy(): void {
    this._getGamesSubscription.unsubscribe();
  }
}
