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

  saveEntry(entry: { year: number; quantity: number | null; condition: string | null }) {
    if (!this.coin) return;

    if (!entry.quantity || entry.quantity <= 0) {
      alert(`Informe uma quantidade válida para o ano ${entry.year}.`);
      return;
    }

    const payload = {
      coinId: this.coin.id,
      year: entry.year,
      quantity: entry.quantity,
      condition: entry.condition
    };

    this.coinsService.addCoin(payload).subscribe({
      next: (res) => {
        if (res.token) {
          localStorage.setItem('jwt', res.token);
        }
        this.toastr.success('Moeda adicionada com sucesso!');
      },
      error: (err) => {
        console.error('Erro ao adicionar moeda:', err);
        this.toastr.error('Erro ao adicionar moeda.');
      }
    });
  }
}
