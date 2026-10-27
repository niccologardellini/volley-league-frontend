import { Component, computed, input } from '@angular/core';
import { ETICHETTE_STATO, StatoPartita } from '../core/models';

/** Badge colorato dello stato della partita (colore + testo, non solo colore, per accessibilita'). */
@Component({
  selector: 'app-stato-chip',
  template: `<span class="stato" [class]="'stato stato-' + stato().toLowerCase()">{{ etichetta() }}</span>`,
  styles: `
    .stato { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .75rem; font-weight: 600; white-space: nowrap; }
    .stato-programmata { background: #eceff4; color: #3c4560; }
    .stato-roster_inviati { background: #e3f0ff; color: #0b4f9c; }
    .stato-in_corso { background: #fff1d6; color: #8a5300; }
    .stato-refertata { background: #f3e5ff; color: #6a1fa0; }
    .stato-omologata { background: #dcf5e6; color: #116336; }
  `,
})
export class StatoChipComponent {
  readonly stato = input.required<StatoPartita>();
  protected readonly etichetta = computed(() => ETICHETTE_STATO[this.stato()]);
}
