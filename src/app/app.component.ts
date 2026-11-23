import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (!i18n.ready()) {
      <main class="boot" aria-busy="true"></main>
    } @else {
      <router-outlet />
    }
  `,
  styles: `
    .boot {
      min-height: 40vh;
    }
  `,
})
export class AppComponent implements OnInit {
  readonly i18n = inject(TranslationService);

  ngOnInit(): void {
    void this.i18n.load('en');
  }
}
