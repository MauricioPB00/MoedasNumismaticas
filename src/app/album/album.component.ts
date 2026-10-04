import { Component, OnInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { Router } from '@angular/router';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;

import { logoBase64 } from 'src/assets/logo';

import { LoadingService } from '../shared/loading.service';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.css']
})
export class AlbumComponent implements OnInit {

  albumCoins: any[] = [];
  filteredCoins: any[] = [];
  pagedCoins: any[] = [];

  loading: boolean = false;
  error: string | null = null;

  searchName: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;
  uniqueConditions: string[] = [];
  selectedCondition: string = 'Todas condições';

  groupByYear: boolean = false;
  groupByCoinId: boolean = false;

  showCoins: boolean = true;
  showBanknotes: boolean = true;

  currentPage = 1;
  itemsPerPage = 30;
  totalPages = 0;

  showModal = false;
  coinEntries: { year: number; quantity: number | null; condition: string | null, id: number, type: string }[] = [];
  coin: any;

  sortOrder: 'asc' | 'desc' = 'asc';

  selectedIssuer: string = '';
  uniqueIssuers: string[] = [];

  showPriceModal = false;

  showModalPDF: boolean = false;
  selectedPDFType: 'all' | 'coins' | 'banknotes' | 'repeated' = 'all';

  showModalInsignia = false;

  selectedPDFCountry: string = 'all';

  showOnlyRepeated: boolean = false;

  showFilters = false;
  showFilters2 = false;

  constructor(
    private coinsService: CoinsService,
    private router: Router,
    private loadingService: LoadingService,
  ) { }

  ngOnInit(): void {
    this.getAlbum();
  }

  getAlbum(): void {
    this.loadingService.show();
    this.loading = true;
    this.error = null;

    this.coinsService.getAlbumByUser().subscribe({
      next: (res) => {
        this.albumCoins = res || [];

        const conds = [...new Set(
          this.albumCoins
            .map((item: any) => item.condition)
            .filter((c: string | null) => c != null && String(c).trim() !== '')
        )] as string[];

        this.uniqueConditions = ['Todas condições', ...conds];
        this.selectedCondition = 'Todas condições';

        this.uniqueIssuers = Array.from(
          new Set(this.albumCoins
            .map((item: any) => item.issuer)
            .filter(Boolean))
        ).sort();
        this.selectedIssuer = '';

        this.applyFilters();

        setTimeout(() => {
          this.loading = false;
          this.loadingService.hide();
        });

        this.loading = false;
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Erro ao carregar álbum:', err);
        this.error = 'Erro ao carregar álbum.';
        this.loading = false;
        this.loadingService.hide();
      }
    });
  }

  private getBaseFilteredCoins(): any[] {
    return this.albumCoins.filter((item: any) => {
      const name = (item.title || '').toLowerCase();
      const matchesName = this.searchName
        ? name.includes(this.searchName.toLowerCase())
        : true;

      const matchesMinYear = this.minYear ? (item.year ?? 0) >= this.minYear : true;
      const matchesMaxYear = this.maxYear ? (item.year ?? 0) <= this.maxYear : true;

      const matchesCondition = this.selectedCondition !== 'Todas condições'
        ? (item.condition ?? '') === this.selectedCondition
        : true;

      const matchesCategory =
        (this.showCoins && item.category === 'coin') ||
        (this.showBanknotes && item.category === 'banknote');

      const matchesIssuer = this.selectedIssuer ? item.issuer === this.selectedIssuer : true;

      return matchesName && matchesMinYear && matchesMaxYear && matchesCondition && matchesCategory && matchesIssuer;
    });
  }

