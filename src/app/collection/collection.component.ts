import { Component, OnInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { CoinService } from '../AuthService/coin.service';

interface Coin {
  id?: number;
  title?: string;
  category?: 'coin' | 'banknote' | string;
  issuer?: string;
  year?: number;
  min_year?: number;
  max_year?: number;
  obverse?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit {
  coins: Coin[] = [];
  banknotes: Coin[] = [];
  albumCoins: Coin[] = [];
  albumBanknotes: Coin[] = [];
  ownedCoinIds: Set<string> = new Set();
  ownedBanknoteIds: Set<string> = new Set();

  minYear?: number;
  maxYear?: number;

  countries: string[] = [];
  activeCountry: string = '';
  activeTab: 'coins' | 'banknotes' = 'coins';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSize = 53;

  pagination: {
    [country: string]: {
      coins: { page: number; loaded: Coin[] };
      banknotes: { page: number; loaded: Coin[] };
    }
  } = {};

  constructor(
    private coinsService: CoinsService,
    private coinService: CoinService
  ) { }

  ngOnInit(): void {
    this.getAlbum();
    this.loadAll();
  }

  getAlbum(): void {
    this.coinsService.getAlbumByUser().subscribe({
      next: (res: Coin[]) => {
        const album = res || [];
        this.albumCoins = album.filter(a => a.category === 'coin');
        this.albumBanknotes = album.filter(a => a.category === 'banknote');

        this.ownedCoinIds = new Set(this.albumCoins.map(a => String(a.id)));
        this.ownedBanknoteIds = new Set(this.albumBanknotes.map(a => String(a.id)));

        this.applyFilters();
      },
      error: (err) => console.error('Erro ao carregar álbum:', err)
    });
  }

  loadAll(): void {
    this.coinService.getCoins().subscribe({
      next: (data: Coin[]) => {
        const all = data.map(coin => ({
          ...coin,
          categoryDisplay: coin.category === 'coin' ? 'Moeda' : 'Cédula',
          showBrazilFlag: coin.issuer === 'Brasil'
        }));

        this.coins = all.filter(c => c.category === 'coin');
        this.banknotes = all.filter(c => c.category === 'banknote');

        this.countries = Array.from(
          new Set(all.map(c => c.issuer).filter((issuer): issuer is string => !!issuer))
        ).sort();

        this.activeCountry = this.countries[0] || '';

        this.countries.forEach(c => {
          this.pagination[c] = {
            coins: { page: 1, loaded: [] },
            banknotes: { page: 1, loaded: [] }
          };
          this.loadMore(c, 'coins');
          this.loadMore(c, 'banknotes');
        });
      },
      error: (err) => console.error('Erro ao carregar moedas/cédulas:', err)
    });
  }

  userHasCoin(coin: Coin): boolean {
    return this.ownedCoinIds.has(String(coin.id));
  }

  userHasBanknote(banknote: Coin): boolean {
    return this.ownedBanknoteIds.has(String(banknote.id));
  }

  applyFilters(): void {
    this.countries.forEach(country => {
      this.pagination[country].coins = { page: 1, loaded: [] };
      this.pagination[country].banknotes = { page: 1, loaded: [] };

      this.loadMore(country, 'coins');
      this.loadMore(country, 'banknotes');

      const coinContainer = document.querySelector(`.scroll-container[data-country="${country}"][data-type="coins"]`);
      if (coinContainer) {
        let div = coinContainer as HTMLElement;
        while (div.scrollHeight <= div.clientHeight &&
          this.filteredCoinsByCountry(country).length > this.pagination[country].coins.loaded.length) {
          this.loadMore(country, 'coins');
        }
      }

      const banknoteContainer = document.querySelector(`.scroll-container[data-country="${country}"][data-type="banknotes"]`);
      if (banknoteContainer) {
        let div = banknoteContainer as HTMLElement;
        while (div.scrollHeight <= div.clientHeight &&
          this.filteredBanknotesByCountry(country).length > this.pagination[country].banknotes.loaded.length) {
          this.loadMore(country, 'banknotes');
        }
      }
    });
  }

  private getYearValue(c: Coin): number {
    return c.year ?? c.min_year ?? c.max_year ?? 0;
  }

  filteredCoinsByCountry(country: string): Coin[] {
    const minY = this.minYear ?? -Infinity;
    const maxY = this.maxYear ?? Infinity;
    return this.coins
      .filter(c => c.issuer === country && this.getYearValue(c) >= minY && this.getYearValue(c) <= maxY)
      .sort((a, b) =>
        this.sortOrder === 'asc' ? this.getYearValue(a) - this.getYearValue(b) : this.getYearValue(b) - this.getYearValue(a)
      );
  }

  filteredBanknotesByCountry(country: string): Coin[] {
    const minY = this.minYear ?? -Infinity;
    const maxY = this.maxYear ?? Infinity;
    return this.banknotes
      .filter(c => c.issuer === country && this.getYearValue(c) >= minY && this.getYearValue(c) <= maxY)
      .sort((a, b) =>
        this.sortOrder === 'asc' ? this.getYearValue(a) - this.getYearValue(b) : this.getYearValue(b) - this.getYearValue(a)
      );
  }

  loadMore(country: string, type: 'coins' | 'banknotes') {
    const allItems = type === 'coins' ? this.filteredCoinsByCountry(country) : this.filteredBanknotesByCountry(country);
    const page = this.pagination[country][type].page;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    const nextItems = allItems.slice(start, end);

    if (nextItems.length > 0) {
      this.pagination[country][type].loaded.push(...nextItems);
      this.pagination[country][type].page += 1;
    }
  }


  onScroll(event: any, country: string, type: 'coins' | 'banknotes') {
    const div = event.target;
    if (div.scrollTop + div.clientHeight >= div.scrollHeight - 50) {
      this.loadMore(country, type);
    }
  }

  getProgressByCountry(country: string, type: 'coins' | 'banknotes'): string {
    const all = type === 'coins' ? this.filteredCoinsByCountry(country) : this.filteredBanknotesByCountry(country);
    const owned = all.filter(c => type === 'coins' ? this.userHasCoin(c) : this.userHasBanknote(c)).length;
    return `${owned} / ${all.length}`;
  }

  getProgressPercentByCountry(country: string, type: 'coins' | 'banknotes'): number {
    const all = type === 'coins' ? this.filteredCoinsByCountry(country) : this.filteredBanknotesByCountry(country);
    if (all.length === 0) return 0;
    const owned = all.filter(c => type === 'coins' ? this.userHasCoin(c) : this.userHasBanknote(c)).length;
    return Math.round((owned / all.length) * 100);
  }

  clearFilters(): void {
    this.minYear = undefined;
    this.maxYear = undefined;
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }
}
