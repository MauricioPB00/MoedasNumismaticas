import { Component, OnInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { Router } from '@angular/router';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;

import { logoBase64 } from 'src/assets/logo';

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
  itemsPerPage = 28;
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

        this.loading = false;
        console.log('Álbum carregado (raw):', this.albumCoins);
      },
      error: (err) => {
        console.error('Erro ao carregar álbum:', err);
        this.error = 'Erro ao carregar álbum.';
        this.loading = false;
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

    if (this.sortOrder === 'asc') {
      this.filteredCoins.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else {
      this.filteredCoins.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    this.updatePagination();

    console.log('Resultado após filtros:', this.filteredCoins.length);
  }



  applyFiltersGroupByYear(): void {
    const items = this.getBaseFilteredCoins();
    console.log('filtered (after basic filters):', items.length);

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

    console.log('grouped by year result:', grouped.length);
    this.filteredCoins = grouped;
    this.updatePagination();
  }



  toggleGroupByCoinId(): void {
    if (this.groupByCoinId) {
      this.groupByYear = false;
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
    console.log('filtered (after basic filters):', items.length);

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

    console.log('grouped result:', grouped.length);
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
    console.log(`Página ${this.currentPage}/${this.totalPages} — exibindo ${this.pagedCoins.length} itens`);
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

    console.log('Abrir modal para item:', this.coin);
    console.log('Entries inicializadas:', this.coinEntries);
  }

  openModalPrice() {
    this.showPriceModal = true;
  }

  openModalPDF(): void {
    this.showModalPDF = true;
  }

  closeModalPDF(): void {
    this.showModalPDF = false;
  }

  gerarPDF(): void {
    const content: any[] = [];

    content.push({
      columns: [
        {
          image: logoBase64,
          width: 80
        },
        {
          stack: [
            { text: 'Álbum Numismático', fontSize: 18, bold: true },
            { text: 'Organize, catalogue e explore o fascinante mundo das moedas.', fontSize: 10 },
            { text: 'www.albumnumismatico.com.br', fontSize: 10 }
          ],
          margin: [10, 0, 0, 0]
        }
      ],
      margin: [0, 0, 0, 20]
    });

    let titulo = 'Meu Álbum de Moedas';
    switch (this.selectedPDFType) {
      case 'coins': titulo = 'Minhas Moedas'; break;
      case 'banknotes': titulo = 'Minhas Cédulas'; break;
      case 'repeated': titulo = 'Itens Repetidos'; break;
    }

    let itemsToPrint: any[] = this.albumCoins;

    // Filtrar conforme tipo selecionado
    if (this.selectedPDFType === 'coins') {
      itemsToPrint = itemsToPrint.filter(i => i.category === 'coin');
    } else if (this.selectedPDFType === 'banknotes') {
      itemsToPrint = itemsToPrint.filter(i => i.category === 'banknote');
    } else if (this.selectedPDFType === 'repeated') {
      itemsToPrint = itemsToPrint.filter(i => i.quantity > 1).map(i => ({ ...i, quantity: i.quantity - 1 }));
    }

    // Função para adicionar seção
    const addSection = (title: string, items: any[]) => {
      if (!items.length) return;

      content.push({ text: title, fontSize: 16, bold: true, margin: [0, 0, 0, 15] });

      items.forEach(item => {
        content.push({ text: item.title, bold: true, fontSize: 14, margin: [0, 5, 0, 5] });

        const tableBody = [['Ano', 'Quantidade', 'Condição']];

        // Garante que item.years é um array
        const years = item.years ?? [{ year: item.year, quantity: item.quantity, condition: item.condition }];

        years.forEach((y: { year: number; quantity: number; condition: string | null }) => {
          tableBody.push([
            y.year?.toString() ?? '-',
            y.quantity?.toString() ?? '0',
            y.condition || '-'
          ]);
        });

        content.push({
          table: { headerRows: 1, widths: ['*', 'auto', 'auto'], body: tableBody },
          layout: { fillColor: (rowIndex: number) => rowIndex === 0 ? '#EFBF04' : null },
          margin: [0, 0, 0, 15]
        });
      });

    };

    // Se for "Tudo", separar moedas e cédulas
    if (this.selectedPDFType === 'all') {
      const coins = itemsToPrint.filter(i => i.category === 'coin');
      const banknotes = itemsToPrint.filter(i => i.category === 'banknote');

      addSection('Minhas Moedas', coins);
      addSection('Minhas Cédulas', banknotes);
    } else {
      // Título conforme tipo
      let titulo = 'Meu Álbum de Moedas';
      if (this.selectedPDFType === 'coins') titulo = 'Minhas Moedas';
      if (this.selectedPDFType === 'banknotes') titulo = 'Minhas Cédulas';
      if (this.selectedPDFType === 'repeated') titulo = 'Itens Repetidos';

      addSection(titulo, itemsToPrint);
    }

    pdfMake.createPdf({ content }).open();
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
}
