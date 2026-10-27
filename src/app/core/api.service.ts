import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AreaGiocatore, ArbitroCompatibile, Campionato, CriterioOrdinamento, ListaGara, ListaGaraRequest,
  Partita, Referto, RefertoRequest, RigaClassifica, Squadra, StatoPartita, Tesserato, TesseratoRequest,
} from './models';

/** Client delle API REST del backend (una funzione per endpoint). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // --- Campionati ---
  campionati(): Observable<Campionato[]> {
    return this.http.get<Campionato[]>('/api/campionati');
  }

  creaCampionato(body: { nome: string; categoria: string; stagione: string; girone: string }): Observable<Campionato> {
    return this.http.post<Campionato>('/api/campionati', body);
  }

  squadreCampionato(id: number): Observable<Squadra[]> {
    return this.http.get<Squadra[]>(`/api/campionati/${id}/squadre`);
  }

  iscrivi(idCampionato: number, idSquadra: number): Observable<Squadra> {
    return this.http.post<Squadra>(`/api/campionati/${idCampionato}/iscrizioni`, { idSquadra });
  }

  generaCalendario(id: number, body: { dataInizio: string; ora: string; giorniTraGiornate: number; andataRitorno: boolean }): Observable<Partita[]> {
    return this.http.post<Partita[]>(`/api/campionati/${id}/calendario`, body);
  }

  calendario(id: number): Observable<Partita[]> {
    return this.http.get<Partita[]>(`/api/campionati/${id}/partite`);
  }

  classifica(id: number, criterio: CriterioOrdinamento): Observable<RigaClassifica[]> {
    return this.http.get<RigaClassifica[]>(`/api/campionati/${id}/classifica`, { params: { criterio } });
  }

  // --- Squadre e tesserati ---
  mieSquadre(): Observable<Squadra[]> {
    return this.http.get<Squadra[]>('/api/squadre/mie');
  }

  creaSquadra(nome: string): Observable<Squadra> {
    return this.http.post<Squadra>('/api/squadre', { nome });
  }

  rosa(idSquadra: number): Observable<Tesserato[]> {
    return this.http.get<Tesserato[]>(`/api/squadre/${idSquadra}/tesserati`);
  }

  tessera(idSquadra: number, body: TesseratoRequest): Observable<Tesserato> {
    return this.http.post<Tesserato>(`/api/squadre/${idSquadra}/tesserati`, body);
  }

  aggiornaTesserato(id: number, body: TesseratoRequest): Observable<Tesserato> {
    return this.http.put<Tesserato>(`/api/squadre/tesserati/${id}`, body);
  }

  svincola(id: number): Observable<void> {
    return this.http.delete<void>(`/api/squadre/tesserati/${id}`);
  }

  partiteSquadra(idSquadra: number): Observable<Partita[]> {
    return this.http.get<Partita[]>(`/api/squadre/${idSquadra}/partite`);
  }

  // --- Partite ---
  partite(stati: StatoPartita[]): Observable<Partita[]> {
    let params = new HttpParams();
    stati.forEach((s) => (params = params.append('stato', s)));
    return this.http.get<Partita[]>('/api/partite', { params });
  }

  partita(id: number): Observable<Partita> {
    return this.http.get<Partita>(`/api/partite/${id}`);
  }

  arbitriPerPartita(id: number): Observable<ArbitroCompatibile[]> {
    return this.http.get<ArbitroCompatibile[]>(`/api/partite/${id}/arbitri`);
  }

  designa(id: number, idArbitro: number): Observable<Partita> {
    return this.http.put<Partita>(`/api/partite/${id}/arbitro`, { idArbitro });
  }

  listaGara(idPartita: number, idSquadra: number): Observable<ListaGara | null> {
    return this.http.get<ListaGara | null>(`/api/partite/${idPartita}/liste/${idSquadra}`);
  }

  inviaListaGara(idPartita: number, idSquadra: number, body: ListaGaraRequest): Observable<ListaGara> {
    return this.http.put<ListaGara>(`/api/partite/${idPartita}/liste/${idSquadra}`, body);
  }

  mieDesignazioni(): Observable<Partita[]> {
    return this.http.get<Partita[]>('/api/partite/designazioni/mie');
  }

  avviaGara(id: number): Observable<Partita> {
    return this.http.post<Partita>(`/api/partite/${id}/avvio`, {});
  }

  referto(id: number): Observable<Referto> {
    return this.http.get<Referto>(`/api/partite/${id}/referto`);
  }

  inviaReferto(id: number, body: RefertoRequest): Observable<Referto> {
    return this.http.post<Referto>(`/api/partite/${id}/referto`, body);
  }

  omologa(id: number): Observable<Partita> {
    return this.http.post<Partita>(`/api/partite/${id}/omologa`, {});
  }

  respingi(id: number, motivazione: string): Observable<Partita> {
    return this.http.post<Partita>(`/api/partite/${id}/respingi`, { motivazione });
  }

  // --- Giocatore ---
  areaGiocatore(): Observable<AreaGiocatore> {
    return this.http.get<AreaGiocatore>('/api/giocatore/area');
  }
}
