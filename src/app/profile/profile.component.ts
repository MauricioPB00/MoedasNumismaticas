import { Component, OnInit } from '@angular/core';
import { UserService } from '../AuthService/user.service';
import { take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  users: any[] = [];

  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit(): void {
    this.getUsuario();
  }

  getUsuario() {
    this.spinner.show();

    this.userService.getUser().pipe(take(1)).subscribe({
      next: (res) => {
        this.users = res;
        this.spinner.hide();
      },
      error: (err) => {
        this.toastr.error(err, 'Erro ao carregar usuários');
        this.spinner.hide();
      }
    });
  }
}
