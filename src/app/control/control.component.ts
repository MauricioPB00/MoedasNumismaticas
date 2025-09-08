import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";
import { ClothesService } from '../AuthService/clothes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css'],
})
export class ControlComponent implements OnInit {
  clothing: any[] = [];

  tabs: { icon: string }[] = [
    { icon: 'fa fa-credit-card' },
    { icon: 'fa fa-tshirt' },
    { icon: 'fa fa-cogs' },
  ];

  cardOptions = [
    { id: 1, name: '1x Sem Juros' },
    { id: 2, name: '2x Sem Juros' },
    { id: 3, name: '3x Sem Juros' },
    { id: 4, name: '4x Com Juros' },
    { id: 5, name: '5x Com Juros' },
    { id: 6, name: '6x Com Juros' },
  ];

  flagOptions = [
    { id: 1, name: 'Visa' },
    { id: 2, name: 'Master' },
  ];

  selectedTab: number = 0;
  selectedCard: number;
  selectedFlag: number;
  discount: number = 0;
  totalDividido: number = 0;
  totalWithDiscount: number = 0;
  totalWithDiscountFormatted: string = '';
  totalDivididoFormatted: string = '';
  combinedTotalText: string = '';
  aux: any;

  constructor(
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private clothesService: ClothesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (window.history.state && window.history.state.clothing) {
      this.clothing = window.history.state.clothing;
      this.totalWithDiscount = this.getTotalResale();
      this.totalWithDiscountFormatted = this.formatCurrency(this.totalWithDiscount);
    }
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  onTotalFormattedChange(event: string): void {
    const numericValue = parseFloat(event.replace('R$ ', '').replace(',', '.'));
    this.totalWithDiscount = !isNaN(numericValue) ? numericValue : 0;
  }

  onDiscountChange(): void {
    console.log('Valor do desconto:', this.discount);
    this.onTotal();
  }


  onTotal(): void {
    let total = this.getTotalResale();
    if (this.selectedTab == 0) {
      if (this.discount > 0) {
        console.log(this.selectedCard === 1)
        console.log('a');
        if (this.selectedCard <= 3) {
          console.log('b');
          const discountAmount = (this.discount / 100) * total;
          total -= discountAmount;
        } else if (this.selectedCard >= 4) {
          console.log('c');
          const interestCharge = (3 / 100) * total;
          const discountAmount = (this.discount / 100) * total;
          console.log('1', interestCharge)
          console.log('2', discountAmount)
          console.log('3', total)

          total -= discountAmount;
          console.log('4', total)
          total += interestCharge;
          console.log('5', total)
          this.totalDividido = total / this.selectedCard
          console.log('6', this.totalDividido)
        }
      } else {
        if (this.selectedCard >= 4) {
          console.log('c');
          const interestCharge = (3 / 100) * total;
          console.log('1', interestCharge)
          console.log('3', total)
          total += interestCharge;
          console.log('5', total)
          this.totalDividido = total / this.selectedCard
          console.log('6', this.totalDividido)
        }
      }
    }else if(this.selectedTab == 1){
      if (this.discount > 0) {
          const discountAmount = (this.discount / 100) * total;
          total -= discountAmount;
      }
    }

    if (total < 0) {
      total = 0;
    }

    this.totalWithDiscount = total;
    this.totalWithDiscountFormatted = this.formatCurrency(this.totalWithDiscount);

    if (this.selectedCard > 1) {
      this.totalDividido = total / this.selectedCard;
      this.totalDivididoFormatted = this.formatCurrency(this.totalDividido);
    } else {
      this.totalDividido = 0;
      this.totalDivididoFormatted = '';
    }

    this.combinedTotalText = `${this.totalWithDiscountFormatted} ${this.selectedCard > 1 ? `${this.selectedCard}x ${this.totalDivididoFormatted}` : ''}`;

    this.totalWithDiscount = total;
    this.combinedTotalText = `${this.totalWithDiscountFormatted} ${this.selectedCard > 1 ? `${this.selectedCard}x ${this.totalDivididoFormatted}` : ''}`;

    console.log('Total com desconto:', this.totalWithDiscount);
  }

  getTotalResale(): number {
    return this.clothing?.reduce((total, item) => total + parseFloat(item.resale || 0), 0) || 0;
  }

  selectTab(index: number): void {
    this.selectedTab = index;
  }

  removeItem(itemId: number): void {
    this.clothing = this.clothing.filter(item => item.id !== itemId);
    this.onTotal();
  }

  onCardChange(): void {
    this.onTotal();
  }

  onFlagChange(): void {
    this.onTotal();
  }
  finishButton() {
    if(this.selectedTab == 0 && this.clothing.length >= 1) { 
      let aux = {
        card: this.selectedCard,
        flag: this.selectedFlag,
        discount: this.discount,
        totalWithDiscount: this.totalWithDiscount,
        combinedTotalText: this.combinedTotalText,
        type: 'card',
        clothing: this.clothing,
        
      }
      console.log(aux);

    } else if ( this.selectedTab == 1  && this.clothing.length >= 1){
      let aux = {
        discount: this.discount,
        totalWithDiscount: this.totalWithDiscount,
        type: 'money',
        clothing: this.clothing,
        
      }
      console.log(aux)
    }
    this.clothesService.postRegisterSale(this.aux).subscribe(
      (data: any) => {
        if (data.error === false) {
          this.toastr.success('Venda Realizada com sucesso');
          this.router.navigate(['/home']);
        } else {
          this.toastr.error(data.message || 'Erro ao registrar');
        }
        this.spinner.hide();
      },
      error => {
        this.toastr.error('Erro ao registrar: ' + error.message);
        this.spinner.hide();
      }
    );
  }
}
