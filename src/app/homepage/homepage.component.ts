import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent {

  constructor(private router: Router) {

  }
  showHeader = false;

   @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showHeader = window.scrollY > 150; // só aparece depois de rolar 150px
  }

  goToLogin() {
    console.log('a');
    this.router.navigateByUrl('/login');
  }

  goToRegister(){
    this.router.navigateByUrl('/login');
  }
}
