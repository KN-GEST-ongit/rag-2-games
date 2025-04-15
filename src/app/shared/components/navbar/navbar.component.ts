import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, NgOptimizedImage],
  template: `
    <nav
      class="bg-mainGray min-w-max pl-3 xs:pl-6 py-4 shadow-navbarShadow relative z-50">
      <div
        class="flex mx-auto w-full flex-row items-center justify-between font-mono text-mainOrange">
        <div class="flex w-fit md:w-1/4 lg:w-1/2 justify-between items-center">
          <a
            [routerLink]="['/']"
            aria-label="Home page"
            class="size-10 2xs:size-12 relative -rotate-6">
            <img
              ngSrc="images/rag-2.png"
              alt="Logo RAG-2"
              class="object-contain"
              fill />
          </a>
          <a [routerLink]="['/']" class="text-3xl hidden md:block"
            >RAG-2-GAMES</a
          >
        </div>
        <div
          class="game-list-container text-xl xs:text-2xl flex flex-col w-3/5 2xs:w-1/2 sm:w-2/5 md:w-[30%] lg:w-1/4 xl:w-1/6 relative items-center justify-center">
          <button
            class="flex flex-row w-full items-center justify-center space-x-1 xs:space-x-2 p-1 relative z-40 border-b-[1px] xs:border-b-2 border-mainOrange hover:border-green-500 ease-in-out transition-all duration-500">
            <div class="ease-in-out transition-all duration-200">
              <i data-feather="chevrons-right" class="size-5 xs:size-6"></i>
            </div>
            <span>LET'S PLAY</span>
            <div class="ease-in-out transition-all duration-200">
              <i data-feather="chevrons-left" class="size-5 xs:size-6"></i>
            </div>
          </button>
        </div>
        <div></div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {}
