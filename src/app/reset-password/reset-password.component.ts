import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PasswordResetService } from '../AuthService/password-reset.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  token: string = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // pega token da URL
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    // cria o formulário
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  // valida se as senhas coincidem
  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.toastr.warning('Preencha todos os campos corretamente');
      return;
    }

    this.spinner.show();
    const { password } = this.resetForm.value;

    this.passwordResetService.resetPassword(this.token, password).pipe(take(1)).subscribe({
      next: () => {
        this.toastr.success('Senha redefinida com sucesso!');
        this.spinner.hide();
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        const msg = err?.error?.error || 'Erro ao redefinir senha';
        this.toastr.error(msg);
        this.spinner.hide();
      }
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}