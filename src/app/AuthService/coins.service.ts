import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { retry, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CoinsService {

  constructor(private httpClient: HttpClient) { }

  getCoin(id: number): Observable<any> {
    return this.httpClient.get<any>(`${API_CONFIG.baseUrl}/coins/${id}`);
  }

  addCoin(payload: any): Observable<any> {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };

    return this.httpClient.post<any>(`${API_CONFIG.baseUrl}/album/add`, payload, httpOptions)
      .pipe(
        retry(0),
        catchError(this.handleError)
      );
  }

  getAlbumByUser(): Observable<any> {
    const token = localStorage.getItem('jwt');
    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };
    return this.httpClient.get<any>(`${API_CONFIG.baseUrl}/album/me`, httpOptions);
  }

  getAlbumByUserMap(): Observable<any> {
    const token = localStorage.getItem('jwt');
    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };
    return this.httpClient.get<any>(`${API_CONFIG.baseUrl}/album/me/map`, httpOptions);
  }

  getCoinAlbumById(id: number): Observable<any> {
    const token = localStorage.getItem('jwt');
    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };
    return this.httpClient.get<any>(`${API_CONFIG.baseUrl}/album/me/${id}`, httpOptions);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Código do erro: ${error.status}, mensagem: ${error.message}`;
    }
    return throwError(() => errorMessage);
  };

  removeCoin(payload: any): Observable<any> {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };

    return this.httpClient.post<any>(`${API_CONFIG.baseUrl}/album/remove`, payload, httpOptions)
      .pipe(
        retry(0),
        catchError(this.handleError)
      );
  }

}
