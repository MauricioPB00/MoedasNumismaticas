import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CoinsService } from '../AuthService/coins.service';
import { ToastrService } from 'ngx-toastr';

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
  years: number[] = [];
  coinEntries: { year: number; quantity: number | null; condition: string | null }[] = [];
  albumCoins: any[] = [];
  uniqueConditions: string[] = [];
  showModal = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private coinsService: CoinsService,
    private toastr: ToastrService
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
          showBrazilFlag: coin.issuer?.name?.toLowerCase() === 'brasil'
        };

        this.minYear = this.coin.minYear ?? null;
        this.maxYear = this.coin.maxYear ?? null;

        this.coinEntries = [];
        if (this.minYear !== null && this.maxYear !== null) {
          for (let y = this.minYear; y <= this.maxYear; y++) {
            this.coinEntries.push({
              year: y,
              quantity: null,
              condition: null
            });
          }
        }
      },
      error: (err) => {
        console.error('Erro ao carregar moeda:', err);
      }
    });
  }

  formatValue(coin: any): string | null {
    return coin?.valueFullName || coin?.valueText || (coin?.valueNumeric ? `${coin.valueNumeric} ${coin.currencyName || coin.currency || ''}` : null);
  }
  removeEdgeImg() {
    this.coin.edgeImg = null;
  }

}
