import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';

import { API_CONFIG } from '../config/api.config';

import {
  Observable,
  throwError
} from 'rxjs';

import {
  catchError
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  constructor(
    private httpClient: HttpClient
  ) { }

  getPerfil(id: number): Observable<any> {
    const token = localStorage.getItem('jwt');
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
    return this.httpClient
      .get<any>(
        `${API_CONFIG.baseUrl}/perfil/${id}`,
        httpOptions
      )
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage =
        `Código do erro: ${error.status}, mensagem: ${error.message}`;
    }
    return throwError(() => errorMessage);
  }
}