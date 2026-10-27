import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, Ruolo, Utente } from './models';

const CHIAVE_TOKEN = 'volley.token';
const CHIAVE_UTENTE = 'volley.utente';

/**
 * Stato di autenticazione dell'applicazione.
 * Token e profilo sono salvati in sessionStorage: chiudendo la scheda la sessione termina.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _utente = signal<Utente | null>(this.leggiUtente());
  readonly utente = this._utente.asReadonly();
  readonly autenticato = computed(() => this._utente() !== null);

  get token(): string | null {
    return sessionStorage.getItem(CHIAVE_TOKEN);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((r) => {
        sessionStorage.setItem(CHIAVE_TOKEN, r.token);
        sessionStorage.setItem(CHIAVE_UTENTE, JSON.stringify(r.utente));
        this._utente.set(r.utente);
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(CHIAVE_TOKEN);
    sessionStorage.removeItem(CHIAVE_UTENTE);
    this._utente.set(null);
    this.router.navigate(['/login']);
  }

  haRuolo(...ruoli: Ruolo[]): boolean {
    const u = this._utente();
    return !!u && ruoli.includes(u.ruolo);
  }

  /** Pagina iniziale di ciascun ruolo dopo il login. */
  homeDelRuolo(): string {
    switch (this._utente()?.ruolo) {
      case 'ADMIN': return '/admin/campionati';
      case 'DIRIGENTE': return '/dirigente/squadre';
      case 'ARBITRO': return '/arbitro/designazioni';
      case 'GIOCATORE': return '/giocatore/area';
      default: return '/login';
    }
  }

  private leggiUtente(): Utente | null {
    const raw = sessionStorage.getItem(CHIAVE_UTENTE);
    return raw && sessionStorage.getItem(CHIAVE_TOKEN) ? (JSON.parse(raw) as Utente) : null;
  }
}
