import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

    constructor() { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Pega o token do localStorage
        const token = localStorage.getItem('jwt');

        let authReq = req;
        if (token) {
            authReq = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(authReq).pipe(
            catchError((err: HttpErrorResponse) => {
                if (err.status === 401 && err.error?.message === 'Expired JWT Token') {
                    // Aqui você pode chamar o endpoint de refresh token
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        return from(this.refreshToken(refreshToken)).pipe(
                            switchMap((newToken: string) => {
                                localStorage.setItem('jwt', newToken);
                                const clonedReq = req.clone({
                                    setHeaders: { Authorization: `Bearer ${newToken}` }
                                });
                                return next.handle(clonedReq);
                            })
                        );
                    }
                }
                return throwError(() => err);
            })
        );
    }

    private async refreshToken(refreshToken: string): Promise<string> {
        // Exemplo usando fetch, você pode usar HttpClient também
        const response = await fetch(`${API_CONFIG.baseUrl}/token/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
            localStorage.clear(); // força logout
            window.location.href = '/login'; // redireciona
            throw new Error('Refresh expirado');
        }


        const data = await response.json();
        return data.token; // assume que o endpoint retorna { token: "novo JWT" }
    }
}
