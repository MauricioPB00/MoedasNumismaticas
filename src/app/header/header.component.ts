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
    console.log('a');
    this.router.navigateByUrl('/login');
  }
}