  applyFilters(): void {
    if (this.groupByCoinId) {
      this.applyFiltersGroup();
    } else if (this.groupByYear) {
      this.applyFiltersGroupByYear();
    } else {
      this.filteredCoins = this.getBaseFilteredCoins();
    }

    if (this.showOnlyRepeated) {
      this.filteredCoins = this.filteredCoins
        .filter((item: any) => (item.quantityTotal || item.quantity || 0) >= 2)
        .map((item: any) => ({
          ...item,
          quantityDisplay: (item.quantityTotal || item.quantity) - 1
        }));
    }
    if (this.sortOrder === 'asc') {
      this.filteredCoins.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else {
      this.filteredCoins.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    this.updatePagination();
  }

  applyFiltersGroupByYear(): void {
    const items = this.getBaseFilteredCoins();
    const map = new Map<string, any>();

    items.forEach(item => {
      const key = `${item.category}_${item.id}_${item.year}`;
      const qty = Number(item.quantity) || 0;
      const cond = (item.condition === null || item.condition === undefined || String(item.condition).trim() === '')
        ? '—'
        : String(item.condition).trim();

      if (!map.has(key)) {
        map.set(key, {
          ...item,
          quantity: qty,
          conditions: [{ type: cond, quantity: qty }],
          years: [item.year]
        });
      } else {
        const group = map.get(key);
        group.quantity = (Number(group.quantity) || 0) + qty;

        const idx = group.conditions.findIndex((x: any) => x.type === cond);
        if (idx >= 0) {
          group.conditions[idx].quantity += qty;
        } else {
          group.conditions.push({ type: cond, quantity: qty });
        }
      }
    });

    const grouped = Array.from(map.values()).map(g => {
      g.conditions.sort((a: any, b: any) => (b.quantity || 0) - (a.quantity || 0));

      g.conditionsSummary = g.conditions
        .map((cond: any) => {
          if (!cond.type || cond.type === '—') {
            return `(${cond.quantity})`;
          }
          return `(${cond.quantity} ${cond.type})`;
        })
        .join(' – ');

      g.yearsSummary = (g.years || []).sort((a: any, b: any) => a - b).join(', ');
      g.quantityTotal = Number(g.quantity) || 0;

      g.condition = g.conditionsSummary;

      return g;
    });

    this.filteredCoins = grouped;
    this.updatePagination();
  }



  toggleGroupByCoinId(): void {
    if (this.groupByCoinId) {
      this.groupByYear = false;
      this.showOnlyRepeated = false;
    }
    this.applyFilters();
  }

  toggleGroupByYear(): void {
    if (this.groupByYear) {
      this.groupByCoinId = false;
    }
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  onRepeatedChange() {
    if (this.showOnlyRepeated) {
      this.groupByYear = true;
      this.groupByCoinId = false;
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchName = '';
    this.minYear = null;
    this.maxYear = null;
    this.selectedCondition = 'Todas condições';
    this.showCoins = true;
    this.showBanknotes = true;
    this.groupByCoinId = false;
    this.applyFilters();
  }

  viewItem(item: any): void {
    if (item.category === 'coin') {
      this.router.navigate(['/coin', item.id]);
    } else if (item.category === 'banknote') {
      this.router.navigate(['/coin', item.id]);
    }
  }

  viewCoin(id: number, type: 'coin' | 'banknote'): void {
    if (type === 'coin') {
      this.router.navigate(['/coin', id]);
    } else {
      this.router.navigate(['/coin', id]);
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/placeholder.png';
  }

  applyFiltersGroup(): void {
    const items = this.getBaseFilteredCoins();
    const map = new Map<string, any>();

    items.forEach(item => {
      const key = `${item.category}_${item.id}`;
      const qty = Number(item.quantity) || 0;
      const cond = (item.condition === null || item.condition === undefined || String(item.condition).trim() === '')
        ? '—'
        : String(item.condition);

      if (!map.has(key)) {
        map.set(key, {
          ...item,
          quantity: qty,
          conditions: [{ type: cond, quantity: qty }],
          years: item.year ? [item.year] : []
        });
      } else {
        const group = map.get(key);
        group.quantity = (Number(group.quantity) || 0) + qty;

        const idx = group.conditions.findIndex((x: any) => x.type === cond);
        if (idx >= 0) {
          group.conditions[idx].quantity = (Number(group.conditions[idx].quantity) || 0) + qty;
        } else {
          group.conditions.push({ type: cond, quantity: qty });
        }

        if (item.year && !group.years.includes(item.year)) {
          group.years.push(item.year);
        }
      }
    });

    const grouped = Array.from(map.values()).map(g => {
      g.conditions.sort((a: any, b: any) => (b.quantity || 0) - (a.quantity || 0));
      g.conditionsSummary = g.conditions
        .map((cond: any) => {
          if (!cond.type || cond.type === '—') {
            return `(${cond.quantity})`;
          }
          return `(${cond.quantity} ${cond.type})`;
        })
        .join(' – ');
      g.yearsSummary = (g.years || []).sort((a: any, b: any) => a - b).join(', ');
      g.quantityTotal = Number(g.quantity) || 0;
      return g;
    });

    this.filteredCoins = grouped;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCoins.length / this.itemsPerPage);
    if (this.totalPages === 0) {
      this.currentPage = 1;
      this.pagedCoins = [];
      return;
    }
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedCoins = this.filteredCoins.slice(start, end);
  }

  applyCoinsFilter(value?: boolean): void {
    if (typeof value === 'boolean') {
      this.showCoins = value;
    }
    this.applyFilters();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  abrirModal(event: Event, itemId: number, type: 'coin' | 'banknote'): void {
    event.stopPropagation();
    (event.target as HTMLElement).blur();

    this.coin = this.albumCoins.find(c => c.id === itemId && c.type === type);

    if (!this.coin) {
      console.error('Item não encontrado no álbum:', { itemId, type });
      return;
    }

    this.coinEntries = [];
    if (this.coin.minYear != null && this.coin.maxYear != null) {
      for (let y = this.coin.minYear; y <= this.coin.maxYear; y++) {
        this.coinEntries.push({
          year: y,
          quantity: null,
          condition: null,
          id: this.coin.id,
          type: this.coin.type
        });
      }
    } else {
      this.coinEntries.push({
        year: this.coin.year,
        quantity: null,
        condition: null,
        id: this.coin.id,
        type: this.coin.type
      });
    }

    this.showModal = true;

  }

  openModalPrice() {
    this.showPriceModal = true;
  }

  openModalInsignia() {
    this.showModalInsignia = true;
  }

  openModalPDF(): void {
    this.showModalPDF = true;
  }

  closeModalPDF(): void {
    this.showModalPDF = false;
  }

  gerarPDF(): void {
    // ---------- cores ----------
    const INK = '#15120f';
    const COPPER = '#d2703f';
    const PAPER = '#f7f5f0';
    const LINE = '#e2ded6';
    const MUTED = '#7b766d';
    const CONTENT_W = 555; // A4 (595) menos as margens 20 + 20

    const typeLabels: { [key: string]: string } = {
      all: 'Tudo',
      coins: 'Moedas',
      banknotes: 'Cédulas',
      repeated: 'Repetidas'
    };
    const typeLabel = typeLabels[this.selectedPDFType] ?? 'Coleção';
    const countryLabel =
      this.selectedPDFCountry && this.selectedPDFCountry !== 'all'
        ? this.selectedPDFCountry
        : 'Todos os países';

    // ---------- 1) filtra os itens ----------
    // normaliza o país (itens sem país viram "Desconhecido")
    let itemsToPrint: any[] = (this.albumCoins || []).map((i: any) => ({
      ...i,
      issuerName: i.issuer || 'Desconhecido'
    }));

    if (this.selectedPDFType === 'coins') {
      itemsToPrint = itemsToPrint.filter(i => i.category === 'coin');
    } else if (this.selectedPDFType === 'banknotes') {
      itemsToPrint = itemsToPrint.filter(i => i.category === 'banknote');
    } else if (this.selectedPDFType === 'repeated') {
      // repetida = o que passa de 1 unidade (desconta 1 do total e de cada ano)
      itemsToPrint = itemsToPrint
        .map(i => {
          if (i.years && i.years.length) {
            const years = i.years
              .filter((y: any) => Number(y.quantity) > 1)
              .map((y: any) => ({ ...y, quantity: Number(y.quantity) - 1 }));
            if (!years.length) return null;
            const total = years.reduce((s: number, y: any) => s + Number(y.quantity), 0);
            return { ...i, years, quantity: total };
          }
          return Number(i.quantity) > 1 ? { ...i, quantity: Number(i.quantity) - 1 } : null;
        })
        .filter((i: any) => i !== null);
    }

    if (this.selectedPDFCountry && this.selectedPDFCountry !== 'all') {
      itemsToPrint = itemsToPrint.filter(i => i.issuerName === this.selectedPDFCountry);
    }

    if (!itemsToPrint.length) {
      alert('Nenhum item encontrado para os filtros escolhidos.');
      return;
    }

    // ---------- 2) funções de apoio ----------
    interface Row { year: string; quantity: number; condition: string; }

    // linhas de ano de um item (ordenadas por ano)
    const rowsOf = (item: any): Row[] => {
      const list: any[] =
        item.years && item.years.length
          ? item.years
          : [{ year: item.year, quantity: item.quantity ?? 1, condition: item.condition }];

      return list
        .map((y: any) => ({
          year: y.year != null && y.year !== '' ? String(y.year) : '-',
          quantity: Number(y.quantity ?? 0) || 0,
          condition: y.condition || '-'
        }))
        .sort((a: Row, b: Row) => (Number(a.year) || 0) - (Number(b.year) || 0));
    };

    const piecesOf = (item: any): number =>
      rowsOf(item).reduce((s, r) => s + r.quantity, 0);

    const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

    // tabela de uma seção (Item | Ano · Qtd · Condição)
    const buildTable = (list: any[]) => {
      const body: any[] = [
        [
          { text: 'Item', style: 'th' },
          { text: 'Anos, quantidade e condição', style: 'th' }
        ]
      ];

      list.forEach(item => {
        const rows = rowsOf(item);
        const pieces = rows.reduce((s, r) => s + r.quantity, 0);

        const inner: any[] = [
          [
            { text: 'ANO', style: 'mini' },
            { text: 'QTD', style: 'mini', alignment: 'center' },
            { text: 'CONDIÇÃO', style: 'mini', alignment: 'center' }
          ]
        ];

        rows.forEach(r => {
          inner.push([
            { text: r.year, fontSize: 9.5, bold: true },
            {
              text: String(r.quantity),
              fontSize: 9.5,
              alignment: 'center',
              bold: r.quantity > 1,
              color: r.quantity > 1 ? COPPER : INK
            },
            {
              text: r.condition,
              fontSize: 9.5,
              alignment: 'center',
              color: r.condition === '-' ? MUTED : INK
            }
          ]);
        });

        body.push([
          {
            stack: [
              { text: item.title || '—', style: 'itemTitle' },
              {
                text: `${pieces} ${plural(pieces, 'peça', 'peças')}`,
                fontSize: 8,
                color: MUTED,
                margin: [0, 2, 0, 0]
              }
            ]
          },
          {
            table: { widths: ['*', 50, 90], body: inner },
            layout: {
              hLineWidth: (i: number, node: any) =>
                i === 0 || i === node.table.body.length ? 0 : 0.5,
              vLineWidth: () => 0,
              hLineColor: () => LINE,
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: () => 3,
              paddingBottom: () => 3
            }
          }
        ]);
      });

      return {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
          widths: [170, '*'],
          body
        },
        layout: {
          fillColor: (rowIndex: number) =>
            rowIndex === 0 ? INK : rowIndex % 2 === 0 ? PAPER : null,
          hLineWidth: (i: number) => (i <= 1 ? 0 : 0.5),
          vLineWidth: () => 0,
          hLineColor: () => LINE,
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 8,
          paddingBottom: () => 8
        },
        margin: [0, 0, 0, 14]
      };
    };

    // rótulo de seção (Moedas, Cédulas...)
    const sectionLabel = (text: string) => ({
      text: text.toUpperCase(),
      fontSize: 8.5,
      bold: true,
      color: COPPER,
      characterSpacing: 1,
      margin: [0, 6, 0, 6],
      headlineLevel: 2
    });

    // ---------- 3) resumo ----------
    const countries = Array.from(new Set(itemsToPrint.map(i => i.issuerName as string)));
    const totalItems = itemsToPrint.length;
    const totalPieces = itemsToPrint.reduce((s, i) => s + piecesOf(i), 0);
    const today = new Date().toLocaleDateString('pt-BR');

    const stat = (label: string, value: string, color: string = INK) => ({
      stack: [
        { text: label, style: 'statLabel' },
        { text: value, style: 'statValue', color }
      ]
    });

    // ---------- 4) conteúdo ----------
    const content: any[] = [
      { text: 'Minha coleção', fontSize: 28, bold: true, color: INK },
      {
        text: typeLabel,
        fontSize: 12,
        bold: true,
        color: COPPER,
        margin: [0, 2, 0, 2]
      },
      {
        text: `${countryLabel} · gerado em ${today}`,
        fontSize: 8.5,
        color: MUTED,
        margin: [0, 0, 0, 14]
      },
      {
        table: {
          widths: ['*', '*', '*'],
          body: [[
            stat('ITENS', String(totalItems)),
            stat('PEÇAS', String(totalPieces), COPPER),
            stat('PAÍSES', String(countries.length))
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
        },
        margin: [0, 0, 0, 6]
      }
    ];

    countries.forEach(country => {
      const itemsByCountry = itemsToPrint.filter(i => i.issuerName === country);
      const countryPieces = itemsByCountry.reduce((s, i) => s + piecesOf(i), 0);

      // título do país + contagem
      content.push({
        headlineLevel: 1,
        columns: [
          { width: '*', text: country, fontSize: 20, bold: true, color: INK },
          {
            width: 'auto',
            text: `${itemsByCountry.length} ${plural(itemsByCountry.length, 'item', 'itens')} · ${countryPieces} ${plural(countryPieces, 'peça', 'peças')}`,
            fontSize: 9,
            color: MUTED,
            margin: [0, 10, 0, 0]
          }
        ],
        margin: [0, 16, 0, 4]
      });
      content.push({
        canvas: [{ type: 'rect', x: 0, y: 0, w: 40, h: 3, color: COPPER }],
        margin: [0, 0, 0, 8]
      });

      if (this.selectedPDFType === 'all') {
        const coins = itemsByCountry.filter(i => i.category === 'coin');
        const banknotes = itemsByCountry.filter(i => i.category === 'banknote');

        if (coins.length) {
          content.push(sectionLabel('Minhas moedas'), buildTable(coins));
        }
        if (banknotes.length) {
          content.push(sectionLabel('Minhas cédulas'), buildTable(banknotes));
        }
      } else {
        const titulo =
          this.selectedPDFType === 'coins' ? 'Moedas'
            : this.selectedPDFType === 'banknotes' ? 'Cédulas'
              : 'Itens repetidos';
        content.push(sectionLabel(titulo), buildTable(itemsByCountry));
      }
    });

    // ---------- 5) documento ----------
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [20, 70, 20, 40],

      info: {
        title: `Coleção - ${typeLabel} - ${countryLabel}`,
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

      // evita título de país/seção sozinho no fim da página
      pageBreakBefore: (currentNode: any, followingNodesOnPage: any[]) =>
        currentNode.headlineLevel != null && followingNodesOnPage.length === 0,

      content,

      styles: {
        th: { bold: true, color: '#ffffff', fontSize: 9 },
        itemTitle: { fontSize: 10.5, bold: true },
        mini: { fontSize: 7, color: MUTED, characterSpacing: 0.5 },
        statLabel: { fontSize: 7, color: MUTED, characterSpacing: 0.6 },
        statValue: { fontSize: 22, bold: true, margin: [0, 2, 0, 0] }
      }
    };

    const fileName = `colecao-${countryLabel}-${typeLabel}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

    // .download() é mais confiável que .open() (pop-up pode ser bloqueado)
    pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
    // Para abrir numa nova aba em vez de baixar: pdfMake.createPdf(docDefinition).open();
  }


  refreshAlbum(): void {
    this.coinsService.getAlbumByUser().subscribe({
      next: (res) => {
        this.albumCoins = res || [];

        const conds = [...new Set(
          this.albumCoins
            .map((c: any) => c.condition)
            .filter((c: string | null) => c != null && String(c).trim() !== '')
        )] as string[];

        this.uniqueConditions = ['Todas condições', ...conds];
        this.selectedCondition = this.selectedCondition || 'Todas condições';

        this.applyFilters();
      },
      error: (err) => {
        console.error('Erro ao atualizar álbum:', err);
      }
    });
  }

  toggleFilters() {
    // Fecha o segundo se estiver aberto
    if (this.showFilters2) {
      this.showFilters2 = false;
    }
    this.showFilters = !this.showFilters;
  }

  toggleFilters2() {
    // Fecha o primeiro se estiver aberto
    if (this.showFilters) {
      this.showFilters = false;
    }
    this.showFilters2 = !this.showFilters2;
  }
}
