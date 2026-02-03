import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../AuthService/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements OnInit {
  showHeader = false;
  banners: any[] = [];
  environment = environment;

  constructor(
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadBanners();
  }

  loadBanners() {
    this.userService.getApprovedBanners().subscribe(res => {
      this.banners = res;
    });
  }

  openBanner(url: string) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showHeader = window.scrollY > 150;
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }

  getBannerPath(img: string) {
    if (!img) {
      return 'assets/img/anuncio/default-banner.png';
    }
    return this.environment.API_URL + '/uploads/advertising/' + img;
  }

}
