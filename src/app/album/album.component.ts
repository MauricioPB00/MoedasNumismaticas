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
  pagedCoins: any[] = [];

  loading: boolean = false;
  error: string | null = null;

  searchName: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;
  uniqueConditions: string[] = [];
  selectedCondition: string = 'Todas condições';

  groupByCoinId: boolean = false;
  showCoins: boolean = true;
  showBanknotes: boolean = true;

  currentPage = 1;
  itemsPerPage = 24;
  totalPages = 0;

  showModal = false;
  coinEntries: { year: number; quantity: number | null; condition: string | null }[] = [];
  coin: any;

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
        this.albumCoins = res || [];

        const conds = [...new Set(
          this.albumCoins
            .map((item: any) => item.condition)
            .filter((c: string | null) => c != null && String(c).trim() !== '')
        )] as string[];

        this.uniqueConditions = ['Todas condições', ...conds];
        this.selectedCondition = 'Todas condições';

        this.applyFilters();

        this.loading = false;
        console.log('Álbum carregado (raw):', this.albumCoins);
      },
      error: (err) => {
        console.error('Erro ao carregar álbum:', err);
        this.error = 'Erro ao carregar álbum.';
        this.loading = false;
      }
    });
  }

  private getBaseFilteredCoins(): any[] {
    return this.albumCoins.filter((item: any) => {
      const name = (item.title || '').toLowerCase();
      const matchesName = this.searchName
        ? name.includes(this.searchName.toLowerCase())
        : true;

      const matchesMinYear = this.minYear ? (item.year ?? 0) >= this.minYear : true;
      const matchesMaxYear = this.maxYear ? (item.year ?? 0) <= this.maxYear : true;

      const matchesCondition = this.selectedCondition !== 'Todas condições'
        ? (item.condition ?? '') === this.selectedCondition
        : true;

      const matchesCategory =
        (this.showCoins && item.category === 'coin') ||
        (this.showBanknotes && item.category === 'banknote');

      return matchesName && matchesMinYear && matchesMaxYear && matchesCondition && matchesCategory;
    });
  }



  applyFilters(): void {
    if (this.groupByCoinId) {
      this.applyFiltersGroup();
    } else {
      this.filteredCoins = this.getBaseFilteredCoins();
      this.updatePagination();
      console.log('Resultado após filtros básicos:', this.filteredCoins.length);
    }
  }

  clearFilters(): void {
    this.searchName = '';
    this.minYear = null;
    this.maxYear = null;
    this.selectedCondition = 'Todas condições';
    this.showCoins = true;
    this.showBanknotes = true;
    this.groupByCoinId = false;
    this.applyFilters();
  }

  viewItem(item: any): void {
    if (item.category === 'coin') {
      this.router.navigate(['/coin', item.id]);
    } else if (item.category === 'banknote') {
      this.router.navigate(['/banknote', item.id]);
    }
  }

  viewCoin(coinId: number): void {
    this.router.navigate(['/coin', coinId]);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/placeholder.png';
  }

  applyFiltersGroup(): void {
    const items = this.getBaseFilteredCoins();
    console.log('filtered (after basic filters):', items.length);

    const map = new Map<string, any>();

    items.forEach(item => {
      const key = `${item.category}_${item.id}`;
      const qty = Number(item.quantity) || 0;
      const cond = (item.condition === null || item.condition === undefined || String(item.condition).trim() === '')
        ? '—'
        : String(item.condition);

      if (!map.has(key)) {
        map.set(key, {
          ...item,
          quantity: qty,
          conditions: [{ type: cond, quantity: qty }],
          years: item.year ? [item.year] : []
        });
      } else {
        const group = map.get(key);
        group.quantity = (Number(group.quantity) || 0) + qty;

        const idx = group.conditions.findIndex((x: any) => x.type === cond);
        if (idx >= 0) {
          group.conditions[idx].quantity = (Number(group.conditions[idx].quantity) || 0) + qty;
        } else {
          group.conditions.push({ type: cond, quantity: qty });
        }

        if (item.year && !group.years.includes(item.year)) {
          group.years.push(item.year);
        }
      }
    });

    const grouped = Array.from(map.values()).map(g => {
      g.conditions.sort((a: any, b: any) => (b.quantity || 0) - (a.quantity || 0));
      g.conditionsSummary = g.conditions
        .map((cond: any) => {
          if (!cond.type || cond.type === '—') {
            return `(${cond.quantity})`;
          }
          return `(${cond.quantity} ${cond.type})`;
        })
        .join(' – ');
      g.yearsSummary = (g.years || []).sort((a: any, b: any) => a - b).join(', ');
      g.quantityTotal = Number(g.quantity) || 0;
      return g;
    });

    console.log('grouped result:', grouped.length);
    this.filteredCoins = grouped;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCoins.length / this.itemsPerPage);
    if (this.totalPages === 0) {
      this.currentPage = 1;
      this.pagedCoins = [];
      return;
    }
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedCoins = this.filteredCoins.slice(start, end);
    console.log(`Página ${this.currentPage}/${this.totalPages} — exibindo ${this.pagedCoins.length} itens`);
  }

  applyCoinsFilter(value?: boolean): void {
    if (typeof value === 'boolean') {
      this.showCoins = value;
    }
    this.applyFilters();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  abrirModal(event: Event, coinId: number): void {
    event.stopPropagation();
    (event.target as HTMLElement).blur();

    this.coin = this.albumCoins.find(c => c.coinId === coinId);

    this.coinEntries = [];
    if (this.coin.minYear != null && this.coin.maxYear != null) {
      for (let y = this.coin.minYear; y <= this.coin.maxYear; y++) {
        this.coinEntries.push({
          year: y,
          quantity: null,
          condition: null
        });
      }
    } else {
      this.coinEntries.push({
        year: this.coin.year,
        quantity: null,
        condition: null
      });
    }

    this.showModal = true;

    console.log('Abrir modal para coin:', this.coin);
    console.log('Coin entries inicializadas:', this.coinEntries);
  }

  refreshAlbum(): void {
    this.coinsService.getAlbumByUser().subscribe({
      next: (res) => {
        this.albumCoins = res || [];

        const conds = [...new Set(
          this.albumCoins
            .map((c: any) => c.condition)
            .filter((c: string | null) => c != null && String(c).trim() !== '')
        )] as string[];

        this.uniqueConditions = ['Todas condições', ...conds];
        this.selectedCondition = this.selectedCondition || 'Todas condições';

        this.applyFilters();
      },
      error: (err) => {
        console.error('Erro ao atualizar álbum:', err);
      }
    });
  }
}
