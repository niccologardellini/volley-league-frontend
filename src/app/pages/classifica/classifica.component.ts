import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { NotificheService } from '../../core/notifiche.service';
import { Campionato, CriterioOrdinamento, RigaClassifica } from '../../core/models';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';

/** Classifica del campionato con scelta del criterio di ordinamento (Strategy lato server). */
@Component({
  selector: 'app-classifica',
  imports: [FormsModule, DecimalPipe, MatSelectModule, MatFormFieldModule, MatButtonToggleModule, MatTableModule,
    MatProgressBarModule, MatTooltipModule, StatoVuotoComponent],
  templateUrl: './classifica.component.html',
  styleUrl: './classifica.component.scss',
})
export class ClassificaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly campionati = signal<Campionato[]>([]);
  protected readonly idCampionato = signal<number | null>(null);
  protected readonly criterio = signal<CriterioOrdinamento>('FIPAV');
  protected readonly righe = signal<RigaClassifica[]>([]);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);

  protected readonly colonne = ['posizione', 'squadra', 'punti', 'giocate', 'vinte', 'perse', 'setVinti', 'setPersi',
    'quozienteSet', 'puntiFatti', 'puntiSubiti', 'quozientePunti', 'risultati'];
  protected readonly etichetteRisultati = ['3-0', '3-1', '3-2', '2-3', '1-3', '0-3'];

  protected readonly campionatoCorrente = computed(() => this.campionati().find((c) => c.id === this.idCampionato()));
  /** Societa' dell'utente: le sue squadre vengono evidenziate. */
  protected readonly miaSocieta = computed(() => this.auth.utente()?.nomeSocieta ?? null);

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
    this.router.navigate([], { queryParams: { campionato: id }, replaceUrl: true });
    this.carica();
  }

  cambiaCriterio(c: CriterioOrdinamento): void {
    this.criterio.set(c);
    this.carica();
  }

  private carica(): void {
    const id = this.idCampionato();
    if (id === null) return;
    this.caricamento.set(true);
    this.errore.set(null);
    this.api.classifica(id, this.criterio()).subscribe({
      next: (r) => { this.righe.set(r); this.caricamento.set(false); },
      error: (e) => { this.errore.set(this.notifiche.messaggio(e)); this.caricamento.set(false); },
    });
  }
}
