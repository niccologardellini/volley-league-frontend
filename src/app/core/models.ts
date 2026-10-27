/** Tipi condivisi che rispecchiano i DTO esposti dal backend Spring Boot. */

export type Ruolo = 'ADMIN' | 'DIRIGENTE' | 'ARBITRO' | 'GIOCATORE';
export type RuoloCampo = 'PALLEGGIATORE' | 'OPPOSTO' | 'SCHIACCIATORE' | 'CENTRALE' | 'LIBERO';
export type StatoPartita = 'PROGRAMMATA' | 'ROSTER_INVIATI' | 'IN_CORSO' | 'REFERTATA' | 'OMOLOGATA';
export type StatoCampionato = 'ISCRIZIONI_APERTE' | 'IN_CORSO' | 'CONCLUSO';
export type Sanzione = 'NESSUNA' | 'GIALLO' | 'ROSSO' | 'ROSSO_GIALLO';
export type CriterioOrdinamento = 'FIPAV' | 'VITTORIE' | 'QUOZIENTE_SET';

export interface Utente {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruolo: Ruolo;
  idSocieta: number | null;
  nomeSocieta: string | null;
  provincia: string | null;
}

export interface LoginResponse {
  token: string;
  utente: Utente;
}

export interface Campionato {
  id: number;
  nome: string;
  categoria: string;
  stagione: string;
  girone: string;
  stato: StatoCampionato;
  numeroSquadre: number;
  numeroPartite: number;
}

export interface Squadra {
  id: number;
  nome: string;
  idSocieta: number;
  nomeSocieta: string;
  citta: string;
  provincia: string;
  idCampionato: number | null;
  nomeCampionato: string | null;
  numeroTesserati: number;
}

export interface SquadraRef {
  id: number;
  nome: string;
  societa: string;
}

export interface Tesserato {
  id: number;
  nome: string;
  cognome: string;
  ruoloCampo: RuoloCampo;
  numeroMaglia: number;
  idSquadra: number;
  emailAccount: string | null;
}

export interface TesseratoRequest {
  nome: string;
  cognome: string;
  ruoloCampo: RuoloCampo;
  numeroMaglia: number;
  emailAccount: string | null;
}

export interface Partita {
  id: number;
  idCampionato: number;
  campionato: string;
  giornata: number;
  dataOra: string;
  stato: StatoPartita;
  casa: SquadraRef;
  ospite: SquadraRef;
  idArbitro: number | null;
  arbitro: string | null;
  setCasa: number | null;
  setOspite: number | null;
  parziali: string[];
  firmaArbitroAt: string | null;
  noteGiudice: string | null;
}

export interface ArbitroCompatibile {
  id: number;
  nome: string;
  societa: string | null;
  provincia: string | null;
  compatibile: boolean;
  motivi: string[];
}

export interface ListaGara {
  id: number;
  idPartita: number;
  idSquadra: number;
  squadra: string;
  atleti: Tesserato[];
  allenatore: string;
  viceAllenatore: string | null;
  dirigenteAccompagnatore: string | null;
  inviataAt: string;
}

export interface ListaGaraRequest {
  atleti: number[];
  allenatore: string;
  viceAllenatore: string | null;
  dirigenteAccompagnatore: string | null;
}

export interface ParzialeSet {
  numeroSet: number;
  puntiCasa: number;
  puntiOspite: number;
  cambiCasa: number;
  cambiOspite: number;
}

export interface PrestazioneAtleta {
  idTesserato: number;
  puntiFatti: number;
  ace: number;
  muri: number;
  errori: number;
  cartellino: Sanzione;
}

export interface Statistica extends PrestazioneAtleta {
  atleta: string;
  numeroMaglia: number;
  idSquadra: number;
}

export interface RefertoRequest {
  set: ParzialeSet[];
  statistiche: PrestazioneAtleta[];
  note: string | null;
  passwordFirma: string;
}

export interface Referto {
  partita: Partita;
  set: ParzialeSet[];
  statistiche: Statistica[];
  liste: ListaGara[];
  note: string | null;
  hashReferto: string | null;
}

export interface RigaClassifica {
  posizione: number;
  idSquadra: number;
  squadra: string;
  societa: string;
  punti: number;
  giocate: number;
  vinte: number;
  perse: number;
  setVinti: number;
  setPersi: number;
  puntiFatti: number;
  puntiSubiti: number;
  quozienteSet: number | null;
  quozientePunti: number | null;
  risultati: number[];
}

export interface Presenza {
  idPartita: number;
  dataOra: string;
  avversario: string;
  inCasa: boolean;
  stato: StatoPartita;
  risultato: string | null;
  puntiFatti: number | null;
  ace: number | null;
  muri: number | null;
  errori: number | null;
  cartellino: Sanzione | null;
}

export interface AreaGiocatore {
  atleta: Tesserato;
  squadra: SquadraRef;
  campionato: string | null;
  totali: {
    convocazioni: number;
    presenze: number;
    punti: number;
    ace: number;
    muri: number;
    errori: number;
    mediaPunti: number;
  };
  storico: Presenza[];
  calendario: Partita[];
}

export interface ErroreApi {
  status: number;
  messaggio: string;
  errori: string[];
}

/** Etichette leggibili per enum e stati, usate in tutta l'interfaccia. */
export const ETICHETTE_STATO: Record<StatoPartita, string> = {
  PROGRAMMATA: 'Programmata',
  ROSTER_INVIATI: 'Liste inviate',
  IN_CORSO: 'In corso',
  REFERTATA: 'Refertata',
  OMOLOGATA: 'Omologata',
};

export const ETICHETTE_RUOLO: Record<Ruolo, string> = {
  ADMIN: 'Giudice sportivo',
  DIRIGENTE: 'Dirigente',
  ARBITRO: 'Arbitro',
  GIOCATORE: 'Giocatore',
};

export const RUOLI_CAMPO: RuoloCampo[] = ['PALLEGGIATORE', 'OPPOSTO', 'SCHIACCIATORE', 'CENTRALE', 'LIBERO'];

export const ETICHETTE_SANZIONE: Record<Sanzione, string> = {
  NESSUNA: 'Nessuna',
  GIALLO: 'Giallo (ammonizione)',
  ROSSO: 'Rosso (penalizzazione)',
  ROSSO_GIALLO: 'Rosso + giallo (espulsione)',
};
