import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Game } from '@gameModels/game.class';

@Component({
  selector: 'app-game-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group font-mono absolute left-0 top-0 z-30">
      <div
        class="absolute z-30 top-3 left-4 rounded-full bg-zinc-400 group-hover:bg-mainCreme border-2 border-mainGray transition-all ease-in-out duration-300">
        <i
          data-feather="info"
          class="size-9 text-mainGray group-hover:scale-110 transition-all ease-in-out duration-300"></i>
      </div>
      <div
        class="flex absolute z-20 top-3 left-4 h-10 w-56 pointer-events-none opacity-0 group-hover:opacity-100 items-start justify-center rounded-l-full rounded-tr-full bg-mainGray text-mainCreme text-nowrap transition-all ease-in-out duration-300">
        <p class="text-center py-2 pl-12 pr-4 uppercase">Game controls:</p>
      </div>
      <div
        class="flex flex-col w-[11.5rem] absolute z-10 top-[3.25rem] left-14 pl-3 pb-4 shadow-controlPanelShadow pointer-events-none opacity-0 group-hover:opacity-100 bg-mainGray text-mainCreme transition-all ease-in-out duration-300">
        @for (player of game.players; track player) {
          <span class="text-bold text-sm uppercase text-mainOrange"
            >Player {{ $index + 1 }}</span
          >
          @for (
            control of player.controlsDescription | keyvalue;
            track control
          ) {
            <span class="text-xs pl-2"
              >{{ control.key }}: {{ control.value }}</span
            >
          }
        }
      </div>
    </div>
  `,
})
export class GameControlsComponent {
  @Input({ required: true }) public game!: Game;
}
