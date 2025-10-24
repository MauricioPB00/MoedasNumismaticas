import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PasswordResetService } from '../AuthService/password-reset.service';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { LoadingService } from '../shared/loading.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']

})
export class PasswordResetComponent {
 email: string = '';

  constructor(
    private passwordResetService:  PasswordResetService,
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private loadingService: LoadingService,
  ) {}

  sendResetEmail() {
    this.loadingService.show();
    this.passwordResetService.forgotPassword(this.email).pipe(take(1)).subscribe(
          data => {
            this.toastr.success('Email enviado ! confira sua caixa de entrada');
            this.loadingService.hide();
          },
          error => {
            const msg = error?.error?.message || 'Erro ao tentar encontrar o Email. Verifique os dados.';
            this.toastr.error(msg);
            this.loadingService.hide();
          }
        )
      } 

   goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
