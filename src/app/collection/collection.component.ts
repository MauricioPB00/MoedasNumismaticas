import { Component, OnInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { CoinService } from '../AuthService/coin.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;
import { logoBase64 } from 'src/assets/logo';
import { LoadingService } from '../shared/loading.service';
import { AVAILABLE_COUNTRIES_CAD, CountryCAD } from '../models/countriesCAD';

interface Coin {
  id?: number;
  title?: string;
  category?: 'coin' | 'banknote' | string;
  issuer?: string;
  year?: number;
  min_year?: number;
  max_year?: number;
  obverse?: string;
  titleDisplay?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit {
  albumCoins: Coin[] = [];
  albumBanknotes: Coin[] = [];
  ownedCoinIds: Set<string> = new Set();
  ownedBanknoteIds: Set<string> = new Set();

  minYear?: number;
  maxYear?: number;

  countries: CountryCAD[] = AVAILABLE_COUNTRIES_CAD;
  activeCountry: string = 'Brasil';
  activeTab: 'coins' | 'banknotes' = 'coins';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSize = 70;

  countryData: { [country: string]: { coins: Coin[], banknotes: Coin[] } } = {};

  showFilters = false;
  showTabs = false;


  pagination: {
    [country: string]: {
      coins: {
        page: number;
        loaded: Coin[];
        loading: boolean;
        hasMore: boolean;
      };
      banknotes: {
        page: number;
        loaded: Coin[];
        loading: boolean;
        hasMore: boolean;
      };
    };
  } = {};

  constructor(
    private coinsService: CoinsService,
    private coinService: CoinService,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.loadingService.show();
    this.getAlbum();
    this.initializePagination(this.activeCountry);
    this.loadCountryData(this.activeCountry);
    this.loadingService.hide();
  }

  getAlbum(): void {
    this.loadingService.show();
    this.coinsService.getAlbumByUser().subscribe({
      next: (res: Coin[]) => {
        const album = res || [];
        this.albumCoins = album.filter(a => a.category === 'coin');
        this.albumBanknotes = album.filter(a => a.category === 'banknote');

        this.ownedCoinIds = new Set(this.albumCoins.map(a => String(a.id)));
        this.ownedBanknoteIds = new Set(this.albumBanknotes.map(a => String(a.id)));

        this.applyFilters();
      },
      error: err => console.error('Erro ao carregar álbum:', err)
    }).add(() => this.loadingService.hide());
  }

  loadCountryData(country: string): void {
    if (!this.pagination[country]) {
      this.initializePagination(country);
    }

    this.loadMore(country, 'coins');
    this.loadMore(country, 'banknotes');
  }

  private initializePagination(country: string): void {

    this.pagination[country] = {

      coins: {
        page: 1,
        loaded: [],
        loading: false,
        hasMore: true
      },
      banknotes: {
        page: 1,
        loaded: [],
        loading: false,
        hasMore: true
      }
    };

  }

  onCountryClick(country: string): void {
    if (this.activeCountry !== country) {
      this.activeCountry = country;
      if (!this.pagination[country]) {
        this.initializePagination(country);
      }
      this.loadCountryData(country);
    }
  }

  userHasCoin(coin: Coin): boolean {
    return this.ownedCoinIds.has(String(coin.id));
  }

  userHasBanknote(banknote: Coin): boolean {
    return this.ownedBanknoteIds.has(String(banknote.id));
  }

  applyFilters(): void {

    if (!this.activeCountry) {
      return;
    }

    this.pagination[this.activeCountry] = {
      coins: {
        page: 1,
        loaded: [],
        loading: false,
        hasMore: true
      },
      banknotes: {
        page: 1,
        loaded: [],
        loading: false,
        hasMore: true
      }
    };

    this.loadMore(this.activeCountry, 'coins');
    this.loadMore(this.activeCountry, 'banknotes');
  }

  private getYearValue(c: Coin): number {
    return c.year ?? c.min_year ?? c.max_year ?? 0;
  }

  filteredCoinsByCountry(country: string): Coin[] {
    const allCoins = this.countryData[country]?.coins || [];
    const minY = this.minYear ?? -Infinity;
    const maxY = this.maxYear ?? Infinity;
    return allCoins
      .filter(c => this.getYearValue(c) >= minY && this.getYearValue(c) <= maxY)
      .sort((a, b) => this.sortOrder === 'asc'
        ? this.getYearValue(a) - this.getYearValue(b)
        : this.getYearValue(b) - this.getYearValue(a));
  }

  filteredBanknotesByCountry(country: string): Coin[] {
    const allBanknotes = this.countryData[country]?.banknotes || [];
    const minY = this.minYear ?? -Infinity;
    const maxY = this.maxYear ?? Infinity;
    return allBanknotes
      .filter(c => this.getYearValue(c) >= minY && this.getYearValue(c) <= maxY)
      .sort((a, b) => this.sortOrder === 'asc'
        ? this.getYearValue(a) - this.getYearValue(b)
        : this.getYearValue(b) - this.getYearValue(a));
  }

  loadMore(
    country: string,
    type: 'coins' | 'banknotes'
  ): void {

    if (!this.pagination[country]) {
      this.initializePagination(country);
    }

    const pagination = this.pagination[country][type];

    if (pagination.loading || !pagination.hasMore) {
      return;
    }

    pagination.loading = true;

    this.coinService.getCoinsPdf({
      issuer: country,
      type: type,
      page: pagination.page,
      limit: this.pageSize,
      minYear: this.minYear,
      maxYear: this.maxYear
    }).subscribe({

      next: (response) => {

        const items = response.data.map((item: Coin) => ({
          ...item,
          categoryDisplay:
            item.category === 'coin'
              ? 'Moeda'
              : 'Cédula',

          showBrazilFlag:
            item.issuer === 'Brasil',

          titleDisplay:
            item.title
              ?.replace(/\s*\(.*?\)\s*/g, '')
              .split('-')[0]
              .trim()
        }));

        pagination.loaded.push(...items);
        pagination.page = response.page + 1;
        pagination.hasMore = response.hasMore;
      },

      error: (err) => {
        console.error(
          `Erro ao carregar ${type} de ${country}:`,
          err
        );
      },

      complete: () => {
        pagination.loading = false;
      }
    });
  }

  onScroll(
    event: any,
    country: string,
    type: 'coins' | 'banknotes'
  ): void {

    const div = event.target;

    if (
      div.scrollTop + div.clientHeight >=
      div.scrollHeight - 100
    ) {
      this.loadMore(country, type);
    }
  }

  getProgressByCountry(country: string, type: 'coins' | 'banknotes'): string {
    const all = type === 'coins'
      ? this.filteredCoinsByCountry(country)
      : this.filteredBanknotesByCountry(country);
    const owned = all.filter(c => type === 'coins' ? this.userHasCoin(c) : this.userHasBanknote(c)).length;
    return `${owned} / ${all.length}`;
  }

  getProgressPercentByCountry(country: string, type: 'coins' | 'banknotes'): number {
    const all = type === 'coins'
      ? this.filteredCoinsByCountry(country)
      : this.filteredBanknotesByCountry(country);
    if (!all.length) return 0;
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

  generateMissingYearsPDF(): void {
    if (!this.activeCountry) {
      alert('Selecione um país (tab) primeiro.');
      return;
    }

    const allItems = this.activeTab === 'coins'
      ? this.filteredCoinsByCountry(this.activeCountry)
      : this.filteredBanknotesByCountry(this.activeCountry);

    const ownedRanges: { id: number, start: number, end: number }[] = [];
    (this.albumCoins || []).forEach(a => {
      if (a.id != null) {
        const start = a.min_year ?? a.year ?? a.max_year ?? 0;
        const end = a.max_year ?? a.year ?? a.min_year ?? start;
        ownedRanges.push({ id: a.id, start, end });
      }
    });
    (this.albumBanknotes || []).forEach(a => {
      if (a.id != null) {
        const start = a.min_year ?? a.year ?? a.max_year ?? 0;
        const end = a.max_year ?? a.year ?? a.min_year ?? start;
        ownedRanges.push({ id: a.id, start, end });
      }
    });

    const globalMin = this.minYear ?? Math.min(...allItems.map(i => i.min_year ?? i.year ?? Number.MAX_SAFE_INTEGER));
    const globalMax = this.maxYear ?? Math.max(...allItems.map(i => i.max_year ?? i.year ?? 0));

    const entries: { title: string, years: { year: number, owned: boolean }[] }[] = [];

    allItems.forEach(item => {
      const start = Math.max(item.min_year ?? item.year ?? globalMin, globalMin);
      const end = Math.min(item.max_year ?? item.year ?? globalMax, globalMax);

      const years: { year: number, owned: boolean }[] = [];
      for (let y = start; y <= end; y++) {
        const owned = ownedRanges.some(r => r.id === item.id && y >= r.start && y <= r.end);
        years.push({ year: y, owned });
      }

      if (years.length) {
        entries.push({ title: item.title || `${item.id}`, years });
      }
    });

    const body: any[] = [
      [{ text: 'Item', style: 'tableHeader' }, { text: 'Anos', style: 'tableHeader' }]
    ];

    entries.forEach(e => {
      const maxPerLine = 10;
      const yearRows: any[] = [];

      for (let i = 0; i < e.years.length; i += maxPerLine) {
        const slice = e.years.slice(i, i + maxPerLine);
        const yearCells = slice.map(y => ({
          text: `[${y.year}]`,
          fillColor: y.owned ? '#ffe066' : null,
          margin: [1, 1, 1, 1],
          fontSize: 9,
          alignment: 'center'
        }));

        while (yearCells.length < maxPerLine) {
          yearCells.push({
            text: '',
            fillColor: null,
            margin: [1, 1, 1, 1],
            fontSize: 9,
            alignment: 'center'
          });
        }
        yearRows.push(yearCells);
      }
      body.push([
        { text: e.title, style: 'itemTitle' },
        {
          table: { body: yearRows, widths: Array(maxPerLine).fill('auto') },
          layout: { hLineWidth: () => 0, vLineWidth: () => 0 }
        }
      ]);
    });
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [20, 70, 20, 30],
      header: () => {
        return {
          stack: [
            {
              image: logoBase64,
              width: 30,
              alignment: 'center',
              margin: [0, 0, 0, 5]
            },
            { text: 'Álbum Numismático', fontSize: 14, bold: true, alignment: 'center' },
            { text: 'Organize, catalogue e explore o fascinante mundo das moedas.', fontSize: 8, alignment: 'center' },
            { text: 'www.albumnumismatico.com.br', fontSize: 8, alignment: 'center' }
          ],
          margin: [0, 5, 0, 10]
        };
      },
      content: [
        { text: this.activeCountry, style: 'header' },
        { text: this.activeTab === 'coins' ? 'Moedas' : 'Cédulas', style: 'subheader' },
        {
          table: { headerRows: 1, widths: ['30%', '70%'], body },
          layout: {
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#efbf04' : null,
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd'
          },
          margin: [0, 8, 0, 0]
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 6] },
        subheader: { fontSize: 13, bold: true, margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, color: '#111' },
        itemTitle: { fontSize: 11, margin: [0, 3, 0, 3] },
        yearsText: { fontSize: 10, margin: [0, 3, 0, 3] }
      }
    };
    pdfMake.createPdf(docDefinition).open();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    if (this.showFilters) this.showTabs = false;
  }

  toggleTabs() {
    this.showTabs = !this.showTabs;
    if (this.showTabs) this.showFilters = false;
  }

  get activeCountryCode(): string {
    const found = this.countries.find(c => c.name === this.activeCountry);
    return found ? found.code : '';
  }

}
