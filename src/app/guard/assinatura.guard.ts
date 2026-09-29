import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PlanoService } from '../AuthService/planos.service';

@Injectable({
    providedIn: 'root'
})
export class AssinaturaGuard implements CanActivate {

    constructor(
        private planoService: PlanoService,
        private router: Router
    ) { }

    canActivate(): Observable<boolean | UrlTree> {

        return this.planoService.statusAssinatura().pipe(

            map((data) => {

                // console.log(
                //     'ASSINATURA GUARD:',
                //     data
                // );

                if (data.acesso === true) {
                    return true;
                }

                return this.router.createUrlTree(['/planos']);
            }),

            catchError((error) => {

                console.error(
                    'ERRO AO VERIFICAR ASSINATURA:',
                    error
                );

                if (error.status === 401) {
                    return of(
                        this.router.createUrlTree(['/login'])
                    );
                }

                return of(
                    this.router.createUrlTree(['/planos'])
                );
            })
        );
    }
}