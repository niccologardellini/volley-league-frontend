import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth.service';
import { ETICHETTE_RUOLO, Ruolo } from '../core/models';

interface VoceMenu {
  etichetta: string;
  icona: string;
  link: string;
}

/** Voci di navigazione per ruolo: l'utente vede solo le funzioni a lui consentite. */
const MENU: Record<Ruolo, VoceMenu[]> = {
  ADMIN: [
    { etichetta: 'Campionati', icona: 'emoji_events', link: '/admin/campionati' },
    { etichetta: 'Designazioni', icona: 'sports', link: '/admin/designazioni' },
    { etichetta: 'Omologazioni', icona: 'gavel', link: '/admin/omologazioni' },
  ],
  DIRIGENTE: [{ etichetta: 'Le mie squadre', icona: 'groups', link: '/dirigente/squadre' }],
  ARBITRO: [{ etichetta: 'Designazioni', icona: 'assignment', link: '/arbitro/designazioni' }],
  GIOCATORE: [{ etichetta: 'Area personale', icona: 'person', link: '/giocatore/area' }],
};

const COMUNI: VoceMenu[] = [
  { etichetta: 'Classifica', icona: 'leaderboard', link: '/classifica' },
  { etichetta: 'Calendario', icona: 'calendar_month', link: '/calendario' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly breakpoints = inject(BreakpointObserver);

  /** Su schermi stretti il menu diventa un drawer a scomparsa. */
  protected readonly mobile = toSignal(
    this.breakpoints.observe('(max-width: 900px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected readonly vociRuolo = computed(() => {
    const u = this.auth.utente();
    return u ? MENU[u.ruolo] : [];
  });
  protected readonly vociComuni = COMUNI;
  protected readonly etichettaRuolo = computed(() => {
    const u = this.auth.utente();
    return u ? ETICHETTE_RUOLO[u.ruolo] : '';
  });
  protected readonly iniziali = computed(() => {
    const u = this.auth.utente();
    return u ? (u.nome[0] + u.cognome[0]).toUpperCase() : '';
  });
}
