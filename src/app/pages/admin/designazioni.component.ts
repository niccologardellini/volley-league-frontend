import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { ArbitroCompatibile, Partita } from '../../core/models';
import { StatoChipComponent } from '../../shared/stato-chip.component';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';

/** Designazione arbitrale delle gare ancora da disputare. */
@Component({
  selector: 'app-designazioni',
  imports: [DatePipe, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatProgressBarModule, MatDialogModule, StatoChipComponent, StatoVuotoComponent],
  templateUrl: './designazioni.component.html',
  styles: `.sq { font-weight: 600; } .vs { color: var(--testo-sec); margin: 0 6px; } .senza { color: #8a5300; font-weight: 600; }`,
})
export class DesignazioniComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifiche = inject(NotificheService);

  protected readonly partite = signal<Partita[]>([]);
  protected readonly soloSenzaArbitro = signal(false);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);
  protected readonly colonne = ['data', 'gara', 'campionato', 'stato', 'arbitro', 'azioni'];

  protected readonly visibili = computed(() =>
    this.partite().filter((p) => !this.soloSenzaArbitro() || p.idArbitro === null));
  protected readonly daDesignare = computed(() => this.partite().filter((p) => p.idArbitro === null).length);

  ngOnInit(): void {
    this.carica();
  }

  carica(): void {
    this.caricamento.set(true);
    this.api.partite(['PROGRAMMATA', 'ROSTER_INVIATI']).subscribe({
      next: (p) => { this.partite.set(p); this.caricamento.set(false); },
      error: (e) => { this.errore.set(this.notifiche.messaggio(e)); this.caricamento.set(false); },
    });
  }

  designa(p: Partita): void {
    this.dialog.open(DesignaDialog, { width: '560px', data: p }).afterClosed().subscribe((aggiornata?: Partita) => {
      if (aggiornata) this.partite.update((l) => l.map((x) => (x.id === aggiornata.id ? aggiornata : x)));
    });
  }
}

@Component({
  selector: 'app-designa-dialog',
  imports: [DatePipe, FormsModule, MatDialogModule, MatButtonModule, MatRadioModule, MatIconModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>Designa arbitro</h2>
    <mat-dialog-content>
      <p><strong>{{ data.casa.nome }}</strong> – <strong>{{ data.ospite.nome }}</strong><br>
        <span class="muted small">{{ data.dataOra | date: 'EEEE d MMMM, HH:mm' }}</span></p>
      <div class="info-box small">Non designabili: arbitri della stessa società o provincia delle squadre, o già impegnati nello stesso giorno.</div>
      @if (!arbitri()) { <mat-progress-bar mode="indeterminate" /> }
      <mat-radio-group [(ngModel)]="scelto" aria-label="Arbitri disponibili" class="lista">
        @for (a of arbitri() ?? []; track a.id) {
          <div class="arb" [class.no]="!a.compatibile">
            <mat-radio-button [value]="a.id" [disabled]="!a.compatibile">
              <span class="nome">{{ a.nome }}</span>
              <span class="muted small"> · prov. {{ a.provincia }}@if (a.societa) { · {{ a.societa }} }</span>
            </mat-radio-button>
            @if (!a.compatibile) {
              <ul class="motivi">@for (m of a.motivi; track m) { <li>{{ m }}</li> }</ul>
            } @else if (a.id === data.idArbitro) { <span class="attuale">designato</span> }
          </div>
        }
      </mat-radio-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annulla</button>
      <button mat-flat-button (click)="conferma()" [disabled]="!scelto || invio()">Conferma designazione</button>
    </mat-dialog-actions>`,
  styles: `
    .lista { display: grid; gap: 6px; }
    .arb { border: 1px solid var(--bordo); border-radius: 10px; padding: 4px 10px; }
    .arb.no { background: #fafafa; }
    .nome { font-weight: 600; }
    .motivi { margin: 0 0 6px 40px; padding: 0; list-style: none; color: #8c1d18; font-size: .8rem; }
    .attuale { margin-left: 40px; font-size: .75rem; color: #116336; font-weight: 700; }
  `,
})
export class DesignaDialog implements OnInit {
  protected readonly data = inject<Partita>(MAT_DIALOG_DATA);
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  private readonly ref = inject(MatDialogRef<DesignaDialog>);
  protected readonly arbitri = signal<ArbitroCompatibile[] | null>(null);
  protected readonly invio = signal(false);
  protected scelto: number | null = this.data.idArbitro;

  ngOnInit(): void {
    this.api.arbitriPerPartita(this.data.id).subscribe({
      next: (a) => this.arbitri.set(a),
      error: (e) => { this.notifiche.errore(e); this.ref.close(); },
    });
  }

  conferma(): void {
    if (!this.scelto) return;
    this.invio.set(true);
    this.api.designa(this.data.id, this.scelto).subscribe({
      next: (p) => { this.notifiche.successo(`${p.arbitro} designato per ${p.casa.nome} – ${p.ospite.nome}`); this.ref.close(p); },
      error: (e) => { this.notifiche.errore(e); this.invio.set(false); },
    });
  }
}
