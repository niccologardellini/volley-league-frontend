import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { Campionato, Partita } from '../../core/models';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';
import { StatoChipComponent } from '../../shared/stato-chip.component';
import { PunteggioComponent } from '../../shared/punteggio.component';

/** Calendario e risultati raggruppati per giornata, con filtro per squadra. */
@Component({
  selector: 'app-calendario',
  imports: [FormsModule, DatePipe, MatSelectModule, MatFormFieldModule, MatProgressBarModule, MatIconModule,
    StatoVuotoComponent, StatoChipComponent, PunteggioComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss',
})
export class CalendarioComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly campionati = signal<Campionato[]>([]);
  protected readonly idCampionato = signal<number | null>(null);
  protected readonly partite = signal<Partita[]>([]);
  protected readonly filtroSquadra = signal<number | null>(null);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);

  protected readonly squadre = computed(() => {
    const m = new Map<number, string>();
    this.partite().forEach((p) => { m.set(p.casa.id, p.casa.nome); m.set(p.ospite.id, p.ospite.nome); });
    return [...m.entries()].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  });

  protected readonly giornate = computed(() => {
    const f = this.filtroSquadra();
    const gruppi = new Map<number, Partita[]>();
    this.partite()
      .filter((p) => f === null || p.casa.id === f || p.ospite.id === f)
      .forEach((p) => gruppi.set(p.giornata, [...(gruppi.get(p.giornata) ?? []), p]));
    return [...gruppi.entries()].map(([numero, partite]) => ({ numero, partite, data: partite[0].dataOra }));
  });

  ngOnInit(): void {
    this.api.campionati().subscribe({
      next: (c) => {
        this.campionati.set(c);
        const daUrl = Number(this.route.snapshot.queryParamMap.get('campionato'));
        const iniziale = c.find((x) => x.id === daUrl) ?? c.find((x) => x.numeroPartite > 0) ?? c[0];
        if (iniziale) this.seleziona(iniziale.id);
        else this.caricamento.set(false);
      },
      error: (e) => { this.errore.set(this.notifiche.messaggio(e)); this.caricamento.set(false); },
    });
  }

  seleziona(id: number): void {
    this.idCampionato.set(id);
    this.filtroSquadra.set(null);
    this.router.navigate([], { queryParams: { campionato: id }, replaceUrl: true });
    this.caricamento.set(true);
    this.api.calendario(id).subscribe({
      next: (p) => { this.partite.set(p); this.caricamento.set(false); },
      error: (e) => { this.errore.set(this.notifiche.messaggio(e)); this.caricamento.set(false); },
    });
  }
}
