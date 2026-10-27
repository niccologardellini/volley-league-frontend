import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { RUOLI_CAMPO, RuoloCampo, Squadra, Tesserato } from '../../core/models';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';

/** Rosa ufficiale della squadra: tesseramento, modifica e svincolo degli atleti. */
@Component({
  selector: 'app-rosa',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatDialogModule, MatTooltipModule, StatoVuotoComponent],
  templateUrl: './rosa.component.html',
  styles: `
    .ruolo { text-transform: capitalize; }
    .maglia { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: var(--primario); color: #fff; font-weight: 700; }
    .libero { background: var(--accento); color: #1b2340; }
    .riepilogo { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  `,
})
export class RosaComponent implements OnInit {
  /** Parametro di rotta (withComponentInputBinding). */
  readonly idSquadra = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifiche = inject(NotificheService);

  protected readonly squadra = signal<Squadra | null>(null);
  protected readonly tesserati = signal<Tesserato[]>([]);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);
  protected readonly colonne = ['numero', 'atleta', 'ruolo', 'account', 'azioni'];

  protected readonly perRuolo = computed(() =>
    RUOLI_CAMPO.map((r) => ({ ruolo: r, n: this.tesserati().filter((t) => t.ruoloCampo === r).length })));

  ngOnInit(): void {
    const id = Number(this.idSquadra());
    this.api.mieSquadre().subscribe((s) => this.squadra.set(s.find((x) => x.id === id) ?? null));
    this.carica();
  }

  carica(): void {
    this.caricamento.set(true);
    this.api.rosa(Number(this.idSquadra())).subscribe({
      next: (t) => { this.tesserati.set(t); this.caricamento.set(false); },
      error: (e) => { this.errore.set(this.notifiche.messaggio(e)); this.caricamento.set(false); },
    });
  }

  apri(t?: Tesserato): void {
    this.dialog.open(TesseratoDialog, { width: '520px', data: { idSquadra: Number(this.idSquadra()), tesserato: t } })
      .afterClosed().subscribe((ok) => ok && this.carica());
  }

  svincola(t: Tesserato): void {
    if (!confirm(`Svincolare ${t.nome} ${t.cognome} (n° ${t.numeroMaglia})?`)) return;
    this.api.svincola(t.id).subscribe({
      next: () => { this.notifiche.successo(`${t.nome} ${t.cognome} svincolata`); this.carica(); },
      error: (e) => this.notifiche.errore(e),
    });
  }
}

@Component({
  selector: 'app-tesserato-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.tesserato ? 'Modifica tesserato' : 'Nuovo tesseramento' }}</h2>
    <form [formGroup]="form" (ngSubmit)="salva()">
      <mat-dialog-content>
        <div class="row">
          <mat-form-field appearance="outline" class="grow"><mat-label>Nome</mat-label>
            <input matInput formControlName="nome" required cdkFocusInitial><mat-error>Obbligatorio</mat-error></mat-form-field>
          <mat-form-field appearance="outline" class="grow"><mat-label>Cognome</mat-label>
            <input matInput formControlName="cognome" required><mat-error>Obbligatorio</mat-error></mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline" class="grow"><mat-label>Ruolo in campo</mat-label>
            <mat-select formControlName="ruoloCampo" required>
              @for (r of ruoli; track r) { <mat-option [value]="r">{{ r.charAt(0) + r.slice(1).toLowerCase() }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="num-f"><mat-label>N° maglia</mat-label>
            <input matInput type="number" min="1" max="99" formControlName="numeroMaglia" required>
            <mat-error>Da 1 a 99</mat-error></mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full"><mat-label>Email account giocatore (facoltativa)</mat-label>
          <input matInput type="email" formControlName="emailAccount" [readonly]="!!data.tesserato?.emailAccount">
          <mat-hint>Crea l'accesso all'area personale (password iniziale: "password")</mat-hint>
          <mat-error>Email non valida</mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annulla</button>
        <button mat-flat-button type="submit" [disabled]="invio()">{{ data.tesserato ? 'Salva' : 'Tessera' }}</button>
      </mat-dialog-actions>
    </form>`,
  styles: `.grow { flex: 1; } .num-f { width: 120px; }`,
})
export class TesseratoDialog {
  protected readonly data = inject<{ idSquadra: number; tesserato?: Tesserato }>(MAT_DIALOG_DATA);
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  private readonly ref = inject(MatDialogRef<TesseratoDialog>);
  protected readonly ruoli = RUOLI_CAMPO;
  protected readonly invio = signal(false);
  protected readonly form = inject(FormBuilder).group({
    nome: [this.data.tesserato?.nome ?? '', Validators.required],
    cognome: [this.data.tesserato?.cognome ?? '', Validators.required],
    ruoloCampo: [this.data.tesserato?.ruoloCampo ?? ('SCHIACCIATORE' as RuoloCampo), Validators.required],
    numeroMaglia: [this.data.tesserato?.numeroMaglia ?? null as number | null, [Validators.required, Validators.min(1), Validators.max(99)]],
    emailAccount: [this.data.tesserato?.emailAccount ?? '', Validators.email],
  });

  salva(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const body = {
      nome: v.nome!, cognome: v.cognome!, ruoloCampo: v.ruoloCampo!, numeroMaglia: Number(v.numeroMaglia),
      emailAccount: v.emailAccount?.trim() ? v.emailAccount.trim() : null,
    };
    this.invio.set(true);
    const op = this.data.tesserato ? this.api.aggiornaTesserato(this.data.tesserato.id, body) : this.api.tessera(this.data.idSquadra, body);
    op.subscribe({
      next: (t) => { this.notifiche.successo(`${t.nome} ${t.cognome} salvata in rosa`); this.ref.close(true); },
      error: (e) => { this.notifiche.errore(e); this.invio.set(false); },
    });
  }
}
