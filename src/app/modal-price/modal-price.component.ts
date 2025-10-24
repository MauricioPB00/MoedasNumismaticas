import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CoinsService } from '../AuthService/coins.service';
import { Chart, registerables } from 'chart.js';
import { LoadingService } from '../shared/loading.service';

Chart.register(...registerables);

@Component({
  selector: 'app-modal-price',
  templateUrl: './modal-price.component.html',
  styleUrls: ['./modal-price.component.css']
})
export class ModalPriceComponent implements AfterViewInit {
  @Input() show: boolean = false;
  @Output() closed = new EventEmitter<void>();

  albumCoins: any[] = [];
  countryLabels: string[] = [];
  countryData: number[] = [];
  totalsByCountry: Record<string, number> = {};

  totalMoedas: number = 0;
  totalCedulas: number = 0;
  totalGeral: number = 0;

  pieChart!: Chart;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private coinsService: CoinsService,
    private loadingService: LoadingService,
  ) { }

  ngAfterViewInit(): void {
    this.getAlbum();
  }

  closeModal() {
    this.closed.emit();
  }

  getAlbum(): void {
    this.loadingService.show();
    this.coinsService.getAlbumByUser().subscribe({
      next: (res) => {
        this.albumCoins = res || [];
        this.calculateValues();
        this.calculateCountryData();
        this.createOrUpdateChart();
      },
      error: (err) => {
        console.error('Erro ao carregar álbum:', err);
        this.loadingService.hide();
      }
    });
    this.loadingService.hide();
  }

  calculateValues(): void {
    this.loadingService.show();
    this.totalMoedas = 0;
    this.totalCedulas = 0;
    this.totalGeral = 0;
    this.totalsByCountry = {};

    this.albumCoins.forEach(item => {
      const totalValue = Number(item.totalValue) || 0;
      const issuer = item.issuer || 'Desconhecido';

      if (item.category === 'coin') {
        this.totalMoedas += totalValue;
      } else if (item.category === 'banknote') {
        this.totalCedulas += totalValue;
      }
      this.totalsByCountry[issuer] = (this.totalsByCountry[issuer] || 0) + totalValue;
    });
    this.totalGeral = this.totalMoedas + this.totalCedulas;
    this.loadingService.hide();
  }

  calculateCountryData(): void {
    this.countryLabels = Object.keys(this.totalsByCountry);
    this.countryData = Object.values(this.totalsByCountry);
  }

  createOrUpdateChart(): void {
    this.loadingService.show();
    if (!this.pieChartCanvas) return;

    const backgroundColors = this.countryLabels.map(() => this.getRandomColor());

    const data = {
      labels: this.countryLabels,
      datasets: [{
        label: 'Total por país',
        data: this.countryData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(() => 'transparent'),
        borderWidth: 0.5
      }]
    };

    if (this.pieChart) {
      this.pieChart.data = data;
      this.pieChart.update();
    } else {
      this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
        type: 'pie',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          },
          cutout: 0,
          spacing: 0,
        }
      });
    }
    this.loadingService.hide();
  }

  getRandomColor(): string {
    const r = Math.floor(Math.random() * 200) + 30;
    const g = Math.floor(Math.random() * 200) + 30;
    const b = Math.floor(Math.random() * 200) + 30;
    return `rgb(${r}, ${g}, ${b})`;
  }
}
