import { Component, OnInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listar',
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.css']
})
export class ListarComponent implements OnInit {

  loading: boolean = false;
  error: string | null = null;

  allAlbumCoins: any[] = [];
  albumCoins: any[] = [];

  selectedType: string = 'all'; // 'all' | 'coin' | 'banknote' | 'repeated'

  constructor(
    private coinsService: CoinsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getAlbum();
  }

  getAlbum(): void {
    this.loading = true;
    this.error = null;

    this.coinsService.getAlbumByUser().subscribe({
      next: (res) => {
        const coins = res || [];

        const grouped: { [key: number]: any } = {};
        for (const coin of coins) {
          if (!grouped[coin.coinId]) {
            grouped[coin.coinId] = {
              coinId: coin.coinId,
              title: coin.coinTitle || coin.title,
              obverse: coin.obverse,
              reverse: coin.reverse,
              category: (coin.category || '').toLowerCase(),
              years: []
            };
          }
          grouped[coin.coinId].years.push({
            year: coin.year,
            quantity: coin.quantity,
            condition: coin.condition
          });
        }

        this.allAlbumCoins = Object.values(grouped);
        this.applyFilters();

        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar álbum:', err);
        this.error = 'Erro ao carregar álbum.';
        this.loading = false;
      }
    });
  }

  setType(type: string): void {
    this.selectedType = type;
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.selectedType === 'all') {
      this.albumCoins = [...this.allAlbumCoins];
      return;
    }

    if (this.selectedType === 'coin' || this.selectedType === 'banknote') {
      this.albumCoins = this.allAlbumCoins.filter(c => c.category === this.selectedType);
      return;
    }

    if (this.selectedType === 'repeated') {
      // Filtra apenas anos com mais de 1 unidade e diminui 1 do valor
      this.albumCoins = this.allAlbumCoins
        .map(c => ({
          ...c,
          years: c.years
            .filter((y: any) => y.quantity > 1)
            .map((y: any) => ({
              ...y,
              quantity: y.quantity - 1 // diminui 1
            }))
        }))
        .filter(c => c.years.length > 0);
    }
  }

}
