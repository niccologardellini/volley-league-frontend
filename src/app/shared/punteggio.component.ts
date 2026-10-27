import { Component, input } from '@angular/core';
import { Partita } from '../core/models';

/** Riga "Casa 3 - 1 Ospite" con i parziali; evidenzia la squadra vincente. */
@Component({
  selector: 'app-punteggio',
  template: `
    @let p = partita();
    <div class="match">
      <span class="team casa" [class.win]="(p.setCasa ?? 0) > (p.setOspite ?? 0)">{{ p.casa.nome }}</span>
      <span class="score" [attr.aria-label]="p.setCasa !== null ? 'risultato ' + p.setCasa + ' a ' + p.setOspite : 'da giocare'">
        @if (p.setCasa !== null) { {{ p.setCasa }} – {{ p.setOspite }} } @else { vs }
      </span>
      <span class="team ospite" [class.win]="(p.setOspite ?? 0) > (p.setCasa ?? 0)">{{ p.ospite.nome }}</span>
    </div>
    @if (p.parziali.length) {
      <div class="parziali">{{ p.parziali.join('  ·  ') }}</div>
    }`,
  styles: `
    .match { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; }
    .team { font-weight: 500; }
    .casa { text-align: right; }
    .win { font-weight: 700; color: var(--primario); }
    .score { font-variant-numeric: tabular-nums; font-weight: 700; background: var(--sfondo); border-radius: 8px; padding: 4px 10px; min-width: 56px; text-align: center; }
    .parziali { text-align: center; font-size: .78rem; color: var(--testo-sec); margin-top: 4px; font-variant-numeric: tabular-nums; }
  `,
})
export class PunteggioComponent {
  readonly partita = input.required<Partita>();
}
