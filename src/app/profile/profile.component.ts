import { Component, OnInit } from '@angular/core';
import { UserService } from '../AuthService/user.service';
import { take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../shared/loading.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  users: any[] = [];
  environment = environment;
  showBannerModal = false;
  banners: any[] = [];

  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private loadingService: LoadingService,
  ) { }

  ngOnInit(): void {
    this.getUsuario();
  }

  getUsuario() {
    this.loadingService.show();

    this.userService.getUser().pipe(take(1)).subscribe({
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

  openBannerModal() {
    this.showBannerModal = true;
    this.loadPendingBanners();
  }

  closeBannerModal() {
    this.showBannerModal = false;
  }

  loadPendingBanners() {
    this.loadingService.show();

    this.userService.getPendingBanners().pipe(take(1)).subscribe({
      next: (res) => {
        this.banners = res;
        this.loadingService.hide();
      },
      error: () => {
        this.toastr.error("Erro ao carregar banners");
        this.loadingService.hide();
      }
    });
  }

  approveBanner(id: number) {
    this.userService.approveBanner(id).pipe(take(1)).subscribe({
      next: () => {
        this.toastr.success("Banner aprovado!");

        this.banners = this.banners.filter(b => b.id !== id);
      },
      error: () => {
        this.toastr.error("Erro ao aprovar banner");
      }
    });
  }

  getBannerUrl(fileName?: string | null): string {
    if (!fileName) return '/assets/img/anuncio/default-banner.png'; 
    return `/assets/img/anuncio/${fileName}`;
  }

  onBannerError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/assets/img/anuncio/default-banner.png';
  }

}
