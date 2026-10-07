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
export class UserComponent {
  users: any[] = [];
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

  getUsuario() {
    this.loadingService.show();
    this.userService.getUsers().pipe(take(1)).subscribe({
      next: (res) => {
        this.users = res;
        this.loadingService.hide();
      },
      error: (err) => {
        this.toastr.error(err, 'Erro ao carregar usuários');
        this.loadingService.hide();
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
    this.router.navigate(['/perfil', userId]);
  }
}
