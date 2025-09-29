import { Component, OnInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { Router } from '@angular/router';
import { logoBase64 } from 'src/assets/logo';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;

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

  selectedType: string = 'all';

  searchName: string = '';
  minYear?: number;
  maxYear?: number;
  selectedCondition: string = '';
  uniqueConditions: string[] = [];

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

        this.allAlbumCoins.forEach(c => {
          c.years.sort((a: any, b: any) => a.year - b.year);
        });

        this.allAlbumCoins.sort((a, b) => a.years[0].year - b.years[0].year);

        const conds = new Set<string>();
        this.allAlbumCoins.forEach(c => c.years.forEach((y: any) => y.condition && conds.add(y.condition)));
        this.uniqueConditions = Array.from(conds);

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
    let filtered = [...this.allAlbumCoins];

    if (this.selectedType === 'coin' || this.selectedType === 'banknote') {
      filtered = filtered.filter(c => c.category === this.selectedType);
    } else if (this.selectedType === 'repeated') {
      filtered = filtered
        .map(c => ({
          ...c,
          years: c.years
            .filter((y: any) => y.quantity > 1)
            .map((y: any) => ({ ...y, quantity: y.quantity - 1 }))
        }))
        .filter(c => c.years.length > 0);
    }

    if (this.searchName) {
      const term = this.searchName.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(term));
    }

    if (this.minYear !== undefined || this.maxYear !== undefined) {
      filtered = filtered.map(c => ({
        ...c,
        years: c.years.filter((y: any) => {
          const afterMin = this.minYear ? y.year >= this.minYear : true;
          const beforeMax = this.maxYear ? y.year <= this.maxYear : true;
          return afterMin && beforeMax;
        })
      })).filter(c => c.years.length > 0);
    }

    if (this.selectedCondition) {
      filtered = filtered.map(c => ({
        ...c,
        years: c.years.filter((y: any) => y.condition === this.selectedCondition)
      })).filter(c => c.years.length > 0);
    }

    this.albumCoins = filtered;
  }

  clearFilters(): void {
    this.searchName = '';
    this.minYear = undefined;
    this.maxYear = undefined;
    this.selectedCondition = '';
    this.applyFilters();
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
    switch (this.selectedType) {
      case 'coin':
        titulo = 'Minhas Moedas';
        break;
      case 'banknote':
        titulo = 'Minhas Cédulas';
        break;
      case 'repeated':
        titulo = 'Itens Repetidos';
        break;
    }

    content.push({ text: titulo, fontSize: 16, bold: true, margin: [0, 0, 0, 15] });

    this.albumCoins.forEach(coin => {
      content.push({ text: coin.title, bold: true, fontSize: 14, margin: [0, 5, 0, 5] });

      const tableBody = [
        ['Ano', 'Quantidade', 'Condição']
      ];

      coin.years.forEach((y: { year: number; quantity: number; condition: string | null }) => {
        tableBody.push([
          y.year.toString(),
          y.quantity.toString(),
          y.condition || '-'
        ]);
      });

      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: tableBody
        },
        layout: {
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#EFBF04' : null
        },
        margin: [0, 0, 0, 15]
      });
    });

    pdfMake.createPdf({ content }).open();
  }



}
