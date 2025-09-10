import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guard/auth.guard';
import { SettingsComponent } from './settings/settings.component';
import { ControlComponent } from './control/control.component';
import { ApprovalComponent } from './approval/approval.component';
import { HomepageComponent } from './homepage/homepage.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';

enum Permi { admin = 1, operador = 2 }

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent},
  { path: 'password-reset', component: PasswordResetComponent},
  { path: 'sidebar', component: SideBarComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'control', component: ControlComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'approval', component: ApprovalComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: '**', component: HomepageComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
