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
      this.getAlbum(id);
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

  getAlbum(id: number): void {
    this.coinsService.getCoinAlbumById(id).subscribe({
      next: (res) => {
        this.albumCoins = this.sortAlbumCoins(res);

        const conds = [...new Set(
          res
            .map((c: any) => c.condition)
            .filter((c: string | null) => c != null && c.trim() !== '')
        )] as string[];

        this.uniqueConditions = ['Todas condições', ...conds];
        console.log('Álbum carregado:', this.albumCoins);
      },
      error: (err) => {
        console.error('Erro ao carregar álbum:', err);
      }
    });
  }

  private sortAlbumCoins(coins: any[]): any[] {
    const conditionOrder: { [key: string]: number } = {
      'FC': 1,
      'S': 2,
      'MBC': 3,
      'BC': 4,
      'R': 5,
      'Nula': 6,
      null: 999
    };

    return coins.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year; // ordena por ano
      }
      const condA = conditionOrder[a.condition ?? 'null'] ?? 999;
      const condB = conditionOrder[b.condition ?? 'null'] ?? 999;
      return condA - condB; // ordena pela condição
    });
  }

  removeCoins(item: any) {
    const quantidade = item.toRemove || 1;

    if (quantidade > item.quantidade) {
      this.toastr.error("Você não pode remover mais do que possui!");
      return;
    }

    const payload = {
      coinId: item.coinId,
      year: item.year,
      condition: item.condition,
      quantity: item.toRemove
    };

    this.coinsService.removeCoin(payload).subscribe({
      next: (res) => {
        this.toastr.success(`${quantidade} moeda(s) removida(s)!`);

        item.quantity -= quantidade;
        if (item.quantity <= 0) {
          this.albumCoins = this.albumCoins.filter(c => c !== item);
        }
      },
      error: (err) => {
        console.error('Erro ao remover moeda:', err);
        this.toastr.error('Erro ao remover moeda.');
      }
    });
  }
}
