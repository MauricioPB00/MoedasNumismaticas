import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingService } from './shared/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLoginRoute: boolean = false;

  constructor(
    private router: Router,
    public loadingService: LoadingService,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        // Aqui o TypeScript sabe que event é NavigationEnd
        this.isLoginRoute = 
        event.url === '/' || 
        event.url === '/login' || 
        event.url === '/password-reset' || 
        event.url === '/reset-password' ||
        event.url.startsWith('/reset-password');
      });
  }
}
