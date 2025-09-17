import { Component, OnInit } from '@angular/core';
import { CoinService } from '../AuthService/coin.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  coins: any[] = [];
  filteredCoins: any[] = [];

  // filtros
  searchName: string = '';
  selectedIssuer: string = '';
  selectedCategory: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;

  constructor(private coinService: CoinService) { }

  ngOnInit(): void {
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

      // Ordena da mais antiga para a mais recente
      this.coins.sort((a, b) => (a.min_year || 0) - (b.min_year || 0));

      // Define o filtro inicial de ano mínimo
      const min = Math.min(...this.coins.map(c => c.min_year || Infinity));
      this.minYear = isFinite(min) ? min : null;

      this.applyFilters();
    },
    error: (err) => console.error('Erro ao carregar moedas:', err)
  });
}

  applyFilters() {
    this.filteredCoins = this.coins.filter(coin => {
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
  }
  get uniqueIssuers(): string[] {
  return [...new Set(this.coins.map(c => c.issuer))];
}

get uniqueCategories(): string[] {
  return [...new Set(this.coins.map(c => c.category))];
}
}
