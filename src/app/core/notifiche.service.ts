import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErroreApi } from './models';

/** Messaggi di esito (snackbar) ed estrazione degli errori restituiti dal backend. */
@Injectable({ providedIn: 'root' })
export class NotificheService {
  private readonly snack = inject(MatSnackBar);

  successo(msg: string): void {
    this.snack.open(msg, 'OK', { duration: 3500, panelClass: 'snack-ok' });
  }

  errore(err: unknown): void {
    this.snack.open(this.messaggio(err), 'Chiudi', { duration: 6000, panelClass: 'snack-ko' });
  }

  /** Messaggio principale dell'errore API (con il primo dettaglio, se presente). */
  messaggio(err: unknown): string {
    const e = this.dettaglio(err);
    return e.errori.length && e.errori[0] !== e.messaggio ? `${e.messaggio}: ${e.errori[0]}` : e.messaggio;
  }

  dettaglio(err: unknown): ErroreApi {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return { status: 0, messaggio: 'Server non raggiungibile: verifica che il backend sia avviato', errori: [] };
      }
      const body = err.error as Partial<ErroreApi> | null;
      return {
        status: err.status,
        messaggio: body?.messaggio ?? `Errore ${err.status}`,
        errori: body?.errori ?? [],
      };
    }
    return { status: -1, messaggio: 'Errore imprevisto', errori: [] };
  }
}
