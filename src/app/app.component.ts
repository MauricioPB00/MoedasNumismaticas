import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingService } from './shared/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLoginRoute = false;

  constructor(
    private router: Router,
    public loadingService: LoadingService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.isLoginRoute = this.checkRoute(this.router.url);
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const nextIsLogin = this.checkRoute(event.urlAfterRedirects ?? event.url);
        if (nextIsLogin !== this.isLoginRoute) {
          this.isLoginRoute = nextIsLogin;
          this.cdRef.detectChanges();
        }
      });
  }

  private checkRoute(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0];

    const publicRoutes = [
      '/',
      '/login',
      '/password-reset',
      '/reset-password',
      '/catalogo',
      '/anuncios'
    ];

    return (
      publicRoutes.includes(cleanUrl) ||
      cleanUrl.startsWith('/reset-password')
    );
  }


}
