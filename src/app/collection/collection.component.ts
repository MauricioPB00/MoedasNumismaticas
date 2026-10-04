import { Component, OnInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { CoinService } from '../AuthService/coin.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;
import { logoBase64 } from 'src/assets/logo';
import { firstValueFrom } from 'rxjs';
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
        total: number;
      };
      banknotes: {
        page: number;
        loaded: Coin[];
        loading: boolean;
        hasMore: boolean;
        total: number;
      };
    };
  } = {};

  constructor(
    private coinsService: CoinsService,
    private coinService: CoinService,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.initializePagination(this.activeCountry);
    this.getAlbum();
    this.loadCountryData(this.activeCountry);
  }

  getAlbum(): void {
    this.loadingService.show();

    this.coinsService.getAlbumByUser().subscribe({
      next: (res: Coin[]) => {
        const album = res || [];

        this.albumCoins = album.filter(
          a => a.category === 'coin'
        );

        this.albumBanknotes = album.filter(
          a => a.category === 'banknote'
        );

        this.ownedCoinIds = new Set(
          this.albumCoins.map(a => String(a.id))
        );

        this.ownedBanknoteIds = new Set(
          this.albumBanknotes.map(a => String(a.id))
        );
      },

      error: err => {
        console.error('Erro ao carregar álbum:', err);
      }
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
        hasMore: true,
        total: 0
      },

      banknotes: {
        page: 1,
        loaded: [],
        loading: false,
        hasMore: true,
        total: 0
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

    this.initializePagination(this.activeCountry);

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
      maxYear: this.maxYear,
      sort: this.sortOrder
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
        pagination.total = response.total;
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

  getProgressByCountry(
    country: string,
    type: 'coins' | 'banknotes'
  ): string {

    const pagination = this.pagination[country]?.[type];

    if (!pagination) {
      return '0 / 0';
    }

    const album = type === 'coins'
      ? this.albumCoins
      : this.albumBanknotes;

    const minY = this.minYear ?? -Infinity;
    const maxY = this.maxYear ?? Infinity;

    const owned = album.filter(item => {

      if (item.issuer !== country) {
        return false;
      }

      const itemMin =
        item.min_year ??
        item.year ??
        item.max_year ??
        0;

      const itemMax =
        item.max_year ??
        item.year ??
        item.min_year ??
        itemMin;

      return itemMax >= minY && itemMin <= maxY;

    }).length;

    return `${owned} / ${pagination.total}`;
  }

  getProgressPercentByCountry(
    country: string,
    type: 'coins' | 'banknotes'
  ): number {

    const pagination = this.pagination[country]?.[type];

    if (!pagination || pagination.total === 0) {
      return 0;
    }

    const album = type === 'coins'
      ? this.albumCoins
      : this.albumBanknotes;

    const minY = this.minYear ?? -Infinity;
    const maxY = this.maxYear ?? Infinity;

    const owned = album.filter(item => {

      if (item.issuer !== country) {
        return false;
      }

      const itemMin =
        item.min_year ??
        item.year ??
        item.max_year ??
        0;

      const itemMax =
        item.max_year ??
        item.year ??
        item.min_year ??
        itemMin;

      return itemMax >= minY && itemMin <= maxY;

    }).length;

    return Math.round(
      (owned / pagination.total) * 100
    );
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

  async generateMissingYearsPDF(): Promise<void> {
  if (!this.activeCountry) {
    alert('Selecione um país (tab) primeiro.');
    return;
  }
 
  this.loadingService.show();
 
  try {
    const type: 'coins' | 'banknotes' =
      this.activeTab === 'coins' ? 'coins' : 'banknotes';
    const typeLabel = type === 'coins' ? 'Moedas' : 'Cédulas';
 
    // ---------- 1) busca todas as páginas ----------
    const allItems: Coin[] = [];
    const pdfPageSize = 100; // o backend permite no máximo 100
    let page = 1;
    let hasMore = true;
 
    while (hasMore) {
      const response = await firstValueFrom(
        this.coinService.getCoinsPdf({
          issuer: this.activeCountry,
          type,
          page,
          limit: pdfPageSize,
          minYear: this.minYear,
          maxYear: this.maxYear,
          sort: this.sortOrder
        })
      );
 
      const items = (response.data || []).map((item: Coin) => ({
        ...item,
        titleDisplay: item.title
          ?.replace(/\s*\(.*?\)\s*/g, '')
          .split('-')[0]
          .trim()
      }));
 
      allItems.push(...items);
      hasMore = response.hasMore;
      page++;
    }
 
    if (!allItems.length) {
      alert(`Nenhum item encontrado para ${this.activeCountry}.`);
      return;
    }
 
    // ---------- 2) anos que o usuário tem, por item ----------
    const albumItems = type === 'coins' ? this.albumCoins : this.albumBanknotes;
    const ownedYearsById = new Map<number, Set<number>>();
 
    (albumItems || []).forEach(a => {
      if (a.id == null) return;
 
      // se a peça do álbum tem um ano específico, conta só ele;
      // senão usa o intervalo min/max
      const start = a.year ?? a.min_year ?? a.max_year;
      const end = a.year ?? a.max_year ?? a.min_year;
      if (start == null || end == null) return;
 
      const id = Number(a.id);
      const set = ownedYearsById.get(id) ?? new Set<number>();
      for (let y = Number(start); y <= Number(end); y++) set.add(y);
      ownedYearsById.set(id, set);
    });
 
    // ---------- 3) intervalo global de anos ----------
    const minYears = allItems
      .map(i => i.min_year ?? i.year ?? i.max_year)
      .filter((y): y is number => y != null && Number.isFinite(y));
    const maxYears = allItems
      .map(i => i.max_year ?? i.year ?? i.min_year)
      .filter((y): y is number => y != null && Number.isFinite(y));
 
    const globalMin = this.minYear ?? (minYears.length ? Math.min(...minYears) : 0);
    const globalMax = this.maxYear ?? (maxYears.length ? Math.max(...maxYears) : globalMin);
 
    // ---------- 4) monta as linhas ----------
    interface YearInfo { year: number; owned: boolean; }
    interface Entry { title: string; years: YearInfo[]; ownedCount: number; }
 
    const entries: Entry[] = [];
 
    allItems.forEach(item => {
      const itemMin = item.min_year ?? item.year ?? item.max_year ?? globalMin;
      const itemMax = item.max_year ?? item.year ?? item.min_year ?? itemMin;
 
      const start = Math.max(itemMin, globalMin);
      const end = Math.min(itemMax, globalMax);
      if (start > end) return;
 
      const ownedSet = ownedYearsById.get(Number(item.id));
      const years: YearInfo[] = [];
 
      for (let year = start; year <= end; year++) {
        years.push({ year, owned: !!ownedSet && ownedSet.has(year) });
      }
 
      if (years.length) {
        entries.push({
          title: item.titleDisplay || item.title || `${item.id}`,
          years,
          ownedCount: years.filter(y => y.owned).length
        });
      }
    });
 
    const totalYears = entries.reduce((s, e) => s + e.years.length, 0);
    const ownedYears = entries.reduce((s, e) => s + e.ownedCount, 0);
    const missingYears = totalYears - ownedYears;
    const percent = totalYears ? Math.round((ownedYears / totalYears) * 100) : 0;
 
    // ---------- 5) estilo ----------
    const INK = '#15120f';
    const COPPER = '#d2703f';
    const PATINA = '#2f7566';
    const PAPER = '#f7f5f0';
    const LINE = '#e2ded6';
    const MUTED = '#7b766d';
    const CONTENT_W = 555; // A4 (595) menos as margens de 20 + 20
    const YEARS_PER_ROW = 10;
 
    const today = new Date().toLocaleDateString('pt-BR');
    const periodText =
      globalMin && globalMax ? `Período: ${globalMin} – ${globalMax}` : 'Todos os períodos';
 
    // pequena barra de progresso desenhada com canvas
    const bar = (width: number, height: number, pct: number, color: string) => {
      const canvas: any[] = [
        { type: 'rect', x: 0, y: 0, w: width, h: height, r: height / 2, color: '#e6e2d9' }
      ];
      const fill = (width * pct) / 100;
      if (fill > 0) {
        canvas.push({
          type: 'rect', x: 0, y: 0,
          w: Math.max(fill, height), h: height, r: height / 2, color
        });
      }
      return { canvas };
    };
 
    // ---------- 6) tabela principal ----------
    const body: any[] = [
      [
        { text: 'Item', style: 'tableHeader' },
        { text: 'Anos', style: 'tableHeader' }
      ]
    ];
 
    entries.forEach(entry => {
      const yearRows: any[] = [];
 
      for (let i = 0; i < entry.years.length; i += YEARS_PER_ROW) {
        const slice = entry.years.slice(i, i + YEARS_PER_ROW);
 
        const cells: any[] = slice.map(y => ({
          text: String(y.year),
          fontSize: 8.5,
          alignment: 'center',
          bold: y.owned,
          color: y.owned ? '#ffffff' : INK,
          fillColor: y.owned ? COPPER : null
        }));
 
        // completa a última linha com células vazias
        while (cells.length < YEARS_PER_ROW) {
          cells.push({ text: '', fontSize: 8.5 });
        }
 
        yearRows.push(cells);
      }
 
      const pct = Math.round((entry.ownedCount / entry.years.length) * 100);
      const complete = entry.ownedCount === entry.years.length;
 
      body.push([
        {
          stack: [
            { text: entry.title, style: 'itemTitle' },
            {
              text: complete
                ? 'Completa'
                : `${entry.ownedCount} de ${entry.years.length} anos`,
              fontSize: 8,
              color: complete ? PATINA : MUTED,
              bold: complete,
              margin: [0, 2, 0, 4]
            },
            bar(90, 3, pct, complete ? PATINA : COPPER)
          ]
        },
        {
          table: {
            widths: Array(YEARS_PER_ROW).fill(36),
            body: yearRows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => LINE,
            vLineColor: () => LINE,
            paddingTop: () => 3,
            paddingBottom: () => 3,
            paddingLeft: () => 0,
            paddingRight: () => 0
          }
        }
      ]);
    });
 
    // ---------- 7) documento ----------
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [20, 70, 20, 40],
 
      info: {
        title: `Faltantes - ${this.activeCountry} - ${typeLabel}`,
        author: 'Álbum Numismático'
      },
 
      defaultStyle: { font: 'Roboto', color: INK },
 
      header: () => ({
        margin: [20, 18, 20, 0],
        stack: [
          {
            columns: [
              { image: logoBase64, width: 26 },
              {
                width: '*',
                margin: [8, 1, 0, 0],
                stack: [
                  { text: 'Álbum Numismático', fontSize: 13, bold: true, color: INK },
                  {
                    text: 'Organize, catalogue e explore o fascinante mundo das moedas.',
                    fontSize: 7.5,
                    color: MUTED
                  }
                ]
              },
              {
                width: 'auto',
                margin: [0, 8, 0, 0],
                text: 'www.albumnumismatico.com.br',
                fontSize: 8,
                color: COPPER
              }
            ]
          },
          {
            margin: [0, 8, 0, 0],
            canvas: [{ type: 'rect', x: 0, y: 0, w: CONTENT_W, h: 2, color: COPPER }]
          }
        ]
      }),
 
      footer: (currentPage: number, pageCount: number) => ({
        margin: [20, 12, 20, 0],
        columns: [
          { text: `Gerado em ${today}`, fontSize: 8, color: MUTED },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            fontSize: 8,
            color: MUTED,
            alignment: 'right'
          }
        ]
      }),
 
      content: [
        // título
        { text: this.activeCountry, fontSize: 28, bold: true, color: INK },
        {
          text: `Faltantes · ${typeLabel}`,
          fontSize: 12,
          bold: true,
          color: COPPER,
          margin: [0, 2, 0, 2]
        },
        { text: periodText, fontSize: 8.5, color: MUTED, margin: [0, 0, 0, 14] },
 
        // resumo em 4 blocos
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [[
              {
                stack: [
                  { text: 'ANOS NO CATÁLOGO', style: 'statLabel' },
                  { text: String(totalYears), style: 'statValue' }
                ]
              },
              {
                stack: [
                  { text: 'TENHO', style: 'statLabel' },
                  { text: String(ownedYears), style: 'statValue', color: PATINA }
                ]
              },
              {
                stack: [
                  { text: 'FALTAM', style: 'statLabel' },
                  { text: String(missingYears), style: 'statValue', color: COPPER }
                ]
              },
              {
                stack: [
                  { text: 'COMPLETO', style: 'statLabel' },
                  { text: `${percent}%`, style: 'statValue' }
                ]
              }
            ]]
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            fillColor: () => PAPER,
            paddingLeft: () => 14,
            paddingRight: () => 8,
            paddingTop: () => 10,
            paddingBottom: () => 10
          }
        },
 
        // barra de progresso geral
        { ...bar(CONTENT_W, 6, percent, PATINA), margin: [0, 10, 0, 10] },
 
        // legenda
        {
          columns: [
            { width: 12, margin: [0, 1, 0, 0], canvas: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, color: COPPER }] },
            { width: 'auto', text: 'Tenho', fontSize: 8.5, margin: [4, 1, 14, 0] },
            {
              width: 12,
              margin: [0, 1, 0, 0],
              canvas: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, lineWidth: 0.8, lineColor: '#b9b4a8' }]
            },
            { width: 'auto', text: 'Falta', fontSize: 8.5, margin: [4, 1, 0, 0] }
          ],
          margin: [0, 0, 0, 12]
        },
 
        // tabela de itens
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            keepWithHeaderRows: 1,
            widths: [150, '*'],
            body
          },
          layout: {
            fillColor: (rowIndex: number) =>
              rowIndex === 0 ? INK : rowIndex % 2 === 0 ? PAPER : null,
            hLineWidth: (i: number) => (i === 0 || i === 1 ? 0 : 0.5),
            vLineWidth: () => 0,
            hLineColor: () => LINE,
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: () => 7,
            paddingBottom: () => 7
          }
        }
      ],
 
      styles: {
        tableHeader: { bold: true, color: '#ffffff', fontSize: 9 },
        itemTitle: { fontSize: 10.5, bold: true },
        statLabel: { fontSize: 7, color: MUTED, characterSpacing: 0.6 },
        statValue: { fontSize: 22, bold: true, margin: [0, 2, 0, 0] }
      }
    };
 
    const fileName = `faltantes-${this.activeCountry}-${typeLabel}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
 
    // .download() é mais confiável que .open() (pop-up bloqueado depois de await)
    pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
    // Para abrir numa nova aba em vez de baixar: pdfMake.createPdf(docDefinition).open();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Não foi possível gerar o PDF. Verifique o console para mais detalhes.');
  } finally {
    this.loadingService.hide();
  }
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
