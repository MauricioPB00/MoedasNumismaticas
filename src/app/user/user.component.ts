import { Component, OnInit } from '@angular/core';
import { UserService } from '../AuthService/user.service';
import { take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../shared/loading.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  users: any[] = [];
  searchTerm = '';
  environment = environment;

  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private loadingService: LoadingService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getUsuario();
  }

  get filteredUsers(): any[] {
    const term = this.normalize(this.searchTerm);
    if (!term) {
      return this.users;
    }

    return this.users.filter(user =>
      this.normalize(user.name).includes(term) ||
      String(user.id).includes(term)
    );
  }

  private normalize(value: any): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  limparBusca(): void {
    this.searchTerm = '';
  }

  getUsuario() {
    this.userService.getUsers().pipe(take(1)).subscribe({
      next: (res) => {
        this.users = res;
      },
      error: (err) => {
        this.toastr.error(err, 'Erro ao carregar usuários');
      }
    });
  }

  getUserPhotoPath(photo: string): string {
    if (!photo) {
      return 'assets/img/default-user.png';
    }

    return this.environment.API_URL + '/uploads/users/' + photo;
  }

  abrirPerfil(userId: number): void {
    Promise.resolve().then(() => {
      this.router.navigate(['/perfil', userId]);
    });
  }

  irParaConfig(): void {
    this.router.navigate(['/settings']);
  }
}