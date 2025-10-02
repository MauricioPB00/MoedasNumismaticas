import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CoinsService } from '../AuthService/coins.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-modal-coin',
  templateUrl: './modal-coin.component.html',
  styleUrls: ['./modal-coin.component.css']
})
export class ModalCoinComponent {
  @Input() show = false;
  @Output() closed = new EventEmitter<void>();
  @Input() coin: any;
  @Input() albumCoins: any[] = [];
  @Input() coinEntries: any[] = [];
  @Output() updated = new EventEmitter<void>();

  searchName: string = '';
  selectedIssuer: string = '';
  selectedCategory: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;
  years: number[] = [];
  uniqueConditions: string[] = [];

  activeTab: string = 'detalhes';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private coinsService: CoinsService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    const routeId = Number(this.route.snapshot.paramMap.get('id'));

    if (this.coin && (this.coin.coinId || this.coin.id)) {
      const coinId = this.coin.coinId ?? this.coin.id;
      this.getAlbum(coinId);
      return;
    }

    if (routeId && !isNaN(routeId)) {
      this.getAlbum(routeId);
      return;
    }

    console.warn('Nenhum CoinId válido encontrado. O modal não irá carregar o álbum.');
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  closeModal() {
    this.closed.emit();
  }

  saveEntry(entry: { year: number; quantity: number | null; condition: string | null; category: string; }): void {
    if (!this.coin) return;

    if (!entry.quantity || entry.quantity <= 0) {
      alert(`Informe uma quantidade válida para o ano ${entry.year}.`);
      return;
    }
    const coinId = this.coin.id ?? this.coin.coinId;

    if (!coinId) {
      console.error('CoinId inválido, não é possível salvar a entrada.');
      return;
    }

    const payload = {
      coinId,
      year: entry.year,
      quantity: entry.quantity,
      condition: entry.condition,
      type: this.coin.category,
    };

    this.coinsService.addCoin(payload).subscribe({
      next: (res) => {
        if (res.token) {
          localStorage.setItem('jwt', res.token);
        }
        this.toastr.success('Moeda adicionada com sucesso!');
        this.getAlbum(coinId);
        entry.quantity = null;
        entry.condition = null;
        this.updated.emit();
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
        console.log('Álbum carregado:', this.albumCoins);
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
    const coinId = this.coin.id ?? this.coin.coinId;
    
    if (quantidade > item.quantity) {
      this.toastr.error("Você não pode remover mais do que possui!");
      return;
    }
    const payload = {
      coinId: coinId,
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
        this.updated.emit();
      },
      error: (err) => {
        console.error('Erro ao remover moeda:', err);
        this.toastr.error('Erro ao remover moeda.');
      }
    });
  }
}
