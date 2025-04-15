import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [NgOptimizedImage, RouterModule],
  template: `
    <hr class="w-full h-[1px] bg-mainOrange border-0" />
    <footer
      class="flex flex-col space-y-6 font-mono items-center bg-mainGray w-full pt-6 pb-2 text-mainCreme text-sm lg:text-base relative z-50">
      <div
        class="grid lg:flex grid-cols-1 sm:grid-cols-2 gap-x-0 sm:gap-x-6 md:gap-x-0 gap-y-8 sm:gap-y-4 lg:gap-y-0 lg:flex-row w-full items-center px-8 lg:px-4 xl:px-0 space-x-0 lg:space-x-4 xl:space-x-0 justify-center xl:justify-around">
        <div class="flex flex-col items-start space-y-2">
          <div
            class="flex flex-row items-center justify-center space-x-2 group">
            <span class="size-9 lg:size-10 relative">
              <img
                ngSrc="images/rag-2.png"
                alt="Logo RAG-2"
                class="object-contain grayscale group-hover:grayscale-0 transition-all ease-in-out duration-500"
                fill />
            </span>
            <span class="font-bold text-base lg:text-lg">RUT-AI-GAMES 2.0</span>
          </div>
          <span
            >Rzeszów University of Technology<br />
            Games for Artificial Intelligence</span
          >
        </div>
        <div class="flex flex-col items-start space-y-2">
          <span class="font-bold text-base lg:text-lg">AUTHORS</span>
          <ul
            id="authorsFooterList"
            class="flex flex-col items-start space-y-2">
            @for (author of authors; track author.name) {
              <li>
                <a
                  [href]="'https://github.com/' + author.githubName"
                  title="The link opens in a new browser window"
                  target="_blank"
                  [attr.aria-label]="'GitHub profile ' + author.name">
                  {{ author.name }}</a
                >
              </li>
            }
          </ul>
        </div>
        <div class="flex flex-col items-start space-y-2">
          <span class="font-bold text-base lg:text-lg">PROJECT SUPERVISOR</span>
          <span>Ph.D. Eng. Dawid Kalandyk</span>
          <span class="font-bold text-base lg:text-lg">CONTACT</span>
          <span>rut-ai&#64;kia.prz.edu.pl</span>
        </div>
        <div class="flex flex-col items-start space-y-2">
          <div
            title="The link opens in a new browser window"
            class="flex flex-col xs:flex-row items-start xs:items-center justify-start xs:justify-center space-y-1 xs:space-y-0 space-x-0 xs:space-x-2 group w-fit sm:w-full">
            <span
              class="w-32 xs:w-28 lg:w-32 h-20 xs:h-16 lg:h-20 relative pr-4">
              <img
                ngSrc="images/prz/prz_orange.png"
                alt="Logo PRZ"
                class="object-contain grayscale group-hover:grayscale-0 transition-all ease-in-out duration-500"
                fill />
            </span>
            <span class="font-bold text-base lg:text-lg"
              >Rzeszów University of Technology</span
            >
          </div>
          <div
            title="The link opens in a new browser window"
            class="flex flex-col xs:flex-row items-start xs:items-center justify-start xs:justify-center space-y-1 xs:space-y-0 space-x-0 xs:space-x-2 group w-fit sm:w-full">
            <span
              class="w-32 xs:w-28 lg:w-32 h-20 xs:h-16 lg:h-20 relative pr-4">
              <img
                ngSrc="images/gest/gest_orange.png"
                alt="Logo GEST"
                class="object-contain grayscale group-hover:grayscale-0 transition-all ease-in-out duration-500"
                fill />
            </span>
            <span class="font-bold text-base lg:text-lg"
              >Human-Computer Interaction Club "GEST"</span
            >
          </div>
        </div>
      </div>
      <div
        class="flex flex-col xs:flex-row space-y-3 xs:space-y-0 space-x-0 xs:space-x-12 w-full items-center justify-center text-sm xs:text-xs lg:text-sm text-mainOrange grayscale">
        <span>&copy; {{ currentYear }} RUT & GEST</span>
        <span>PRIVACY POLICY</span>
        <div>
          ACCESSIBILITY STATEMENT
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  public currentYear: number = new Date().getFullYear();

  public authors = [
    {
      name: 'Marcin Bator',
      githubName: 'marcinbator',
    },
    {
      name: 'Paweł Buczek',
      githubName: 'pablitoo1',
    },
    {
      name: 'Bartłomiej Krówka',
      githubName: 'bkrowka',
    },
  ];
}
