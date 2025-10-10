import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guard/auth.guard';
import { SettingsComponent } from './settings/settings.component';
import { HomepageComponent } from './homepage/homepage.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ProfileComponent } from './profile/profile.component';
import { CoinComponent } from './coin/coin.component';
import { AlbumComponent } from './album/album.component';
import { ListarComponent } from './listar/listar.component';
import { MapaMundiComponent } from './mapa-mundi/mapa-mundi.component';
import { CollectionComponent } from './collection/collection.component';

enum Permi { admin = 2, operador = 1 }

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'collection', component: CollectionComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'sidebar', component: SideBarComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'coin/:id', component: CoinComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'album', component: AlbumComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'listar', component: ListarComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'mapa', component: MapaMundiComponent, canActivate: [AuthGuard], data: { roles: [Permi.operador, Permi.admin] } },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { roles: [Permi.admin] } },
  { path: '**', component: HomepageComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
