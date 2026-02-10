import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InsigniaService {

  constructor(private httpClient: HttpClient) { }

  getInsignias() {
    const token = localStorage.getItem('jwt');
    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };
    return this.httpClient.get<any[]>(
      `${API_CONFIG.baseUrl}/achievement/list`,
      httpOptions
    );
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
}
