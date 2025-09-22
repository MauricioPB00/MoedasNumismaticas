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
    this.selectedCondition = 'Todas condições'; // 🔹 volta pro default
    this.filteredCoins = [...this.albumCoins];
  }

  viewCoin(coinId: number): void {
    this.router.navigate(['/coin', coinId]);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/placeholder.png';
  }
}
