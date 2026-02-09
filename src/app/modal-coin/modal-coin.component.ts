import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CoinsService } from '../AuthService/coins.service';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../shared/loading.service';

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
  achievementBadge: string | null = null;

  achievementMessage: {
    title: string;
    subtitle: string;
  } | null = null;

  activeTab: string = 'detalhes';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private coinsService: CoinsService,
    private toastr: ToastrService,
    private loadingService: LoadingService,
  ) { }

  ngOnInit() {
    this.loadingService.show();
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

  saveEntry(entry: { year: number; quantity: number | null; condition: string | null; category: string; country: string }): void {
    this.loadingService.show();
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
      country: this.coin.issuer
    };

    this.coinsService.addCoin(payload).subscribe({
      next: (res) => {
        if (res.token) {
          localStorage.setItem('jwt', res.token);
        }
        this.loadingService.hide();
        this.toastr.success('Moeda adicionada com sucesso!');
        this.getAlbum(coinId);

        if (res.achievementsUnlocked?.length) {
          this.showAchievementsSequentially(res.achievementsUnlocked);
        }

        entry.quantity = null;
        entry.condition = null;
        this.updated.emit();
      },
      error: (err) => {
        this.loadingService.hide();
        console.error('Erro ao adicionar moeda:', err);
        this.toastr.error('Erro ao adicionar moeda.');
      }
    });
  }

  showAchievementsSequentially(achievements: any[]) {
    let index = 0;
    const showNext = () => {
      if (index >= achievements.length) {
        return;
      }
      const achievement = achievements[index];
      this.showAchievementBadge(
        achievement.icon,
        achievement.title,
        achievement.description
      );
      index++;

      setTimeout(() => {
        showNext();
      }, 7000);
    };

    showNext();
  }

  showAchievementBadge(
    badgeName: string,
    title: string,
    subtitle: string
  ): Promise<void> {
    return new Promise((resolve) => {
      this.achievementBadge = badgeName;
      this.achievementMessage = { title, subtitle };

      setTimeout(() => {
        this.achievementBadge = null;
        this.achievementMessage = null;
        resolve();
      }, 6555);
    });
  }

  blockNegative(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'e') {
      event.preventDefault();
    }
  }

  sanitizeQuantity(entry: any): void {
    if (entry.quantity !== null && entry.quantity < 1) {
      entry.quantity = null;
    }
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
      },
      error: (err) => {
        console.error('Erro ao carregar álbum:', err);
      }
    });
    this.loadingService.hide();
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
    this.loadingService.show();
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
        this.loadingService.hide();
        item.quantity -= quantidade;
        if (item.quantity <= 0) {
          this.albumCoins = this.albumCoins.filter(c => c !== item);
        }
        this.updated.emit();
      },
      error: (err) => {
        console.error('Erro ao remover moeda:', err);
        this.toastr.error('Erro ao remover moeda.');
        this.loadingService.hide();
      }
    });
  }
}
