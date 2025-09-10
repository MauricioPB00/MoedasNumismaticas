import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParamsOptions } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, tap, retry, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})

export class LoginService {

  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient,
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

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${API_CONFIG.baseUrl}/login`, { username, password }, this.httpOptions)
      .pipe(
        map((data: any) => {
          if (data && data.token) {
            console.log(data);
            var userData = {
              permi: data.permi,
              id: data.id,
              username: data.username,
              name: data.nome
            }
            localStorage.setItem('jwt', JSON.stringify(data.token));
            localStorage.setItem('ControleUsuarioPermi', JSON.stringify(data.permi));
            localStorage.setItem('ControleUsuario', JSON.stringify(userData));
            localStorage.setItem('ControleUsuarioIP', JSON.stringify(data.ip));
          }
          return data;
        }),
        tap(() => {
          if (this.isLoggedIn()) {
            console.log('Usuário autenticado.');
          } else {
            console.log('Falha ao autenticar o usuário.');
          }
        })
      );
  }
  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwt');
  }
  logout() {
    localStorage.removeItem('ControleUsuarioLogado');
    localStorage.removeItem('jwt');
    this.currentUserSubject.next(null);
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
