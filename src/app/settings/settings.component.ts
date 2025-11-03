import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../AuthService/user.service';
import { take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../shared/loading.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: any = {};
  showForm = false;
  showPhoto = false
  showLogout = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private toastr: ToastrService,
    private loadingService: LoadingService,
    private router: Router,
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
  toggleLogout() {
    this.showLogout = !this.showLogout;
  }

  togglePhoto() {
    this.loadingService.show();
    this.showPhoto = !this.showPhoto;

    if (this.showPhoto) {
      this.previewUrl = null;

      this.userService.getUserInfo().subscribe({
        next: (res: any) => {
          this.user = res;
          this.loadingService.hide();
        },
        error: (err) => {
          console.error('Erro ao carregar informações do usuário', err);
          this.loadingService.hide();
        }
      });
    }
  }

  onFileSelected(event: any) {
    this.loadingService.show();
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
    this.loadingService.hide();
  }

  onSubmit() {
    this.loadingService.show();
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
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Erro ao atualizar usuário:', err);
        this.toastr.error('Preencha todos os campos corretamente.');
        this.loadingService.hide();
      }
    });
  }

  onSubmitPhoto() {
    this.loadingService.show();
    if (!this.selectedFile) return;

    this.userService.uploadPhoto(this.selectedFile).subscribe({
      next: (res: any) => {
        this.user.photo = res.photo; 
        this.previewUrl = null;      
        this.selectedFile = null;
        this.loadingService.hide();
        this.toastr.success('Foto atualizada com sucesso!');
      },
      error: (err) => {
        console.error('Erro ao salvar foto:', err);
        this.loadingService.hide();
        this.toastr.error('Erro ao salvar foto.');
      }
    });
  }
  onSubmitLogout(){
    localStorage.removeItem('ControleUsuarioLogado');
    localStorage.removeItem('ControleUsuario');
    localStorage.removeItem('ControleUsuarioPermi');
    localStorage.removeItem('ControleUsuarioIP');
    localStorage.removeItem('jwt');
    this.router.navigate(['/']);
  }
}
