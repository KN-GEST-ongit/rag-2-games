import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { Rag2GamesLibComponent } from '../../projects/rag-2-games-lib/src/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    Rag2GamesLibComponent,
  ],
  template: `
    <app-navbar />
    <main><router-outlet /></main>
    <rag-2-games-lib />
    <app-footer />
  `,
})
export class AppComponent {
  public title = 'rag-2-games';
}
