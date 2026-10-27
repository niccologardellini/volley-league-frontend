import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';

/**
 * Rotte dell'applicazione. Ogni area e' protetta da roleGuard con l'elenco dei ruoli ammessi
 * (la stessa regola e' applicata lato server con @PreAuthorize).
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
      { path: 'classifica', title: 'Classifica', loadComponent: () => import('./pages/classifica/classifica.component').then((m) => m.ClassificaComponent) },
      { path: 'calendario', title: 'Calendario e risultati', loadComponent: () => import('./pages/calendario/calendario.component').then((m) => m.CalendarioComponent) },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { ruoli: ['ADMIN'] },
        children: [
          { path: 'campionati', title: 'Campionati', loadComponent: () => import('./pages/admin/campionati.component').then((m) => m.CampionatiComponent) },
          { path: 'designazioni', title: 'Designazioni arbitrali', loadComponent: () => import('./pages/admin/designazioni.component').then((m) => m.DesignazioniComponent) },
          { path: 'omologazioni', title: 'Omologazione referti', loadComponent: () => import('./pages/admin/omologazioni.component').then((m) => m.OmologazioniComponent) },
        ],
      },
      {
        path: 'dirigente',
        canActivate: [roleGuard],
        data: { ruoli: ['DIRIGENTE'] },
        children: [
          { path: 'squadre', title: 'Le mie squadre', loadComponent: () => import('./pages/dirigente/squadre.component').then((m) => m.SquadreComponent) },
          { path: 'rosa/:idSquadra', title: 'Rosa', loadComponent: () => import('./pages/dirigente/rosa.component').then((m) => m.RosaComponent) },
          { path: 'partite/:idSquadra', title: 'Partite e liste gara', loadComponent: () => import('./pages/dirigente/partite-squadra.component').then((m) => m.PartiteSquadraComponent) },
          { path: 'lista/:idPartita/:idSquadra', title: 'Lista gara', loadComponent: () => import('./pages/dirigente/lista-gara.component').then((m) => m.ListaGaraComponent) },
        ],
      },
      {
        path: 'arbitro',
        canActivate: [roleGuard],
        data: { ruoli: ['ARBITRO'] },
        children: [
          { path: 'designazioni', title: 'Le mie designazioni', loadComponent: () => import('./pages/arbitro/mie-designazioni.component').then((m) => m.MieDesignazioniComponent) },
          { path: 'referto/:idPartita', title: 'Referto digitale', loadComponent: () => import('./pages/arbitro/referto-form.component').then((m) => m.RefertoFormComponent) },
        ],
      },
      {
        path: 'giocatore',
        canActivate: [roleGuard],
        data: { ruoli: ['GIOCATORE'] },
        children: [
          { path: 'area', title: 'Area personale', loadComponent: () => import('./pages/giocatore/area-giocatore.component').then((m) => m.AreaGiocatoreComponent) },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
