import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { Campionato, Squadra } from '../../core/models';
import { StatoVuotoComponent } from '../../shared/stato-vuoto.component';

const ETICHETTE_STATO_CAMP = { ISCRIZIONI_APERTE: 'Iscrizioni aperte', IN_CORSO: 'In corso', CONCLUSO: 'Concluso' } as const;

/** Gestione campionati (giudice sportivo): creazione, squadre iscritte, generazione calendario. */
@Component({
  selector: 'app-campionati',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatDialogModule, MatProgressBarModule, MatExpansionModule, StatoVuotoComponent],
  templateUrl: './campionati.component.html',
  styleUrl: './campionati.component.scss',
})
export class CampionatiComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifiche = inject(NotificheService);

  protected readonly campionati = signal<Campionato[]>([]);
  protected readonly squadre = signal<Record<number, Squadra[]>>({});
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);
  protected readonly etichette = ETICHETTE_STATO_CAMP;

  ngOnInit(): void {
    this.carica();
  }

  carica(): void {
    this.caricamento.set(true);
    this.api.campionati().subscribe({
      next: (c) => { this.campionati.set(c); this.caricamento.set(false); this.errore.set(null); },
      error: (e) => { this.errore.set(this.notifiche.messaggio(e)); this.caricamento.set(false); },
    });
  }

  caricaSquadre(id: number): void {
    if (this.squadre()[id]) return;
    this.api.squadreCampionato(id).subscribe((s) => this.squadre.update((m) => ({ ...m, [id]: s })));
  }

  nuovo(): void {
    this.dialog.open(NuovoCampionatoDialog, { width: '480px' }).afterClosed().subscribe((ok) => ok && this.carica());
  }

  generaCalendario(c: Campionato): void {
    this.dialog.open(GeneraCalendarioDialog, { width: '480px', data: c }).afterClosed().subscribe((ok) => {
      if (ok) {
        this.squadre.update((m) => { const copia = { ...m }; delete copia[c.id]; return copia; });
        this.carica();
      }
    });
  }
}

@Component({
  selector: 'app-nuovo-campionato-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Nuovo campionato</h2>
    <form [formGroup]="form" (ngSubmit)="salva()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full"><mat-label>Nome</mat-label>
          <input matInput formControlName="nome" placeholder="Serie D Maschile" cdkFocusInitial required>
          <mat-error>Il nome è obbligatorio</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Categoria</mat-label>
          <input matInput formControlName="categoria" placeholder="Serie D Maschile" required>
          <mat-error>La categoria è obbligatoria</mat-error>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="grow"><mat-label>Stagione</mat-label>
            <input matInput formControlName="stagione" placeholder="2026/2027" required>
            <mat-hint>Formato AAAA/AAAA</mat-hint>
            <mat-error>Formato atteso AAAA/AAAA</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="girone"><mat-label>Girone</mat-label>
            <input matInput formControlName="girone" placeholder="A" required>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annulla</button>
        <button mat-flat-button type="submit" [disabled]="invio()">Crea campionato</button>
      </mat-dialog-actions>
    </form>`,
  styles: `.grow { flex: 1; } .girone { width: 110px; }`,
})
export class NuovoCampionatoDialog {
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  private readonly ref = inject(MatDialogRef<NuovoCampionatoDialog>);
  protected readonly invio = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', Validators.required],
    categoria: ['', Validators.required],
    stagione: ['2026/2027', [Validators.required, Validators.pattern(/^\d{4}\/\d{4}$/)]],
    girone: ['A', Validators.required],
  });

  salva(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.invio.set(true);
    this.api.creaCampionato(this.form.getRawValue()).subscribe({
      next: (c) => { this.notifiche.successo(`Campionato "${c.nome}" creato: iscrizioni aperte`); this.ref.close(true); },
      error: (e) => { this.notifiche.errore(e); this.invio.set(false); },
    });
  }
}

@Component({
  selector: 'app-genera-calendario-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDatepickerModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>Genera calendario</h2>
    <form [formGroup]="form" (ngSubmit)="genera()">
      <mat-dialog-content>
        <p class="muted">{{ data.nome }} · Girone {{ data.girone }} — {{ data.numeroSquadre }} squadre iscritte.
          Il calendario all'italiana viene generato con l'algoritmo di Berger e chiude le iscrizioni.</p>
        <mat-form-field appearance="outline" class="full"><mat-label>Prima giornata</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dataInizio" required>
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="grow"><mat-label>Orario</mat-label>
            <input matInput type="time" formControlName="ora" required>
          </mat-form-field>
          <mat-form-field appearance="outline" class="grow"><mat-label>Giorni tra giornate</mat-label>
            <input matInput type="number" min="1" max="30" formControlName="giorniTraGiornate" required>
          </mat-form-field>
        </div>
        <mat-slide-toggle formControlName="andataRitorno">Andata e ritorno</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annulla</button>
        <button mat-flat-button type="submit" [disabled]="invio() || data.numeroSquadre < 2">Genera</button>
      </mat-dialog-actions>
    </form>`,
  styles: `.grow { flex: 1; }`,
})
export class GeneraCalendarioDialog {
  protected readonly data = inject<Campionato>(MAT_DIALOG_DATA);
  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  private readonly ref = inject(MatDialogRef<GeneraCalendarioDialog>);
  protected readonly invio = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    dataInizio: [prossimoSabato(), Validators.required],
    ora: ['20:30', Validators.required],
    giorniTraGiornate: [7, [Validators.required, Validators.min(1), Validators.max(30)]],
    andataRitorno: [true],
  });

  genera(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const d = v.dataInizio;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.invio.set(true);
    this.api.generaCalendario(this.data.id, { dataInizio: iso, ora: v.ora, giorniTraGiornate: v.giorniTraGiornate, andataRitorno: v.andataRitorno })
      .subscribe({
        next: (p) => { this.notifiche.successo(`Calendario generato: ${p.length} partite`); this.ref.close(true); },
        error: (e) => { this.notifiche.errore(e); this.invio.set(false); },
      });
  }
}

function prossimoSabato(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d;
}
