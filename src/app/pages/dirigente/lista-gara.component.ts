import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { Partita, RUOLI_CAMPO, Tesserato } from '../../core/models';

/** Stessi limiti applicati dal ListaGaraValidator del backend. */
const MIN_ATLETI = 6;
const MAX_ATLETI = 14;
const MAX_LIBERI = 2;
const SOGLIA_DOPPIO_LIBERO = 12;

/** Composizione della lista gara con validazione in tempo reale. */
@Component({
  selector: 'app-lista-gara',
  imports: [DatePipe, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatProgressBarModule],
  templateUrl: './lista-gara.component.html',
  styleUrl: './lista-gara.component.scss',
})
export class ListaGaraComponent implements OnInit {
  readonly idPartita = input.required<string>();
  readonly idSquadra = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  private readonly router = inject(Router);

  protected readonly partita = signal<Partita | null>(null);
  protected readonly rosa = signal<Tesserato[]>([]);
  protected readonly selezionati = signal<Set<number>>(new Set());
  protected readonly inviataAt = signal<string | null>(null);
  protected readonly erroriServer = signal<string[]>([]);
  protected readonly invio = signal(false);
  protected allenatore = '';
  protected viceAllenatore = '';
  protected dirigente = '';

  protected readonly gruppi = computed(() =>
    RUOLI_CAMPO.map((r) => ({ ruolo: r, atleti: this.rosa().filter((t) => t.ruoloCampo === r) })).filter((g) => g.atleti.length));
  protected readonly numero = computed(() => this.selezionati().size);
  protected readonly liberi = computed(() => this.rosa().filter((t) => t.ruoloCampo === 'LIBERO' && this.selezionati().has(t.id)).length);

  /** Validazione lato client: anticipa gli stessi controlli del server. */
  protected readonly avvisi = computed(() => {
    const a: string[] = [];
    const n = this.numero();
    if (n < MIN_ATLETI) a.push(`Seleziona almeno ${MIN_ATLETI} atleti`);
    if (n > MAX_ATLETI) a.push(`Massimo ${MAX_ATLETI} atleti a referto`);
    if (this.liberi() > MAX_LIBERI) a.push(`Massimo ${MAX_LIBERI} liberi`);
    if (n > SOGLIA_DOPPIO_LIBERO && this.liberi() !== MAX_LIBERI) a.push(`Con più di ${SOGLIA_DOPPIO_LIBERO} atleti servono 2 liberi`);
    return a;
  });

  protected readonly max = MAX_ATLETI;
  protected readonly maxLiberi = MAX_LIBERI;

  ngOnInit(): void {
    const idP = Number(this.idPartita());
    const idS = Number(this.idSquadra());
    forkJoin({ partita: this.api.partita(idP), rosa: this.api.rosa(idS), lista: this.api.listaGara(idP, idS) }).subscribe({
      next: ({ partita, rosa, lista }) => {
        this.partita.set(partita);
        this.rosa.set(rosa);
        if (lista) {
          this.selezionati.set(new Set(lista.atleti.map((a) => a.id)));
          this.allenatore = lista.allenatore;
          this.viceAllenatore = lista.viceAllenatore ?? '';
          this.dirigente = lista.dirigenteAccompagnatore ?? '';
          this.inviataAt.set(lista.inviataAt);
        }
      },
      error: (e) => this.notifiche.errore(e),
    });
  }

  toggle(id: number, checked: boolean): void {
    this.selezionati.update((s) => {
      const n = new Set(s);
      if (checked) n.add(id); else n.delete(id);
      return n;
    });
  }

  invia(): void {
    if (this.avvisi().length || !this.allenatore.trim()) return;
    this.invio.set(true);
    this.erroriServer.set([]);
    this.api.inviaListaGara(Number(this.idPartita()), Number(this.idSquadra()), {
      atleti: [...this.selezionati()],
      allenatore: this.allenatore,
      viceAllenatore: this.viceAllenatore || null,
      dirigenteAccompagnatore: this.dirigente || null,
    }).subscribe({
      next: () => {
        this.notifiche.successo('Lista gara inviata');
        this.router.navigate(['/dirigente/partite', this.idSquadra()]);
      },
      error: (e) => {
        this.erroriServer.set(this.notifiche.dettaglio(e).errori);
        this.notifiche.errore(e);
        this.invio.set(false);
      },
    });
  }
}
