import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Riquadro mostrato quando un elenco e' vuoto o si e' verificato un errore. */
@Component({
  selector: 'app-stato-vuoto',
  imports: [MatIconModule],
  template: `
    <div class="vuoto" [class.errore]="errore()" role="status">
      <mat-icon aria-hidden="true">{{ errore() ? 'error_outline' : icona() }}</mat-icon>
      <p class="titolo">{{ titolo() }}</p>
      @if (testo()) { <p class="testo">{{ testo() }}</p> }
      <ng-content />
    </div>`,
  styles: `
    .vuoto { text-align: center; padding: 40px 16px; color: var(--testo-sec); }
    .vuoto mat-icon { font-size: 44px; width: 44px; height: 44px; opacity: .55; }
    .titolo { font-weight: 600; color: var(--testo); margin: 10px 0 4px; }
    .testo { margin: 0 0 12px; font-size: .9rem; }
    .errore mat-icon { color: #b3261e; opacity: 1; }
  `,
})
export class StatoVuotoComponent {
  readonly icona = input('inbox');
  readonly titolo = input.required<string>();
  readonly testo = input<string>('');
  readonly errore = input(false);
}
