import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';

import { Login } from '../models/login';
import { LoginService } from '../AuthService/login.service';
import { RegisterService } from '../AuthService/register.service';
import { take } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr';

import { LoadingService } from '../shared/loading.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  constructor(
    private registerService: RegisterService,
    private loginService: LoginService,
    private router: Router,
    private toastr: ToastrService,
    private loading: LoadingService,
  ) { }

  signUpData = {
    name: '',
    email: '',
    password: '',
    number: '',
  };

  dados: Login = { email: "", password: "" };
  showHeader = false;
  isSignUpMode = false;
  showLoginPassword = false;
  showSignupPassword = false;

  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
  }

  ngOnInit(): void {
    this.dados.email = "";
    this.dados.password = "";
    document.body.classList.remove('dark-mode');
  }

  isLoginValid() {
    return (
      //this.loginData.email.includes('@') &&
      this.dados.email.length >= 8 &&
      this.dados.password.length >= 6
    );
  }

  getButtonBackgroundColor() {
    return this.isLoginValid() ? '#EFBF04' : '#464646';
  }

  logar() {
    this.loading.show();
    if (this.isLoginValid()) {
      this.loginService.login(this.dados.email, this.dados.password).pipe(take(1)).subscribe(
        data => {
          this.toastr.success('Logado com sucesso')
          this.router.navigateByUrl('/home');
          this.loading.hide();
        },
        error => {
          const msg =
            error?.error?.message ||
            'Email ou senha incorreto';

          this.toastr.error(msg);
          this.loading.hide();
        })
    } else {
      this.toastr.error('Preencha todos os campos corretamente antes de se cadastrar.');
      this.loading.hide();
    }
  }

  goToRegister() {
    this.isSignUpMode = true;
  }

  goToLogin() {
    this.isSignUpMode = false;
  }
  goToPasswordReset() {
    this.router.navigateByUrl('/password-reset');
  }

  isSingUpValid() {
    return (
      this.signUpData.email.includes('@') &&
      this.signUpData.email.length >= 10 &&
      this.signUpData.name.length >= 3 &&
      this.signUpData.password.length >= 6 &&
      this.signUpData.number.length >= 6
    );
  }

  onSignUp() {
    this.loading.show();
    if (this.isSingUpValid()) {
      this.registerService.postRegister(this.signUpData).pipe(take(1)).subscribe(
        data => {
          this.toastr.success('Cadastrado com sucesso');
          this.isSignUpMode = false;
          this.loading.hide();
        },
        error => {
          const msg = error?.error?.message || 'Erro ao tentar cadastrar. Verifique os dados.';
          this.toastr.error(msg);
          this.loading.hide();
        }
      )
    } else {
      this.toastr.error('Preencha todos os campos corretamente antes de se cadastrar.');
      this.loading.hide();
    }
  }

  showAlert(data: any) {
    if (data != undefined) {
      this.toastr.error(JSON.stringify(data));
      if (data.erro == true) {
        this.toastr.error(data.mensagem);
      } else if (data.erro == false) {
        this.toastr.success(data.mensagem);
      } else {
      }
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showHeader = window.scrollY > 150;
  }
}




