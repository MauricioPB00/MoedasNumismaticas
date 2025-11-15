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
  showBanner = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  preview: string | null = null;
  selectedFileBanner!: File | null;
  errorMessage = '';
  validImage = false;
  advertisingUrl: string = '';

  existingBanner = false;

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
    this.loadAdvertising();
  }

  toggleForm() {
    this.loadingService.show();
    this.showForm = !this.showForm;
    this.loadingService.hide();
  }
  toggleLogout() {
    this.showLogout = !this.showLogout;
  }

  toggleBanner() {
    this.showBanner = !this.showBanner;
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
    this.loadingService.hide();
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
    this.loadingService.hide();
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
  onSubmitLogout() {
    localStorage.removeItem('ControleUsuarioLogado');
    localStorage.removeItem('ControleUsuario');
    localStorage.removeItem('ControleUsuarioPermi');
    localStorage.removeItem('ControleUsuarioIP');
    localStorage.removeItem('jwt');
    this.router.navigate(['/']);
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    this.validateImage(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.validateImage(file);
  }

  validateImage(file: File) {
    this.errorMessage = '';
    this.validImage = false;
    this.preview = null;

    if (!file) return;

    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.errorMessage = 'Apenas JPG ou PNG.';
      return;
    }

    if (file.size > 500 * 1024) {
      this.errorMessage = 'Imagem maior que 500 KB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const w = img.width;
        const h = img.height;

        if (Math.abs(w / h - 4) > 0.1) {
          this.errorMessage = 'A imagem deve ter proporção aproximada de 4:1.';
          return;
        }

        if (w < 1000 || w > 3000) {
          this.errorMessage = 'A largura deve ser entre 1000px e 3000px.';
          return;
        }

        this.preview = e.target.result;
        this.validImage = true;
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }

  submitBanner() {
    if (!this.selectedFile || !this.validImage) return;

    this.loadingService.show();

    this.userService.uploadAdvertising(this.selectedFile, this.advertisingUrl).subscribe({
      next: (res: any) => {
        this.loadingService.hide();
        this.toastr.success('Banner salvo com sucesso!');
      },
      error: (err) => {
        this.loadingService.hide();
        this.toastr.error(err?.error?.error || 'Erro ao salvar banner.');
      }
    });
  }

  onFileSelectBanner(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.validateImage(file);
    }
  }

  loadAdvertising() {
    this.userService.getAdvertising().subscribe({
      next: (res: any) => {

        if (res?.empty) {
          return;
        }

        this.advertisingUrl = res.url;

        this.preview = `assets/img/anuncio/${res.image}`;

        this.validImage = true;
        this.existingBanner = true;
      },
      error: () => { }
    });
  }

  deleteBanner() {
    this.userService.deleteAdvertising().subscribe({
      next: () => {
        this.toastr.success('Banner removido.');

        this.preview = null;
        this.advertisingUrl = '';
        this.validImage = false;
        this.existingBanner = false;
      },
      error: () => this.toastr.error('Erro ao remover banner.')
    });
  }
}
