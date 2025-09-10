import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParamsOptions } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, tap, retry, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})

export class PasswordResetService {

  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private httpClient: HttpClient,
    private toastr: ToastrService
  ) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('ControleUsuarioLogado') || '{}'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
  }

 forgotPassword(email: string): Observable<any> {
  return this.httpClient.post(
    `${API_CONFIG.baseUrl}/forgot-password`,
    { email: email },
    { headers: { 'Content-Type': 'application/json' } } // importante
  );
}



  handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Erro client
      errorMessage = error.error.message;
    } else {
      // Erro servidor
      errorMessage = `Código do erro: ${error.status}, ` + `menssagem: ${error.message}`;
    }
    return throwError(errorMessage);
  };
}
