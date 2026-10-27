import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ETICHETTE_SANZIONE, Referto } from '../core/models';

/** Visualizzazione in sola lettura di un referto (usata dal giudice sportivo). */
@Component({
  selector: 'app-referto-view',
  imports: [DatePipe, MatIconModule],
  template: `
    @let r = referto();
    <div class="testata">
      <div><span class="muted small">Casa</span><div class="sq">{{ r.partita.casa.nome }}</div></div>
      <div class="ris">{{ r.partita.setCasa }} – {{ r.partita.setOspite }}</div>
      <div class="right"><span class="muted small">Ospite</span><div class="sq">{{ r.partita.ospite.nome }}</div></div>
    </div>

    <table class="tab set" aria-label="Parziali">
      <thead><tr><th scope="col">Set</th><th scope="col" class="num">Casa</th><th scope="col" class="num">Ospite</th><th scope="col" class="num">Cambi C/O</th></tr></thead>
      <tbody>
        @for (s of r.set; track s.numeroSet) {
          <tr>
            <td>{{ s.numeroSet === 5 ? 'Tie-break' : s.numeroSet + '° set' }}</td>
            <td class="num" [class.win]="s.puntiCasa > s.puntiOspite">{{ s.puntiCasa }}</td>
            <td class="num" [class.win]="s.puntiOspite > s.puntiCasa">{{ s.puntiOspite }}</td>
            <td class="num muted">{{ s.cambiCasa }} / {{ s.cambiOspite }}</td>
          </tr>
        }
      </tbody>
    </table>

    @for (sq of squadre(); track sq.id) {
      <h3>{{ sq.nome }}</h3>
      <table class="tab" [attr.aria-label]="'Statistiche ' + sq.nome">
        <thead><tr><th scope="col">N°</th><th scope="col">Atleta</th><th scope="col" class="num">Punti</th><th scope="col" class="num">Ace</th><th scope="col" class="num">Muri</th><th scope="col" class="num">Errori</th><th scope="col">Sanzione</th></tr></thead>
        <tbody>
          @for (s of sq.stat; track s.idTesserato) {
            <tr>
              <td>{{ s.numeroMaglia }}</td><td>{{ s.atleta }}</td>
              <td class="num">{{ s.puntiFatti }}</td><td class="num">{{ s.ace }}</td><td class="num">{{ s.muri }}</td><td class="num">{{ s.errori }}</td>
              <td>@if (s.cartellino !== 'NESSUNA') { <span class="card-{{ s.cartellino.toLowerCase() }}">{{ etichette[s.cartellino] }}</span> } @else { <span class="muted">—</span> }</td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="muted">Nessuna statistica registrata</td></tr>
          }
        </tbody>
      </table>
    }

    @if (r.note) { <p><strong>Note arbitro:</strong> {{ r.note }}</p> }
    <div class="firma">
      <mat-icon aria-hidden="true">verified</mat-icon>
      <div>
        <div>Firmato da <strong>{{ r.partita.arbitro }}</strong>
          @if (r.partita.firmaArbitroAt) { il {{ r.partita.firmaArbitroAt | date: 'd/MM/yyyy HH:mm' }} }</div>
        @if (r.hashReferto) { <code class="hash" title="Impronta SHA-256 del referto">SHA-256 {{ r.hashReferto }}</code> }
      </div>
    </div>`,
  styles: `
    .testata { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-bottom: 14px; }
    .right { text-align: right; }
    .sq { font-weight: 700; font-size: 1.05rem; }
    .ris { font-size: 1.8rem; font-weight: 800; color: var(--primario); font-variant-numeric: tabular-nums; }
    .tab { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: .9rem; }
    .tab th { text-align: left; font-size: .72rem; text-transform: uppercase; color: var(--testo-sec); padding: 6px 8px; border-bottom: 1px solid var(--bordo); }
    .tab td { padding: 6px 8px; border-bottom: 1px solid var(--bordo); }
    .tab .num { text-align: right; font-variant-numeric: tabular-nums; }
    .win { font-weight: 800; color: var(--primario); }
    h3 { font-size: .95rem; margin: 16px 0 6px; }
    .firma { display: flex; gap: 10px; align-items: flex-start; background: #eef8f1; border-radius: 12px; padding: 10px 14px; color: #145a32; }
    .hash { display: block; font-size: .7rem; word-break: break-all; opacity: .8; margin-top: 4px; }
    .card-giallo { background: #fff4c2; color: #6b5300; padding: 2px 8px; border-radius: 6px; font-size: .78rem; }
    .card-rosso, .card-rosso_giallo { background: #fde0dd; color: #8c1d18; padding: 2px 8px; border-radius: 6px; font-size: .78rem; }
  `,
})
export class RefertoViewComponent {
  readonly referto = input.required<Referto>();
  protected readonly etichette = ETICHETTE_SANZIONE;

  protected readonly squadre = computed(() => {
    const r = this.referto();
    return [r.partita.casa, r.partita.ospite].map((s) => ({
      id: s.id,
      nome: s.nome,
      stat: r.statistiche.filter((x) => x.idSquadra === s.id).sort((a, b) => a.numeroMaglia - b.numeroMaglia),
    }));
  });
}
