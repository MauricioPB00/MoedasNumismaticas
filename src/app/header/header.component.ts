import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  constructor(private router: Router) { }

  goToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  goToLogin() {
    this.router.navigateByUrl('/login');
  }

  goToAnuncios() {
    this.router.navigateByUrl('/anuncios');
  }
}
