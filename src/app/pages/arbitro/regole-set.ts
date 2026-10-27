import { ParzialeSet } from '../../core/models';

/**
 * Regole del punteggio di un set, identiche a quelle del RefertoValidator del backend.
 * Servono a dare feedback immediato all'arbitro; la validazione vincolante resta lato server.
 */
export const PUNTI_SET = 25;
export const PUNTI_TIE_BREAK = 15;
export const MAX_CAMBI = 6;

export function erroreSet(s: ParzialeSet): string | null {
  const soglia = s.numeroSet === 5 ? PUNTI_TIE_BREAK : PUNTI_SET;
  const v = Math.max(s.puntiCasa, s.puntiOspite);
  const p = Math.min(s.puntiCasa, s.puntiOspite);
  if (s.cambiCasa > MAX_CAMBI || s.cambiOspite > MAX_CAMBI) return `Massimo ${MAX_CAMBI} sostituzioni per squadra`;
  if (v === p) return 'Un set non può terminare in parità';
  if (v < soglia) return `Il set termina a ${soglia} punti`;
  if (v - p < 2) return 'Servono almeno 2 punti di scarto';
  if (v > soglia && v - p !== 2) return `Oltre i ${soglia} punti lo scarto deve essere esattamente 2`;
  return null;
}

/** Set vinti da ciascuna squadra e indicazione se la partita e' conclusa. */
export function esito(set: ParzialeSet[]): { casa: number; ospite: number; conclusa: boolean; errore: string | null } {
  let casa = 0;
  let ospite = 0;
  for (const s of set) {
    if (casa === 3 || ospite === 3) return { casa, ospite, conclusa: true, errore: `Set ${s.numeroSet}: la partita era già conclusa` };
    if (erroreSet(s)) continue;
    if (s.puntiCasa > s.puntiOspite) casa++; else ospite++;
  }
  const conclusa = casa === 3 || ospite === 3;
  return { casa, ospite, conclusa, errore: conclusa ? null : 'Nessuna squadra ha ancora vinto 3 set' };
}
