import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { Partita, Squadra } from '../../core/models';
import { StatoChipComponent } from '../../shared/stato-chip.component';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';
import { PunteggioComponent } from '../../shared/punteggio.component';

/** Calendario della squadra con accesso alla compilazione della lista gara. */
@Component({
  selector: 'app-partite-squadra',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, StatoChipComponent, StatoVuotoComponent, PunteggioComponent],
  template: `
    <header class="page-header">
      <div>
        <a mat-button routerLink="/dirigente/squadre"><mat-icon>arrow_back</mat-icon> Le mie squadre</a>
        <h1>Partite {{ squadra()?.nome }}</h1>
        <p>Invia la lista gara (max 14 atleti + staff) prima di ogni partita</p>
      </div>
    </header>
    @if (caricamento()) { <mat-progress-bar mode="indeterminate" aria-label="Caricamento" /> }
    @if (!caricamento() && partite().length === 0) {
      <app-stato-vuoto icona="calendar_month" titolo="Nessuna partita in calendario" testo="Il calendario sarà disponibile dopo la chiusura delle iscrizioni." />
    }
    <div class="lista">
      @for (p of partite(); track p.id) {
        <article class="card riga" [class.prossima]="p.id === prossima()">
          <div class="data">
            <div class="g">{{ p.giornata }}ª</div>
            <div class="small muted">{{ p.dataOra | date: 'EEE d MMM' }}</div>
            <div class="small muted">{{ p.dataOra | date: 'HH:mm' }}</div>
          </div>
          <div class="match"><app-punteggio [partita]="p" /></div>
          <div class="stato"><app-stato-chip [stato]="p.stato" /></div>
          <div class="azione">
            @if (p.stato === 'PROGRAMMATA' || p.stato === 'ROSTER_INVIATI') {
              <a mat-flat-button [routerLink]="['/dirigente/lista', p.id, idSquadra()]"><mat-icon>playlist_add_check</mat-icon> Lista gara</a>
            }
          </div>
        </article>
      }
    </div>`,
  styles: `
    .lista { display: grid; gap: 10px; }
    .riga { display: grid; grid-template-columns: 90px 1fr 140px 150px; align-items: center; gap: 12px; padding: 14px 18px; }
    .riga.prossima { border-color: var(--accento); box-shadow: 0 0 0 2px rgba(255,157,46,.25); }
    .data { text-align: center; } .g { font-weight: 800; font-size: 1.1rem; color: var(--primario); }
    .stato, .azione { text-align: right; }
    @media (max-width: 760px) { .riga { grid-template-columns: 70px 1fr; } .stato, .azione { text-align: left; } }
  `,
})
export class PartiteSquadraComponent implements OnInit {
  readonly idSquadra = input.required<string>();
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  protected readonly partite = signal<Partita[]>([]);
  protected readonly squadra = signal<Squadra | null>(null);
  protected readonly caricamento = signal(true);
  protected readonly prossima = signal<number | null>(null);

  ngOnInit(): void {
    const id = Number(this.idSquadra());
    this.api.mieSquadre().subscribe((s) => this.squadra.set(s.find((x) => x.id === id) ?? null));
    this.api.partiteSquadra(id).subscribe({
      next: (p) => {
        this.partite.set(p);
        this.prossima.set(p.find((x) => x.stato === 'PROGRAMMATA' || x.stato === 'ROSTER_INVIATI')?.id ?? null);
        this.caricamento.set(false);
      },
      error: (e) => { this.notifiche.errore(e); this.caricamento.set(false); },
    });
  }
}
