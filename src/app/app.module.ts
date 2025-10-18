import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { LoginService } from './AuthService/login.service';

import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from "ngx-spinner";
import { ToastrModule } from 'ngx-toastr';
import { SideBarComponent } from './side-bar/side-bar.component';
import { HomeComponent } from './home/home.component';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SettingsComponent } from './settings/settings.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { CoinComponent } from './coin/coin.component';

import { PhoneFormatDirective } from './config/phone-format.directive';
import { CpfFormatDirective } from './config/cpf-format.directive';
import { HomepageComponent } from './homepage/homepage.component';
import { HeaderComponent } from './header/header.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ProfileComponent } from './profile/profile.component';
import { AlbumComponent } from './album/album.component';
import { ModalCoinComponent } from './modal-coin/modal-coin.component';
import { ListarComponent } from './listar/listar.component';
import { MapaMundiComponent } from './mapa-mundi/mapa-mundi.component';
import { FilterCountryPipe } from './models/filter-country.pipe';
import { CollectionComponent } from './collection/collection.component';
import { ModalPriceComponent } from './modal-price/modal-price.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SideBarComponent,
    HomeComponent,
    SettingsComponent,
    PhoneFormatDirective,
    CpfFormatDirective,
    HomepageComponent,
    HeaderComponent,
    PasswordResetComponent,
    ResetPasswordComponent,
    ProfileComponent,
    CoinComponent,
    AlbumComponent,
    ModalCoinComponent,
    ListarComponent,
    MapaMundiComponent,
    FilterCountryPipe,
    CollectionComponent,
    ModalPriceComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    NgxSpinnerModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    ModalModule.forRoot(),
    ReactiveFormsModule,
    MatTabsModule,
    MatDialogModule,
  ],
  providers: [LoginService],
  bootstrap: [AppComponent]
})
export class AppModule { }
