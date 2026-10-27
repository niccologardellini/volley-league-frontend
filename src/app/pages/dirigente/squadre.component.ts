import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { NotificheService } from '../../core/notifiche.service';
import { Campionato, Squadra } from '../../core/models';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';

/** Squadre della societa' del dirigente e iscrizione ai campionati con iscrizioni aperte. */
@Component({
  selector: 'app-squadre',
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, MatSelectModule, MatFormFieldModule,
    MatInputModule, StatoVuotoComponent],
  templateUrl: './squadre.component.html',
  styleUrl: './squadre.component.scss',
})
export class SquadreComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  protected readonly auth = inject(AuthService);

  protected readonly squadre = signal<Squadra[]>([]);
  protected readonly aperti = signal<Campionato[]>([]);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);
  protected readonly sceltaCampionato: Record<number, number | null> = {};
  protected nuovaSquadra = '';
  protected readonly mostraNuova = signal(false);

  ngOnInit(): void {
    this.carica();
    this.api.campionati().subscribe((c) => this.aperti.set(c.filter((x) => x.stato === 'ISCRIZIONI_APERTE')));
  }

  carica(): void {
    this.caricamento.set(true);
    this.api.mieSquadre().subscribe({
      next: (s) => { this.squadre.set(s); this.caricamento.set(false); this.errore.set(null); },
      error: (e) => { this.errore.set(this.notifiche.messaggio(e)); this.caricamento.set(false); },
    });
  }

  iscrivi(s: Squadra): void {
    const idC = this.sceltaCampionato[s.id];
    if (!idC) return;
    this.api.iscrivi(idC, s.id).subscribe({
      next: (agg) => {
        this.notifiche.successo(`${agg.nome} iscritta a ${agg.nomeCampionato}`);
        this.squadre.update((l) => l.map((x) => (x.id === agg.id ? agg : x)));
      },
      error: (e) => this.notifiche.errore(e),
    });
  }

  creaSquadra(): void {
    const nome = this.nuovaSquadra.trim();
    if (!nome) return;
    this.api.creaSquadra(nome).subscribe({
      next: (s) => {
        this.squadre.update((l) => [...l, s]);
        this.nuovaSquadra = '';
        this.mostraNuova.set(false);
        this.notifiche.successo(`Squadra ${s.nome} creata: ora tessera gli atleti`);
      },
      error: (e) => this.notifiche.errore(e),
    });
  }
}
