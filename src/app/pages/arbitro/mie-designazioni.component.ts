import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { Partita } from '../../core/models';
import { StatoChipComponent } from '../../shared/stato-chip.component';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';
import { PunteggioComponent } from '../../shared/punteggio.component';

/** Calendario delle designazioni dell'arbitro con le azioni consentite dallo stato della gara. */
@Component({
  selector: 'app-mie-designazioni',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, StatoChipComponent, StatoVuotoComponent, PunteggioComponent],
  template: `
    <header class="page-header">
      <div><h1>Le mie designazioni</h1><p>{{ daFare() }} gare richiedono un'azione</p></div>
    </header>
    @if (caricamento()) { <mat-progress-bar mode="indeterminate" aria-label="Caricamento" /> }
    @if (!caricamento() && partite().length === 0) {
      <app-stato-vuoto icona="sports" titolo="Nessuna designazione" testo="Il giudice sportivo non ti ha ancora designato per alcuna gara." />
    }
    <div class="lista">
      @for (p of partite(); track p.id) {
        <article class="card riga" [class.azione-richiesta]="p.stato === 'ROSTER_INVIATI' || p.stato === 'IN_CORSO'">
          <div class="data">
            <div class="giorno">{{ p.dataOra | date: 'd' }}</div>
            <div class="small">{{ p.dataOra | date: 'MMM yyyy' }}</div>
            <div class="small muted">{{ p.dataOra | date: 'HH:mm' }}</div>
          </div>
          <div>
            <div class="muted small">{{ p.campionato }} · {{ p.giornata }}ª giornata</div>
            <app-punteggio [partita]="p" />
            @if (p.noteGiudice && p.stato === 'IN_CORSO') {
              <div class="errori-box small"><strong>Referto respinto dal giudice:</strong> {{ p.noteGiudice }}</div>
            }
          </div>
          <div class="azioni">
            <app-stato-chip [stato]="p.stato" />
            @switch (p.stato) {
              @case ('PROGRAMMATA') { <span class="small muted">In attesa delle liste gara</span> }
              @case ('ROSTER_INVIATI') {
                <button mat-flat-button (click)="avvia(p)" [disabled]="invio() === p.id"><mat-icon>play_arrow</mat-icon> Avvia gara</button>
              }
              @case ('IN_CORSO') {
                <a mat-flat-button [routerLink]="['/arbitro/referto', p.id]"><mat-icon>edit_note</mat-icon> Compila referto</a>
              }
              @default { <span class="small muted">Referto firmato</span> }
            }
          </div>
        </article>
      }
    </div>`,
  styles: `
    .lista { display: grid; gap: 10px; }
    .riga { display: grid; grid-template-columns: 80px 1fr 190px; gap: 16px; align-items: center; }
    .riga.azione-richiesta { border-left: 4px solid var(--accento); }
    .data { text-align: center; text-transform: capitalize; }
    .giorno { font-size: 1.8rem; font-weight: 800; color: var(--primario); line-height: 1; }
    .azioni { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    @media (max-width: 760px) { .riga { grid-template-columns: 64px 1fr; } .azioni { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; } }
  `,
})
export class MieDesignazioniComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  protected readonly partite = signal<Partita[]>([]);
  protected readonly caricamento = signal(true);
  protected readonly invio = signal<number | null>(null);
  protected readonly daFare = computed(() => this.partite().filter((p) => p.stato === 'ROSTER_INVIATI' || p.stato === 'IN_CORSO').length);

  ngOnInit(): void {
    this.api.mieDesignazioni().subscribe({
      next: (p) => { this.partite.set(p); this.caricamento.set(false); },
      error: (e) => { this.notifiche.errore(e); this.caricamento.set(false); },
    });
  }

  avvia(p: Partita): void {
    this.invio.set(p.id);
    this.api.avviaGara(p.id).subscribe({
      next: (agg) => {
        this.partite.update((l) => l.map((x) => (x.id === agg.id ? agg : x)));
        this.notifiche.successo('Gara avviata: ora puoi compilare il referto');
        this.invio.set(null);
      },
      error: (e) => { this.notifiche.errore(e); this.invio.set(null); },
    });
  }
}
