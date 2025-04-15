import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
} from '@angular/core';
import { UrlParamService } from 'app/shared/services/url-param.service';
import { SideMenuHelperComponent } from '../ai-socket-menu/sections/side-menu-helper/side-menu-helper.component';

@Component({
  selector: 'app-game-menu',
  standalone: true,
  imports: [SideMenuHelperComponent],
  template: `
    <button
      (click)="toggleGameMenu()"
      class="side-menu-right-button -top-4 w-12 h-40 {{
        isGameMenuVisible ? 'right-72' : 'right-0'
      }}">
      <span
        class="[writing-mode:vertical-rl] [text-orientation:upright] tracking-[0.45em]"
        >GAME</span
      >
    </button>
    <div
      class="flex flex-col space-y-4 items-center justify-center w-72 h-40 overflow-y-auto p-5 bg-lightGray font-mono text-sm side-menu-container -top-4 {{
        isGameMenuVisible ? 'right-0' : '-right-72'
      }}">
      <app-side-menu-helper
        [menuType]="'Game menu'"
        [descriptionPart1]="
          'In this menu, you can pause/resume your game, or restart it from the beginning.'
        "
        [descriptionPart2]="null"
        [descriptionPart3]="null" />
      <button
        (click)="onPauseClick()"
        class="w-full py-1 font-bold text-blue-900 border-blue-900 border-[1px] hover:bg-blue-900 hover:text-mainCreme transition-all ease-in-out duration-300">
        @if (isPaused) {
          Resume
        } @else {
          Pause
        }
      </button>
      <button
        (click)="onRestartClick()"
        class="w-full py-1 font-bold text-violet-800 border-violet-800 border-[1px] hover:bg-violet-800 hover:text-mainCreme transition-all ease-in-out duration-300">
        Restart
      </button>
    </div>
  `,
})
export class GameMenuComponent implements OnInit {
  @Output() public pauseEmitter = new EventEmitter<boolean>();
  @Output() public restartEmitter = new EventEmitter<void>();

  private _urlParamService = inject(UrlParamService);

  public isPaused = false;
  public isGameMenuVisible = false;

  public ngOnInit(): void {
    setTimeout(() => {
      this.isPaused = this._urlParamService.getQueryParam('paused') === 'true';
      this._urlParamService.setQueryParam(
        'paused',
        this.isPaused ? 'true' : 'false'
      );
      this.pauseEmitter.emit(this.isPaused);
    });
  }

  public toggleGameMenu(): void {
    this.isGameMenuVisible = !this.isGameMenuVisible;
  }

  public onPauseClick(): void {
    this.isPaused = !this.isPaused;

    this._urlParamService.setQueryParam(
      'paused',
      this.isPaused ? 'true' : 'false'
    );
    this.pauseEmitter.emit(this.isPaused);
  }

  public onRestartClick(): void {
    this.restartEmitter.emit();
  }
}
