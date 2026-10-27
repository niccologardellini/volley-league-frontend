import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { Partita, Referto } from '../../core/models';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';
import { RefertoViewComponent } from '../../shared/referto-view.component';

/** Revisione dei referti firmati: omologazione o respingimento motivato. */
@Component({
  selector: 'app-omologazioni',
  imports: [DatePipe, FormsModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatFormFieldModule, MatInputModule,
    StatoVuotoComponent, RefertoViewComponent],
  templateUrl: './omologazioni.component.html',
  styleUrl: './omologazioni.component.scss',
})
export class OmologazioniComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);

  protected readonly partite = signal<Partita[]>([]);
  protected readonly selezionata = signal<Partita | null>(null);
  protected readonly referto = signal<Referto | null>(null);
  protected readonly caricamento = signal(true);
  protected readonly invio = signal(false);
  protected readonly mostraRespingi = signal(false);
  protected motivazione = '';

  ngOnInit(): void {
    this.carica();
  }

  carica(): void {
    this.caricamento.set(true);
    this.api.partite(['REFERTATA']).subscribe({
      next: (p) => {
        this.partite.set(p);
        this.caricamento.set(false);
        if (p.length && !this.selezionata()) this.apri(p[0]);
      },
      error: (e) => { this.notifiche.errore(e); this.caricamento.set(false); },
    });
  }

  apri(p: Partita): void {
    this.selezionata.set(p);
    this.referto.set(null);
    this.mostraRespingi.set(false);
    this.motivazione = '';
    this.api.referto(p.id).subscribe({ next: (r) => this.referto.set(r), error: (e) => this.notifiche.errore(e) });
  }

  omologa(): void {
    const p = this.selezionata();
    if (!p) return;
    this.invio.set(true);
    this.api.omologa(p.id).subscribe({
      next: () => { this.notifiche.successo('Risultato omologato: la classifica è aggiornata'); this.chiudi(p); },
      error: (e) => { this.notifiche.errore(e); this.invio.set(false); },
    });
  }

  respingi(): void {
    const p = this.selezionata();
    if (!p || !this.motivazione.trim()) return;
    this.invio.set(true);
    this.api.respingi(p.id, this.motivazione).subscribe({
      next: () => { this.notifiche.successo("Referto respinto e restituito all'arbitro"); this.chiudi(p); },
      error: (e) => { this.notifiche.errore(e); this.invio.set(false); },
    });
  }

  private chiudi(p: Partita): void {
    this.invio.set(false);
    const restanti = this.partite().filter((x) => x.id !== p.id);
    this.partite.set(restanti);
    this.selezionata.set(null);
    this.referto.set(null);
    if (restanti.length) this.apri(restanti[0]);
  }
}
