import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CoinsService } from '../AuthService/coins.service';

@Component({
  selector: 'app-coin',
  templateUrl: './coin.component.html',
  styleUrls: ['./coin.component.css']
})
export class CoinComponent {
  coin: any;
  searchName: string = '';
  selectedIssuer: string = '';
  selectedCategory: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private coinsService: CoinsService
  ) { }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadCoin(id);
    }
  }

  loadCoin(id: number): void {
    this.coinsService.getCoin(id).subscribe({
      next: (coin) => {
        this.coin = {
  ...coin,
  categoryDisplay: coin.category === 'coin' ? 'Moeda' : coin.category,
  showBrazilFlag: coin.issuer?.name?.toLowerCase() === 'brasil' // força lowercase
};

      },
      error: (err) => {
        console.error('Erro ao carregar moeda:', err);
      }
    });
  }

  applyFilters() {
  }

  formatValue(coin: any): string | null {
    return coin?.valueFullName || coin?.valueText || (coin?.valueNumeric ? `${coin.valueNumeric} ${coin.currencyName || coin.currency || ''}` : null);
  }
removeEdgeImg() {
  // Remove a referência da imagem para não tentar mais mostrar
  this.coin.edgeImg = null;
}
}
