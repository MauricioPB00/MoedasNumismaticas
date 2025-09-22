import { Component, OnInit } from '@angular/core';
import { CoinService } from '../AuthService/coin.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.css']
})
export class AlbumComponent {

  coins: any[] = [];
  filteredCoins: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 24;
  searchName: string = '';
  selectedIssuer: string = '';
  selectedCategory: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;
  coinsLoaded = false;
  queryParamsInitialized = false;
  initialFiltersApplied = false;


  constructor(
    private coinService: CoinService,
    private router: Router,
    private route: ActivatedRoute
  ) { }
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.queryParamsInitialized = true;

      if (params['searchName'] !== undefined) this.searchName = params['searchName'];
      if (params['issuer'] !== undefined) this.selectedIssuer = params['issuer'];
      if (params['category'] !== undefined) this.selectedCategory = params['category'];

      if (params['minYear'] !== undefined) {
        this.minYear = params['minYear'] !== '' ? +params['minYear'] : null;
      }
      if (params['maxYear'] !== undefined) {
        this.maxYear = params['maxYear'] !== '' ? +params['maxYear'] : null;
      }

      this.currentPage = params['page'] ? +params['page'] : 1;

      this.applyFiltersIfReady();
    });
    this.loadCoins();
  }

  loadCoins() {
    this.coinService.getCoins().subscribe({
      next: (data) => {
        this.coins = data.map(coin => ({
          ...coin,
          categoryDisplay: coin.category === 'coin' ? 'Moeda' : coin.category,
          showBrazilFlag: coin.issuer === 'Brasil'
        }));

        this.coins.sort((a, b) => (a.min_year || 0) - (b.min_year || 0));

        const min = Math.min(...this.coins.map(c => (c.min_year ?? Infinity)));

        if (!this.queryParamsInitialized || this.minYear == null) {
          this.minYear = isFinite(min) ? min : null;
        }

        this.coinsLoaded = true;
        this.applyFiltersIfReady();
      },
      error: (err) => console.error('Erro ao carregar moedas:', err)
    });
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
  applyFilters(resetPage: boolean = true, updateUrl: boolean = true) {
    const coinsFiltered = this.coins.filter(coin => {
      const matchName = this.searchName
        ? (coin.title || '').toLowerCase().includes(this.searchName.toLowerCase())
        : true;

      const matchIssuer = this.selectedIssuer ? coin.issuer === this.selectedIssuer : true;
      const matchCategory = this.selectedCategory ? coin.category === this.selectedCategory : true;

      const matchYear = (() => {
        const minFilter = this.minYear;
        const maxFilter = this.maxYear;

        if (minFilter == null && maxFilter == null) return true;

        const coinMin = coin.min_year ?? coin.year ?? null;
        const coinMax = coin.max_year ?? coin.min_year ?? coin.year ?? null;

        if (minFilter != null && maxFilter == null) {
          return coinMax != null && coinMax >= minFilter;
        }

        if (minFilter == null && maxFilter != null) {
          return coinMin != null && coinMin <= maxFilter;
        }

        if (minFilter != null && maxFilter != null) {
          return coinMin != null && coinMax != null && coinMin >= minFilter && coinMax <= maxFilter;
        }

        return true;
      })();

      return matchName && matchIssuer && matchCategory && matchYear;
    });

    this.filteredCoins = coinsFiltered;

    if (resetPage) {
      this.currentPage = 1;
    }

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          searchName: this.searchName || null,
          issuer: this.selectedIssuer || null,
          category: this.selectedCategory || null,
          minYear: this.minYear != null ? this.minYear : null,
          maxYear: this.maxYear != null ? this.maxYear : null,
          page: this.currentPage
        },
        queryParamsHandling: 'merge'
      });
    }
  }
  clearFilters() {
    this.searchName = '';
    this.selectedIssuer = '';
    this.selectedCategory = '';
    this.minYear = null;
    this.maxYear = null;
    this.currentPage = 1;
    this.applyFilters(true, true);
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

  get uniqueCategories(): string[] {
    return [...new Set(this.coins.map(c => c.category))];
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
}
