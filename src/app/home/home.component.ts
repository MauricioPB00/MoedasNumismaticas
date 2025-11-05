import { Component, OnInit } from '@angular/core';
import { CoinService } from '../AuthService/coin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '../shared/loading.service';
import { AVAILABLE_COUNTRIES_CAD, CountryCAD } from '../models/countriesCAD';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  coins: any[] = [];
  filteredCoins: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 24;
  searchName: string = '';
  selectedCategory: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;
  coinsLoaded = false;
  queryParamsInitialized = false;
  initialFiltersApplied = false;

  coin: any;
  coinEntries: { year: number; quantity: number | null; condition: string | null, id: number, type: string }[] = [];
  showModal = false;

  selectedIssuer: string = '';
  selectedCountry: string = 'Brasil';
  availableCountries: CountryCAD[] = AVAILABLE_COUNTRIES_CAD;
  uniqueCategories: string[] = [];

  showFilters = false;

  constructor(
    private coinService: CoinService,
    private router: Router,
    private route: ActivatedRoute,
    private loading: LoadingService,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.queryParamsInitialized = true;

      if (params['searchName']) this.searchName = params['searchName'];
      if (params['category']) this.selectedCategory = params['category'];
      if (params['issuer']) this.selectedIssuer = params['issuer'];
      if (params['country']) this.selectedCountry = params['country'];

      if (params['minYear']) this.minYear = +params['minYear'];
      if (params['maxYear']) this.maxYear = +params['maxYear'];

      this.currentPage = params['page'] ? +params['page'] : 1;

      this.loadCoins(this.selectedCountry);
    });
  }

  loadCoins(country: string) {
    this.loading.show();

    this.coinService.getCoins(country).subscribe({
      next: (data) => {
        this.coins = data.map(coin => {
          const normalizedIssuer = coin.issuer
            ?.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
          return {
            ...coin,
            categoryDisplay: coin.category === 'coin' ? 'Moeda' : 'Cédula',
            flagPath: normalizedIssuer
              ? `assets/img/bandeiras/bandeira-${normalizedIssuer}.png`
              : null
          };
        });

        this.uniqueCategories = [...new Set(this.coins.map(c => c.category))];

        this.coins.sort((a, b) => {
          const yearA = a.min_year ?? a.year ?? 0;
          const yearB = b.min_year ?? b.year ?? 0;
          return yearA - yearB;
        });

        this.filteredCoins = [...this.coins];
        this.coinsLoaded = true;

        this.applyFilters();

        this.loading.hide();
      },
      error: (err) => {
        console.error('Erro ao carregar moedas:', err);
        this.loading.hide();
      }
    });
  }

  onCountryChange(event: any) {
    this.selectedCountry = event.target.value || 'Brasil';
    this.loadCoins(this.selectedCountry);
  }

  applyFiltersIfReady() {
    if (this.coinsLoaded && this.queryParamsInitialized && !this.initialFiltersApplied) {
      this.applyFilters(false, false);
      this.initialFiltersApplied = true;
    } else if (this.coinsLoaded && !this.queryParamsInitialized && !this.initialFiltersApplied) {
      this.applyFilters(true, false);
      this.initialFiltersApplied = true;
    }

  }

  applyFilters(resetPage: boolean = false, updateUrl: boolean = true) {
    const coinsFiltered = this.coins.filter(coin => {
      const matchName = this.searchName
        ? (coin.title || '').toLowerCase().includes(this.searchName.toLowerCase())
        : true;

      const matchCategory = this.selectedCategory ? coin.category === this.selectedCategory : true;

      const matchYear = (() => {
        const minFilter = this.minYear;
        const maxFilter = this.maxYear;
        if (minFilter == null && maxFilter == null) return true;

        const coinMin = coin.min_year ?? coin.year ?? null;
        const coinMax = coin.max_year ?? coin.min_year ?? coin.year ?? null;

        if (minFilter != null && maxFilter == null) return coinMax != null && coinMax >= minFilter;
        if (minFilter == null && maxFilter != null) return coinMin != null && coinMin <= maxFilter;
        if (minFilter != null && maxFilter != null)
          return coinMin != null && coinMax != null && coinMin >= minFilter && coinMax <= maxFilter;

        return true;
      })();

      return matchName && matchCategory && matchYear;
    });

    this.filteredCoins = coinsFiltered;

    if (resetPage) this.currentPage = 1;

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          searchName: this.searchName || null,
          category: this.selectedCategory || null,
          minYear: this.minYear != null ? this.minYear : null,
          maxYear: this.maxYear != null ? this.maxYear : null,
          country: this.selectedCountry || null,
          page: this.currentPage
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  clearFilters() {
    this.loading.show();
    this.searchName = '';
    this.selectedCategory = '';
    this.minYear = null;
    this.maxYear = null;
    this.currentPage = 1;
    this.applyFilters(true, true);
    this.loading.hide();
  }

  get paginatedCoins() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCoins.slice(start, end);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredCoins.length / this.itemsPerPage));
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: this.currentPage },
        queryParamsHandling: 'merge'
      });
    }
  }

  get uniqueIssuers(): string[] {
    return [...new Set(this.coins.map(c => c.issuer))];
  }

  verDetalhes(id: number) {
    this.router.navigate(['/coin', id], {
      queryParams: {
        searchName: this.searchName || null,
        issuer: this.selectedIssuer || null,
        category: this.selectedCategory || null,
        minYear: this.minYear != null ? this.minYear : null,
        maxYear: this.maxYear != null ? this.maxYear : null,
        page: this.currentPage
      }
    });
  }

  abrirModal(event: Event, itemId: number, type: 'coin' | 'banknote'): void {
    this.loading.show();
    event.preventDefault();
    event.stopPropagation();

    const element = event.target as HTMLElement;
    element.blur();

    this.coin = this.coins.find(c => c.id === itemId && c.type === type);

    if (!this.coin) {
      console.error('Item não encontrado no álbum:', { itemId, type });
      return;
    }

    this.coinEntries = [];
    const minYear = this.coin.min_year ?? this.coin.minYear ?? null;
    const maxYear = this.coin.max_year ?? this.coin.maxYear ?? null;
    const singleYear = this.coin.year ?? null;

    if (minYear != null && maxYear != null) {
      for (let y = minYear; y <= maxYear; y++) {
        this.coinEntries.push({ year: y, quantity: null, condition: null, id: this.coin.id, type: this.coin.type });
      }
    } else if (singleYear != null) {
      this.coinEntries.push({ year: singleYear, quantity: null, condition: null, id: this.coin.id, type: this.coin.type });
    }

    this.showModal = true;

    console.log('Abrindo modal para:', this.coin);
    this.loading.hide();
  }

  getFlagCode(issuer: string): string {
    const found = AVAILABLE_COUNTRIES_CAD.find(c => c.name === issuer);
    return found ? found.code : 'un';
  }
}
