import { Component } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { CoinService } from '../AuthService/coin.service';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent {
  coins: any[] = [];
  banknotes: any[] = [];
  albumCoins: any[] = [];
  albumBanknotes: any[] = [];
  ownedCoinIds: Set<string> = new Set();
  ownedBanknoteIds: Set<string> = new Set();

  activeTab: 'coins' | 'banknotes' = 'coins';

  constructor(
    private coinsService: CoinsService,
    private coinService: CoinService,
  ) {}

  ngOnInit(): void {
    this.getAlbum();
    this.loadAll();
  }

  // --- ALBUM DO USUÁRIO ---
  getAlbum() {
    this.coinsService.getAlbumByUser().subscribe({
      next: (res) => {
        const album = res || [];
        this.albumCoins = album.filter((a: any) => a.category === 'coin');
        this.albumBanknotes = album.filter((a: any) => a.category === 'banknote');

        this.ownedCoinIds = new Set(this.albumCoins.map(a => String(a.id)));
        this.ownedBanknoteIds = new Set(this.albumBanknotes.map(a => String(a.id)));

        console.log('💿 Álbum moedas:', this.albumCoins);
        console.log('💵 Álbum cédulas:', this.albumBanknotes);
      },
      error: (err) => console.error('Erro ao carregar álbum:', err)
    });
  }

  // --- TODAS AS MOEDAS E CÉDULAS ---
  loadAll() {
    this.coinService.getCoins().subscribe({
      next: (data) => {
        const all = data.map(coin => ({
          ...coin,
          categoryDisplay: coin.category === 'coin' ? 'Moeda' : 'Cédula',
          showBrazilFlag: coin.issuer === 'Brasil'
        }));

        this.coins = all.filter(c => c.category === 'coin');
        this.banknotes = all.filter(c => c.category === 'banknote');

        console.log('🪙 Todas as moedas:', this.coins.length);
        console.log('💵 Todas as cédulas:', this.banknotes.length);
      },
      error: (err) => console.error('Erro ao carregar moedas/cédulas:', err)
    });
  }

  // --- VERIFICA SE O USUÁRIO POSSUI ---
  userHasCoin(coin: any): boolean {
    return this.ownedCoinIds.has(String(coin.id));
  }

  userHasBanknote(banknote: any): boolean {
    return this.ownedBanknoteIds.has(String(banknote.id));
  }

  // --- PROGRESSO ---
  getProgress(type: 'coins' | 'banknotes'): string {
    const all = type === 'coins' ? this.coins : this.banknotes;
    const owned = all.filter(c => type === 'coins' ? this.userHasCoin(c) : this.userHasBanknote(c)).length;
    return `${owned} / ${all.length}`;
  }

  getProgressPercent(type: 'coins' | 'banknotes'): number {
    const all = type === 'coins' ? this.coins : this.banknotes;
    if (all.length === 0) return 0;
    const owned = all.filter(c => type === 'coins' ? this.userHasCoin(c) : this.userHasBanknote(c)).length;
    return Math.round((owned / all.length) * 100);
  }
}
