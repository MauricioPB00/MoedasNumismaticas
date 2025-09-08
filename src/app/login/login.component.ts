import { Component, OnInit, ViewChild , HostListener} from '@angular/core';
import { Router } from '@angular/router';

import { Login } from '../models/login';
import { LoginService } from '../AuthService/login.service';
import { take } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {


   isSignUpMode = false;

  signInData = {
    username: '',
    password: ''
  };

  signUpData = {
    username: '',
    email: '',
    password: ''
  };

  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
  }

  onSignIn() {
    console.log('Sign In Data:', this.signInData);
    // aqui você pode chamar seu serviço de autenticação
  }

  onSignUp() {
    console.log('Sign Up Data:', this.signUpData);
    // aqui você pode chamar seu serviço de registro
  }

  constructor(
    private loginService: LoginService,
    private router: Router,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) { }

  dados: Login = { username: "", password: "" };
  showHeader = false;

   
  ngOnInit(): void {
    this.dados.username = "";
    this.dados.password = "";
  }

  isLoginValid() {
    return (
      //this.loginData.username.includes('@') &&
      this.dados.username.length >= 8 &&
      this.dados.password.length >= 6
    );
  }

  getButtonBackgroundColor() {
    return this.isLoginValid() ? '#EFBF04' : '#464646';
  }
  logar() {
    console.log('adas');
     console.log('this.dados.username, this.dados.password', this.dados.username, this.dados.password);
    // this.spinner.show();
    if (this.isLoginValid()) {
      console.log('this.dados.username, this.dados.password', this.dados.username, this.dados.password);
      this.loginService.login(this.dados.username, this.dados.password).pipe(take(1)).subscribe(
        data => {
          this.toastr.success('Logado com sucesso') 
          this.router.navigateByUrl('/home');
          this.spinner.hide();
        },
        error => {
          this.showAlert(error.error);
          this.spinner.hide();
        })
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
    this.showHeader = window.scrollY > 150; // só aparece depois de rolar 150px
  }
}




