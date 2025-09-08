import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";
import { ClothesService } from '../AuthService/clothes.service';



@Component({
  selector: 'app-approval',
  templateUrl: './approval.component.html',
  styleUrls: ['./approval.component.css']
})
export class ApprovalComponent {

  approval = { name: '', phone: '', cpf: ''};

  constructor(
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private clothesService: ClothesService,
  ) { }

  ngOnInit() {

  }
 
  showAlert(data: any) {
    if (data != undefined) {
      this.toastr.error(JSON.stringify(data));
      if (data.erro == true) {
        this.toastr.error(data.mensagem);
      } else if (data.erro == false) {
        this.toastr.success(data.mensagem);
      } else {
      }
    }
  }

  addCustomer(){
    let aux = {
      name: this.approval.name,
      city: this.approval.phone,
      phone: this.approval.cpf,
    }
    console.log('aa',aux)
  }
}
