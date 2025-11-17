import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient: HttpClient) { }

  getUser(): Observable<any> {
    const token = localStorage.getItem('jwt'); // token do localStorage

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      })
    };

    return this.httpClient.get<any>(`${API_CONFIG.baseUrl}/user`, httpOptions)
      .pipe(
        retry(0),
        catchError(this.handleError)
      );
  }

  getUserInfo(): Observable<any> {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      })
    };

    return this.httpClient.get<any>(`${API_CONFIG.baseUrl}/informacao`, httpOptions)
      .pipe(
        retry(0),
        catchError(this.handleError)
      );
  }

  uploadPhoto(file: File): Observable<any> {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };

    const formData = new FormData();
    formData.append('photo', file);

    return this.httpClient.post<any>(`${API_CONFIG.baseUrl}/photo`, formData, httpOptions)
      .pipe(
        retry(0),
        catchError(this.handleError)
      );
  }

  updateUser(user: any): Observable<any> {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      })
    };

    return this.httpClient.put<any>(`${API_CONFIG.baseUrl}/update`, JSON.stringify(user), httpOptions)
      .pipe(
        retry(0),
        catchError(this.handleError)
      );
  }

  getUserPhoto(): Observable<any> {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };

    return this.httpClient.get<any>(`${API_CONFIG.baseUrl}/informacao`, httpOptions)
      .pipe(
        retry(0),
        catchError(this.handleError)
      );
  }

  uploadAdvertising(file: File, url: string): Observable<any> {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };

    const formData = new FormData();
    formData.append('image', file);
    formData.append('url', url);

    return this.httpClient.post<any>(`${API_CONFIG.baseUrl}/advertising`, formData, httpOptions);
  }

  getAdvertising() {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };

    return this.httpClient.get<any>(`${API_CONFIG.baseUrl}/advertising/buscar`, httpOptions)
      .pipe(
        retry(0),
        catchError(this.handleError)
      );
  }

  getPendingBanners() {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };

    return this.httpClient.get<any[]>(
      `${API_CONFIG.baseUrl}/advertising/pendentes`,
      httpOptions
    );
  }

  approveBanner(id: number) {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${token}`
      })
    };

    return this.httpClient.post(
      `${API_CONFIG.baseUrl}/advertising/aprovar/${id}`,
      {},
      httpOptions
    );
  }

  deleteAdvertising(): Observable<any> {
    const token = localStorage.getItem('jwt');

    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };

    return this.httpClient.post<any>(
      `${API_CONFIG.baseUrl}/advertising/delete`, {}, httpOptions);
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
