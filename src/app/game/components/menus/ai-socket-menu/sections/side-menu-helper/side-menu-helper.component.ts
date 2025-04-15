import { AfterViewInit, Component, Input } from '@angular/core';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-side-menu-helper',
  standalone: true,
  imports: [],
  template: `
    <div class="group font-mono absolute left-0 top-0 z-30">
      <div
        class="absolute z-30 top-3 left-4 rounded-full bg-lightGray {{
          iconType === 'info'
            ? 'group-hover:bg-mainCreme'
            : 'group-hover:bg-mainGray'
        }}">
        @if (iconType === 'info') {
          <i
            data-feather="info"
            class="size-5 text-mainGray group-hover:scale-105 transition-all ease-in-out duration-300"></i>
        } @else if (iconType === 'warning') {
          <i
            data-feather="alert-triangle"
            class="size-5 text-yellow-400 group-hover:scale-105 transition-all ease-in-out duration-100"></i>
        }
      </div>
      <div
        class="flex absolute z-20 top-3 left-4 h-5 w-[15.75rem] pointer-events-none opacity-0 group-hover:opacity-100 items-start justify-center rounded-tr-full bg-mainGray text-mainCreme text-nowrap transition-all ease-in-out duration-300 {{
          iconType === 'info' ? 'rounded-l-full' : 'rounded-tl-[2000px]'
        }}">
        <p
          class="text-center py-[2px] ml-5 pr-4 uppercase text-xs w-full border-b-[1px] {{
            iconType === 'info'
              ? 'border-mainCreme text-mainCreme'
              : 'border-yellow-500 text-yellow-500'
          }}">
          {{ menuType }}
        </p>
      </div>
      <div
        class="flex flex-col w-[14.5rem] absolute z-10 top-8 left-9 p-2 shadow-menuInfoPanelShadow pointer-events-none opacity-0 group-hover:opacity-100 bg-mainGray text-mainCreme transition-all ease-in-out duration-300">
        <span
          class="flex flex-col space-y-2 text-bold text-2xs text-mainOrange text-justify leading-tight">
          <p>{{ descriptionPart1 }}</p>
          @if (descriptionPart2 !== null) {
            <p>{{ descriptionPart2 }}</p>
          }
          @if (descriptionPart3 !== null) {
            <p>{{ descriptionPart3 }}</p>
          }
        </span>
      </div>
    </div>
  `,
})
export class SideMenuHelperComponent implements AfterViewInit {
  @Input({ required: true }) public menuType!: string;
  @Input({ required: true }) public descriptionPart1!: string;
  @Input({ required: true }) public descriptionPart2!: string | null;
  @Input({ required: true }) public descriptionPart3!: string | null;
  @Input() public iconType: 'info' | 'warning' = 'info';

  public ngAfterViewInit(): void {
    feather.replace();
  }
}
