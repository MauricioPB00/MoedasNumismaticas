import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CoinsService } from '../AuthService/coins.service';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../shared/loading.service';
import { AVAILABLE_COUNTRIES_CAD } from '../models/countriesCAD';

@Component({
  selector: 'app-coin',
  templateUrl: './coin.component.html',
  styleUrls: ['./coin.component.css']
})
export class CoinComponent implements OnInit {
  coin: any;
  searchName: string = '';
  selectedIssuer: string = '';
  selectedCategory: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;
  years: number[] = [];
  coinEntries: { year: number; quantity: number | null; condition: string | null }[] = [];
  albumCoins: any[] = [];
  uniqueConditions: string[] = [];
  showModal = false;

  editing = false;
  isNew = false;
  editingType: 'coin' | 'banknote' | null = null;
  editData: any = {
    year_info: '',
    mintage: '',
    prices: {
      'R/BC': '',
      'BC': '',
      'MBC': '',
      'SOB': '',
      'S/FDC': '',
      'FE': ''
    }
  };

  sideLabels: Record<'obverse' | 'reverse', string> = {
    obverse: 'Anverso',
    reverse: 'Reverso'
  };

  sides: Array<'obverse' | 'reverse'> = ['reverse', 'obverse'];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private coinsService: CoinsService,
    private toastr: ToastrService,
    private loadingService: LoadingService,
  ) { }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadingService.show();
      this.loadCoin(id);
      this.loadingService.hide();
    }
  }

  loadCoin(id: number): void {
    this.coinsService.getCoin(id).subscribe({
      next: (coin) => {
        const country = AVAILABLE_COUNTRIES_CAD.find(
          c => c.name.toLowerCase() === coin.issuer?.name?.toLowerCase()
        );
        this.coin = {
          ...coin,
          categoryDisplay: coin.category === 'coin' ? 'Moeda' : coin.category,
          flagCode: country ? country.code : 'un'
        };

        this.minYear = this.coin.minYear ?? null;
        this.maxYear = this.coin.maxYear ?? null;

        this.coinEntries = [];
        if (this.minYear !== null && this.maxYear !== null) {
          for (let y = this.minYear; y <= this.maxYear; y++) {
            this.coinEntries.push({
              year: y,
              quantity: null,
              condition: null
            });
          }
        }
      },
      error: (err) => {
        console.error('Erro ao carregar moeda:', err);
        this.loadingService.hide();
      }
    });
    this.loadingService.hide();
  }

  formatValue(coin: any): string | null {
    return coin?.valueFullName || coin?.valueText || (coin?.valueNumeric ? `${coin.valueNumeric} ${coin.currencyName || coin.currency || ''}` : null);
  }

  getPrice(prices: any[], grade: string): string {
    if (!prices || !prices.length) return '-';

    const gradeMap: Record<string, string> = {
      'FE': 'FDC',
      'SOB/FE': 'S/FDC'
    };

    const normalizedGrade = gradeMap[grade] || grade;

    const priceObj = prices.find(
      p => p.grade?.toUpperCase().trim() === normalizedGrade.toUpperCase().trim()
    );

    if (!priceObj || priceObj.price == null) return '-';

    const value = parseFloat(priceObj.price);
    if (isNaN(value)) return '-';

    const valorEmReais = value * 1;
    return valorEmReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }


  shouldDisplayRow(info: any): boolean {
    if (!info) return false;

    const hasMintage = info.mintage && info.mintage !== '-';

    const hasValidPrice =
      info.prices &&
      info.prices.some(
        (p: any) => p && p.price && p.price !== '-' && p.price !== ''
      );

    return hasMintage || hasValidPrice;
  }

  editInfo(entityType: 'coin' | 'banknote', info: any) {
  this.editing = true;
  this.isNew = false;
  this.editingType = entityType;  // <-- AGORA FUNCIONA

  const gradeList = ["R/BC", "BC", "MBC", "SOB", "S/FDC", "FE", "FDC"];

  const pricesObj: any = {};
  gradeList.forEach(g => pricesObj[g] = '');

  if (Array.isArray(info.prices)) {
    info.prices.forEach((p: any) => {
      pricesObj[p.grade] = p.price ?? '';
    });
  }

  this.editData = {
    ...info,
    prices: pricesObj
  };
}




  addNewInfo(type: 'coin' | 'banknote') {
    this.editing = true;
    this.isNew = true;
    this.editingType = type;

    this.editData = {
      year_info: '',
      mintage: '',
      prices: {
        'R/BC': '',
        'BC': '',
        'MBC': '',
        'SOB': '',
        'S/FDC': '',
        'FDC': ''
      }
    };
  }


  cancel() {
    this.editing = false;
  }


 saveInfo() {
  const pricesArray = Object.keys(this.editData.prices).map(grade => {
    let val = this.editData.prices[grade];

    if (val === '' || val === null || val === undefined) {
      val = null;
    } else {
      val = Number(val);
      if (isNaN(val)) val = null;
    }

    return { grade, price: val };
  });
  
  const payload = {
    entityType: this.editingType, // <--- OBRIGATÓRIO
    ...this.editData,
    prices: pricesArray
  };

  this.coinsService.saveCoinInfo(this.coin.id, payload).subscribe({
    next: () => {
      if (this.editingType === 'coin' && this.isNew)
        this.coin.coinInfo.push(this.editData);

      if (this.editingType === 'banknote' && this.isNew)
        this.coin.banknoteInfo.push(this.editData);

      this.editing = false;

    }
  });
}




}
