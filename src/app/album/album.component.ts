import { Component, OnInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.css']
})
export class AlbumComponent implements OnInit {

  albumCoins: any[] = [];
  filteredCoins: any[] = [];
  loading: boolean = false;
  error: string | null = null;

  searchName: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;
  uniqueConditions: string[] = [];
  selectedCondition: string = 'Todas condições';

  groupByCoinId: boolean = false;

  constructor(
    private coinsService: CoinsService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.getAlbum();
  }

  getAlbum(): void {
    this.loading = true;
    this.error = null;

    this.coinsService.getAlbumByUser().subscribe({
      next: (res) => {
        this.albumCoins = res;

        const conds = [...new Set(
          res
            .map((c: any) => c.condition)
            .filter((c: string | null) => c != null && c.trim() !== '')
        )] as string[];

        // 🔹 garante que "Todas condições" sempre vem primeiro
        this.uniqueConditions = ['Todas condições', ...conds];
        this.selectedCondition = 'Todas condições';

        this.filteredCoins = [...this.albumCoins]; // cópia inicial
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar álbum:', err);
        this.error = 'Erro ao carregar álbum.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredCoins = this.albumCoins.filter((coin: any) => {
      const matchesName = this.searchName
        ? coin.coinTitle.toLowerCase().includes(this.searchName.toLowerCase())
        : true;

      const matchesMinYear = this.minYear ? coin.year >= this.minYear : true;
      const matchesMaxYear = this.maxYear ? coin.year <= this.maxYear : true;

      const matchesCondition = this.selectedCondition !== 'Todas condições'
        ? coin.condition === this.selectedCondition
        : true;

      return matchesName && matchesMinYear && matchesMaxYear && matchesCondition;
    });
  }

  clearFilters(): void {
    this.searchName = '';
    this.minYear = null;
    this.maxYear = null;
    this.selectedCondition = 'Todas condições';
    this.filteredCoins = [...this.albumCoins];
  }

  viewCoin(coinId: number): void {
    this.router.navigate(['/coin', coinId]);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/placeholder.png';
  }

  applyFiltersGroup(): void {
    //  filtra as repetidas
    const coins = this.albumCoins.filter((coin: any) => {
      const matchesName = this.searchName
        ? (coin.coinTitle || '').toLowerCase().includes(this.searchName.toLowerCase())
        : true;

      const matchesMinYear = this.minYear ? (coin.year ?? 0) >= this.minYear : true;
      const matchesMaxYear = this.maxYear ? (coin.year ?? 0) <= this.maxYear : true;

      const matchesCondition = this.selectedCondition && this.selectedCondition !== 'Todas condições'
        ? (coin.condition ?? '') === this.selectedCondition
        : true;

      return matchesName && matchesMinYear && matchesMaxYear && matchesCondition;
    });

    console.log('filtered (after basic filters):', coins);

    // se não agrupando, mostra as moedas normais
    if (!this.groupByCoinId) {
      this.filteredCoins = coins;
      return;
    }

    // agrupa por coinId
    const map = new Map<number, any>();

    coins.forEach(c => {
      const coinId = Number(c.coinId);
      const qty = Number(c.quantity) || 0;

      // normaliza condição
      const cond = (c.condition === null || c.condition === undefined || String(c.condition).trim() === '')
        ? '—'
        : String(c.condition);

      if (!map.has(coinId)) {
        // cria o grupo inicial
        map.set(coinId, {
          ...c,
          coinId,
          quantity: qty,
          conditions: [{ type: cond, quantity: qty }],
          years: [c.year] // inicializa com o ano da primeira moeda
        });
      } else {
        const group = map.get(coinId);

        // soma quantidade total
        group.quantity = (Number(group.quantity) || 0) + qty;

        // acumula condições
        const idx = group.conditions.findIndex((x: any) => x.type === cond);
        if (idx >= 0) {
          group.conditions[idx].quantity = (Number(group.conditions[idx].quantity) || 0) + qty;
        } else {
          group.conditions.push({ type: cond, quantity: qty });
        }

        // acumula anos (sem duplicar)
        if (c.year && !group.years.includes(c.year)) {
          group.years.push(c.year);
        }
      }
    });
    // transforma em array 
    const grouped = Array.from(map.values()).map(g => {
      // ordenar conditions por quantidade desc
      g.conditions.sort((a: any, b: any) => (b.quantity || 0) - (a.quantity || 0));

      // string das condições
      g.conditionsSummary = g.conditions
        .map((cond: any) => {
          if (!cond.type || cond.type === '—') {
            return `(${cond.quantity})`;
          }
          return `(${cond.quantity} ${cond.type})`;
        })
        .join(' – ');

      // string dos anos
      g.yearsSummary = g.years.sort((a: any, b: any) => a - b).join(', ');

      // total
      g.quantityTotal = Number(g.quantity) || 0;

      return g;
    });
    console.log('grouped result:', grouped);
    this.filteredCoins = grouped;
  }
}