import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../AuthService/user.service';
import { take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: any = {};
  showForm = false;
  showPhoto = false
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit() {
    const controleUsuario = localStorage.getItem('ControleUsuario');
    if (controleUsuario) {
      this.user = JSON.parse(controleUsuario);
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  togglePhoto() {
    this.showPhoto = !this.showPhoto;

    if (this.showPhoto) {
      this.previewUrl = null;

      this.userService.getUserInfo().subscribe({
        next: (res: any) => {
          this.user = res; // traz name, email e photo
        },
        error: (err) => {
          console.error('Erro ao carregar informações do usuário', err);
        }
      });
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result; // preview da foto escolhida
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit() {
    if (!this.user) {
      this.toastr.error('Erro, usuário não encontrado.');
      return;
    }
    this.userService.updateUser(this.user).subscribe({
      next: (res) => {
        if (res.token) {
          localStorage.setItem('jwt', res.token);
        }
        this.toastr.success('Dados atualizados com sucesso!');
        this.showForm = false;
      },
      error: (err) => {
        console.error('Erro ao atualizar usuário:', err);
        this.toastr.error('Preencha todos os campos corretamente.');
      }
    });
  }

  onSubmitPhoto() {
    if (!this.selectedFile) return;

    this.userService.uploadPhoto(this.selectedFile).subscribe({
      next: (res: any) => {
        this.user.photo = res.photo; // retorna o nome salvo
        this.previewUrl = null;      // exibir a foto do banco
        this.selectedFile = null;
        this.toastr.success('Foto atualizada com sucesso!');
      },
      error: (err) => {
        console.error('Erro ao salvar foto:', err);
        this.toastr.error('Erro ao salvar foto.');
      }
    });
  }


}
