import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Ruolo } from './models';

/** Consente l'accesso solo agli utenti autenticati. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticato() ? true : inject(Router).createUrlTree(['/login']);
};

/**
 * Guard RBAC: la rotta dichiara in {@code data.ruoli} i ruoli ammessi.
 * Un utente con ruolo diverso viene riportato alla propria home.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ruoli = (route.data['ruoli'] ?? []) as Ruolo[];
  if (!auth.autenticato()) return router.createUrlTree(['/login']);
  return auth.haRuolo(...ruoli) ? true : router.createUrlTree([auth.homeDelRuolo()]);
};

/** Evita di mostrare il login a chi e' gia' autenticato. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticato() ? inject(Router).createUrlTree([auth.homeDelRuolo()]) : true;
};
