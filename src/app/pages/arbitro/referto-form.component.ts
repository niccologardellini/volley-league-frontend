import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { NotificheService } from '../../core/notifiche.service';
import { ETICHETTE_SANZIONE, ParzialeSet, Referto, Sanzione, Tesserato } from '../../core/models';
import { erroreSet, esito } from './regole-set';

/**
 * Referto digitale: parziali set per set (FormArray dinamico), statistiche degli atleti
 * convocati, sanzioni e firma con password dell'arbitro.
 */
@Component({
  selector: 'app-referto-form',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './referto-form.component.html',
  styleUrl: './referto-form.component.scss',
})
export class RefertoFormComponent implements OnInit {
  readonly idPartita = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly notifiche = inject(NotificheService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly referto = signal<Referto | null>(null);
  protected readonly erroriServer = signal<string[]>([]);
  protected readonly invio = signal(false);
  protected readonly sanzioni = Object.entries(ETICHETTE_SANZIONE) as [Sanzione, string][];

  protected readonly form = this.fb.group({
    set: this.fb.array<FormGroup>([]),
    statistiche: this.fb.array<FormGroup>([]),
    note: [''],
    conferma: [false, Validators.requiredTrue],
    passwordFirma: ['', Validators.required],
  });

  get setArray(): FormArray<FormGroup> {
    return this.form.controls.set;
  }

  get statArray(): FormArray<FormGroup> {
    return this.form.controls.statistiche;
  }

  /** Valori del form come signal per ricalcolare risultato e avvisi a ogni modifica. */
  private readonly valori = toSignal(this.form.valueChanges.pipe(startWith(null)));

  protected readonly parziali = computed<ParzialeSet[]>(() => {
    this.valori();
    return this.setArray.getRawValue().map((s, i) => ({
      numeroSet: i + 1,
      puntiCasa: Number(s['puntiCasa']) || 0,
      puntiOspite: Number(s['puntiOspite']) || 0,
      cambiCasa: Number(s['cambiCasa']) || 0,
      cambiOspite: Number(s['cambiOspite']) || 0,
    }));
  });
  protected readonly erroriSet = computed(() => this.parziali().map((s) => erroreSet(s)));
  protected readonly risultato = computed(() => esito(this.parziali()));
  protected readonly refertoValido = computed(
    () => this.erroriSet().every((e) => e === null) && this.risultato().errore === null && this.parziali().length >= 3);

  /** Righe statistiche raggruppate per squadra (indice nel FormArray + dati atleta). */
  protected readonly righe = signal<{ idSquadra: number; squadra: string; atleti: { idx: number; t: Tesserato }[] }[]>([]);

  ngOnInit(): void {
    this.api.referto(Number(this.idPartita())).subscribe({
      next: (r) => this.inizializza(r),
      error: (e) => this.notifiche.errore(e),
    });
  }

  private inizializza(r: Referto): void {
    this.referto.set(r);
    const esistenti = r.set.length ? r.set : [];
    const n = Math.max(3, esistenti.length);
    for (let i = 0; i < n; i++) this.setArray.push(this.nuovoSet(esistenti[i]));

    const statEsistenti = new Map(r.statistiche.map((s) => [s.idTesserato, s]));
    const gruppi: { idSquadra: number; squadra: string; atleti: { idx: number; t: Tesserato }[] }[] = [];
    for (const sq of [r.partita.casa, r.partita.ospite]) {
      const lista = r.liste.find((l) => l.idSquadra === sq.id);
      const atleti = (lista?.atleti ?? []).map((t) => {
        const s = statEsistenti.get(t.id);
        this.statArray.push(this.fb.group({
          idTesserato: [t.id],
          inCampo: [!!s],
          puntiFatti: [s?.puntiFatti ?? 0, [Validators.min(0)]],
          ace: [s?.ace ?? 0, [Validators.min(0)]],
          muri: [s?.muri ?? 0, [Validators.min(0)]],
          errori: [s?.errori ?? 0, [Validators.min(0)]],
          cartellino: [(s?.cartellino ?? 'NESSUNA') as Sanzione],
        }));
        return { idx: this.statArray.length - 1, t };
      });
      gruppi.push({ idSquadra: sq.id, squadra: sq.nome, atleti });
    }
    this.righe.set(gruppi);
    this.form.controls.note.setValue(r.note ?? '');
  }

  private nuovoSet(s?: ParzialeSet): FormGroup {
    return this.fb.group({
      puntiCasa: [s?.puntiCasa ?? null as number | null, [Validators.required, Validators.min(0)]],
      puntiOspite: [s?.puntiOspite ?? null as number | null, [Validators.required, Validators.min(0)]],
      cambiCasa: [s?.cambiCasa ?? 0, [Validators.min(0), Validators.max(6)]],
      cambiOspite: [s?.cambiOspite ?? 0, [Validators.min(0), Validators.max(6)]],
    });
  }

  aggiungiSet(): void {
    if (this.setArray.length < 5) this.setArray.push(this.nuovoSet());
  }

  rimuoviSet(): void {
    if (this.setArray.length > 3) this.setArray.removeAt(this.setArray.length - 1);
  }

  /** Quando si inseriscono punti/ace/muri l'atleta viene marcato automaticamente "in campo". */
  segnaInCampo(idx: number): void {
    this.statArray.at(idx).controls['inCampo'].setValue(true);
  }

  invia(): void {
    if (!this.refertoValido() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const statistiche = this.statArray.getRawValue()
      .filter((s) => s['inCampo'] || s['cartellino'] !== 'NESSUNA')
      .map((s) => ({
        idTesserato: s['idTesserato'], puntiFatti: Number(s['puntiFatti']), ace: Number(s['ace']),
        muri: Number(s['muri']), errori: Number(s['errori']), cartellino: s['cartellino'],
      }));
    this.invio.set(true);
    this.erroriServer.set([]);
    this.api.inviaReferto(Number(this.idPartita()), {
      set: this.parziali(), statistiche, note: v.note || null, passwordFirma: v.passwordFirma,
    }).subscribe({
      next: () => {
        this.notifiche.successo('Referto firmato e inviato al giudice sportivo');
        this.router.navigate(['/arbitro/designazioni']);
      },
      error: (e) => {
        const d = this.notifiche.dettaglio(e);
        this.erroriServer.set(d.errori.length ? d.errori : [d.messaggio]);
        this.notifiche.errore(e);
        this.invio.set(false);
      },
    });
  }
}
