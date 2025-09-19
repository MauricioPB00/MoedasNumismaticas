import { Component, OnInit } from '@angular/core';
import { CoinService } from '../AuthService/coin.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})export class HomeComponent implements OnInit {
  coins: any[] = [];
  filteredCoins: any[] = [];

  // paginação
  currentPage: number = 1;
  itemsPerPage: number = 24; // quantas moedas por página

  // filtros
  searchName: string = '';
  selectedIssuer: string = '';
  selectedCategory: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;

  constructor(
    private coinService: CoinService, 
    private router: Router,
    private route: ActivatedRoute ) {}

  ngOnInit(): void {
    this.loadCoins();
     this.route.queryParams.subscribe(params => {
    this.searchName = params['searchName'] || '';
    this.selectedIssuer = params['issuer'] || '';
    this.selectedCategory = params['category'] || '';
    this.minYear = params['minYear'] ? +params['minYear'] : null;
    this.maxYear = params['maxYear'] ? +params['maxYear'] : null;
    this.currentPage = params['page'] ? +params['page'] : 1;
  });
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

        const min = Math.min(...this.coins.map(c => c.min_year || Infinity));
        this.minYear = isFinite(min) ? min : null;

        this.applyFilters();
      },
      error: (err) => console.error('Erro ao carregar moedas:', err)
    });
  }

  applyFilters() {
    const coinsFiltered = this.coins.filter(coin => {
      const matchName = this.searchName
        ? coin.title.toLowerCase().includes(this.searchName.toLowerCase())
        : true;

      const matchIssuer = this.selectedIssuer
        ? coin.issuer === this.selectedIssuer
        : true;

      const matchCategory = this.selectedCategory
        ? coin.category === this.selectedCategory
        : true;

      const matchYear =
        (!this.minYear || coin.min_year >= this.minYear) &&
        (!this.maxYear || coin.max_year <= this.maxYear);

      return matchName && matchIssuer && matchCategory && matchYear;
    });

    this.filteredCoins = coinsFiltered;
    this.currentPage = 1; // volta sempre pra primeira página quando aplica filtros
  }

  // retorna só os itens da página atual
  get paginatedCoins() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCoins.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredCoins.length / this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
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
      searchName: this.searchName,
      issuer: this.selectedIssuer,
      category: this.selectedCategory,
      minYear: this.minYear,
      maxYear: this.maxYear,
      page: this.currentPage
    }
  });
}
}
