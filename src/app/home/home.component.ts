import { Component, OnInit } from '@angular/core';
import { CoinService } from '../AuthService/coin.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  coins: any[] = [];

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
      },
      error: (err) => console.error('Erro ao carregar moedas:', err)
    });
  }

}
