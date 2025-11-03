import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { SIDEBAR_COLOR } from '../../../color';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../AuthService/user.service';
import { LoginService } from '../AuthService/login.service';


@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
  host: {
    '[style.--sidebar-bt-color]': 'sidebarBtColor',
    '[style.--sidebar-bt-color-hover]': 'sidebarBtColorHover',
    '[style.--sidebar-color]': 'sidebarColor',
    '[style,--sidebar-txt-color]': 'sidebarTxtColor'
  }
})

export class SideBarComponent implements OnInit, AfterViewInit {

  sidebarBtColor: string = SIDEBAR_COLOR.SIDEBAR_BT_COLOR;
  sidebarColor: string = SIDEBAR_COLOR.SIDEBAR_COLOR;
  sidebarLnColor: string = SIDEBAR_COLOR.SIDEBAR_LN_COLOR;
  sidebarBtColorHover: string = SIDEBAR_COLOR.SIDEBAR_BT_COLOR_HOVER;
  sidebarTxtColor: string = SIDEBAR_COLOR.SIDEBAR_TXT_COLOR;
  sidebarIconColor: string = SIDEBAR_COLOR.SIDEBAR_ICON_COLOR;
  // isSidebarActive: boolean = false;
  // isSidebarMinimizedActive: boolean = false;
  // name: string | undefined;
  isDarkMode: boolean = false;
  // photo: string | null = null;
  permi: number | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private userService: UserService,
    public loginService: LoginService,
  ) {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      this.isDarkMode = JSON.parse(savedMode);
      const storedPermi = localStorage.getItem('ControleUsuarioPermi');
      this.permi = storedPermi ? Number(JSON.parse(storedPermi)) : null;
    }
  }

  ngOnInit(): void {
    // const AuthUsername = localStorage.getItem('ControleUsuario');
    const darkMode = localStorage.getItem('darkMode');
    // const sideBarMinimized = localStorage.getItem('SideBarMinimized');

    // if (AuthUsername) {
    //   const userObj = JSON.parse(AuthUsername);
    //   this.name = userObj.name ? userObj.name.split('@')[0] : 'Usuário';
    // } else {
    //   this.name = 'Usuário';
    // }
    // if (sideBarMinimized !== null) {
    //   this.isSidebarMinimizedActive = JSON.parse(sideBarMinimized);
    // }
    // this.getPhoto();
  }

  ngAfterViewInit(): void {
    this.applyDarkMode();
  }

  // hasAdminAccess(): boolean {
  //   return this.permi === 2;
  // }

  // toggleSidebar(): void {
  //   this.isSidebarMinimizedActive = false
  //   this.isSidebarActive = !this.isSidebarActive;
  // }

  // toggleSidebarMinimized(): void {
  //   this.isSidebarMinimizedActive = !this.isSidebarMinimizedActive;
  //   localStorage.setItem('SideBarMinimized', JSON.stringify(this.isSidebarMinimizedActive))
  // }

  // getPhoto() {
  //   this.userService.getUserInfo().subscribe({
  //     next: (user) => {
  //       this.name = user.name;
  //       this.photo = user.photo
  //         ? `http://localhost:8000/uploads/users/${user.photo}`
  //         : null;
  //     },
  //     error: (err) => {
  //       console.error('Erro ao carregar usuário:', err);
  //     }
  //   });
  // }

  // logout(): void {
  //   localStorage.removeItem('ControleUsuarioLogado');
  //   localStorage.removeItem('ControleUsuario');
  //   localStorage.removeItem('ControleUsuarioPermi');
  //   localStorage.removeItem('ControleUsuarioIP');
  //   localStorage.removeItem('jwt');
  //   this.router.navigate(['/']);
  // }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyDarkMode();
    localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
  }

  private applyDarkMode(): void {
    const body = document.body;
    const logoImage = document.getElementById('logoImage') as HTMLImageElement;

    if (this.isDarkMode) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  }
}
