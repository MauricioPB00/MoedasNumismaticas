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

  ngOnInit() {
    this.onSubmitLogout()
    window.addEventListener("scroll", this.handleScroll);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showHeader = window.scrollY > 150; // só aparece depois de rolar 150px
  }

  goToLogin() {
    console.log('a');
    this.router.navigateByUrl('/login');
  }

  goToRegister() {
    this.router.navigateByUrl('/login');
  }

  handleScroll = () => {
    const elements = document.querySelectorAll(".reveal, .reveal-card");

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const visible = rect.top < window.innerHeight - 80;

      if (visible) el.classList.add("visible");
    });
  }
  onSubmitLogout() {
    localStorage.removeItem('ControleUsuarioLogado');
    localStorage.removeItem('ControleUsuario');
    localStorage.removeItem('ControleUsuarioPermi');
    localStorage.removeItem('ControleUsuarioIP');
    localStorage.removeItem('jwt');
  }
}
