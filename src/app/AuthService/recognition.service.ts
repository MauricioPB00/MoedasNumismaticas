import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { retry, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CoinRecognitionService {

    constructor(private httpClient: HttpClient) { }

    identifyCoin(imageBase64: string): Observable<any> {

        const token = localStorage.getItem('jwt');

        const httpOptions = {
            headers: new HttpHeaders({
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            })
        };

        const payload = {
            image: imageBase64
        };

        return this.httpClient.post<any>(
            `${API_CONFIG.baseUrl}/recognize/coin`,
            payload,
            httpOptions
        )
            .pipe(
                retry(0),
                catchError(this.handleError)
            );
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Erro: ${error.error.message}`;
        } else {
            errorMessage = `Código do erro: ${error.status}, mensagem: ${error.message}`;
        }

        return throwError(() => new Error(errorMessage));
    }
}
