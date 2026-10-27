import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { AreaGiocatore } from '../../core/models';
import { StatoChipComponent } from '../../shared/stato-chip.component';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';
import { PunteggioComponent } from '../../shared/punteggio.component';

/** Area personale del giocatore: statistiche stagionali, storico presenze e calendario squadra. */
@Component({
  selector: 'app-area-giocatore',
  imports: [DatePipe, MatIconModule, MatProgressBarModule, StatoChipComponent, StatoVuotoComponent, PunteggioComponent],
  templateUrl: './area-giocatore.component.html',
  styleUrl: './area-giocatore.component.scss',
})
export class AreaGiocatoreComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  protected readonly area = signal<AreaGiocatore | null>(null);
  protected readonly errore = signal<string | null>(null);

  /** Andamento punti per gara omologata (grafico a barre CSS). */
  protected readonly andamento = computed(() => {
    const giocate = (this.area()?.storico ?? []).filter((s) => s.puntiFatti !== null);
    const max = Math.max(1, ...giocate.map((s) => s.puntiFatti ?? 0));
    return giocate.map((s) => ({ ...s, perc: Math.round(((s.puntiFatti ?? 0) / max) * 100) }));
  });

  protected readonly etichettaGrafico = computed(() => 'Punti per gara: ' + this.andamento().map((x) => x.puntiFatti).join(', '));

  protected readonly prossime = computed(() =>
    (this.area()?.calendario ?? []).filter((p) => p.stato !== 'OMOLOGATA' && p.stato !== 'REFERTATA').slice(0, 4));

  ngOnInit(): void {
    this.api.areaGiocatore().subscribe({
      next: (a) => this.area.set(a),
      error: (e) => this.errore.set(this.notifiche.messaggio(e)),
    });
  }
}
