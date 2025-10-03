import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as svgPanZoom from 'svg-pan-zoom';
import { CoinsService } from '../AuthService/coins.service';
import { AVAILABLE_COUNTRIES, Country } from '../models/countries';

export interface CountryData {
  code: string;
  name: string;
  coins: number;
  banknotes: number;
}

@Component({
  selector: 'app-mapa-mundi',
  templateUrl: './mapa-mundi.component.html',
  styleUrls: ['./mapa-mundi.component.css']
})
export class MapaMundiComponent implements OnInit {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<HTMLDivElement>;

  tooltipVisible = false;
  tooltipCountry = '';
  tooltipInfo = '';
  tooltipStyle: any = {};

  albumCoins: any[] = [];
  userCountries: CountryData[] = [];
  searchTerm: string = '';
  highlightedCountryCode: string | null = null;

  selectedCountryCode: string = '';

  availableCountries: Country[] = AVAILABLE_COUNTRIES;


  countryCodeMap: Record<string, string> = {
    'Brasil': 'br',
    'Estados Unidos': 'US',
    'Itália': 'IT',
    'Japão': 'JP',
    'França': 'FR',
    'Reino Unido': 'GB',
    'Alemanha': 'DE',
    'Argentina': 'AR',
    'Canadá': 'CA',
    'México': 'MX',
    'Espanha': 'ES',
    'Portugal': 'PT',
  };

  constructor(private http: HttpClient, private coinsService: CoinsService) { }

  ngOnInit(): void {
    this.http.get('assets/svg/mapa-mundi.svg', { responseType: 'text' })
      .subscribe(svgText => this.insertAndSetupSvg(svgText));

    this.getAlbumMap();
  }

  private insertAndSetupSvg(svgText: string) {
    const svgContainer = this.svgContainer.nativeElement;
    svgContainer.innerHTML = svgText;

    const svgEl = svgContainer.querySelector('svg') as SVGSVGElement;
    if (!svgEl) {
      console.error('SVG não encontrado.');
      return;
    }

    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    svgEl.querySelectorAll<SVGElement>('circle[id$="_"]').forEach(el => el.remove());
    svgEl.querySelectorAll<SVGElement>('path').forEach(el => {
      el.setAttribute('fill', '#d1d1d1');
      el.setAttribute('stroke', '#ffffff');
      el.setAttribute('stroke-width', '0.5');
    });

    if (this.userCountries.length > 0) {
      this.paintUserCountries(svgEl);
    }

    (svgPanZoom as any)(svgEl, {
      zoomEnabled: true,
      controlIconsEnabled: true,
      fit: true,
      center: true,
      minZoom: 1,
      maxZoom: 10
    });
  }

  private paintUserCountries(svgEl: SVGSVGElement) {
    this.userCountries.forEach(country => {
      if (!country.code) return;

      const el = svgEl.querySelector<SVGElement>(`#${country.code}`);

      if (el) {
        const paths = el.tagName.toLowerCase() === 'g'
          ? el.querySelectorAll<SVGPathElement>('path')
          : [el as SVGPathElement];

        paths.forEach(path => {
          if (this.highlightedCountryCode === country.code) {
            path.setAttribute('fill', '#c0392b');
          } else {
            path.setAttribute('fill', '#EFBF04');
          }
          path.setAttribute('stroke', '#000');
          path.setAttribute('stroke-width', '0.5');
          path.style.transition = 'fill 0.25s ease';
        });

        el.addEventListener('mouseenter', (e: MouseEvent) => this.showTooltip(e, country));
        el.addEventListener('mousemove', (e: MouseEvent) => this.moveTooltip(e));
        el.addEventListener('mouseleave', () => this.hideTooltip());

      } else {
        console.warn(`País não encontrado no SVG: ${country.code} (${country.name})`);
      }
    });
  }

  showTooltip(event: MouseEvent, country: CountryData) {
    this.tooltipVisible = true;
    this.tooltipCountry = country.name;
    this.tooltipInfo = `${country.coins} moeda${country.coins !== 1 ? 's' : ''}, ${country.banknotes} cédula${country.banknotes !== 1 ? 's' : ''}`;
    this.moveTooltip(event);
  }

  moveTooltip(event: MouseEvent) {
    const offset = 10;
    this.tooltipStyle = {
      left: event.clientX + offset + 'px',
      top: event.clientY + offset + 'px',
      position: 'fixed'
    };
  }

  hideTooltip() {
    this.tooltipVisible = false;
  }

  getAlbumMap() {
    this.coinsService.getAlbumByUserMap().subscribe({
      next: (res) => {
        this.albumCoins = res || [];
        const grouped: Record<string, { coins: number, banknotes: number }> = {};

        this.albumCoins.forEach(item => {
          const issuer = item.issuer || 'Desconhecido';
          if (!grouped[issuer]) grouped[issuer] = { coins: 0, banknotes: 0 };
          if (item.category === 'coin') grouped[issuer].coins += item.quantity || 1;
          else if (item.category === 'banknote') grouped[issuer].banknotes += item.quantity || 1;
        });

        this.userCountries = Object.entries(grouped).map(([issuer, totals]) => ({
          name: issuer,
          code: (this.countryCodeMap[issuer] || '').toLowerCase(),
          coins: totals.coins,
          banknotes: totals.banknotes
        }));

        const svgEl = this.svgContainer.nativeElement.querySelector('svg');
        if (svgEl) this.paintUserCountries(svgEl as SVGSVGElement);
      },
      error: err => console.error('Erro ao carregar mapa do álbum:', err)
    });
  }
  onSelectChange() {
  const svgEl = this.svgContainer.nativeElement.querySelector('svg');
  if (!svgEl) return;

  // Resetar todos os países do SVG
  svgEl.querySelectorAll<SVGPathElement>('path').forEach(path => {
    path.setAttribute('fill', '#d1d1d1');
    path.setAttribute('stroke', '#fff');
    path.setAttribute('stroke-width', '0.5');
  });

  // Pinta os países do usuário
  this.userCountries.forEach(country => {
    const el = svgEl.querySelector<SVGElement>(`#${country.code}`);
    if (!el) return;

    const paths = el.tagName.toLowerCase() === 'g'
      ? Array.from(el.querySelectorAll<SVGPathElement>('path'))
      : [el as SVGPathElement];

    paths.forEach(path => {
      path.setAttribute('fill', '#EFBF04');
      path.setAttribute('stroke', '#000');
      path.setAttribute('stroke-width', '0.5');
    });
  });

  // Se tiver um país selecionado no select, pinta em vermelho
  if (!this.selectedCountryCode) {
    this.highlightedCountryCode = null;
    return;
  }

  this.highlightedCountryCode = this.selectedCountryCode;
  const selectedEl = svgEl.querySelector<SVGElement>(`#${this.selectedCountryCode}`);
  if (!selectedEl) return;

  const selectedPaths = selectedEl.tagName.toLowerCase() === 'g'
    ? Array.from(selectedEl.querySelectorAll<SVGPathElement>('path'))
    : [selectedEl as SVGPathElement];

  selectedPaths.forEach(path => {
    path.setAttribute('fill', '#e74c3c'); // vermelho
    path.setAttribute('stroke', '#000');
    path.setAttribute('stroke-width', '0.5');
  });
}

  clearFilters() {
  this.selectedCountryCode = '';
  this.highlightedCountryCode = null;

  const svgEl = this.svgContainer.nativeElement.querySelector('svg') as SVGSVGElement;
  if (!svgEl) return;

  svgEl.querySelectorAll<SVGPathElement>('path').forEach(path => {
    path.setAttribute('fill', '#d1d1d1');
    path.setAttribute('stroke', '#fff');
    path.setAttribute('stroke-width', '0.5');
  });

  this.userCountries.forEach(country => {
    const el = svgEl.querySelector<SVGElement>(`#${country.code}`);
    if (el) {
      const paths = el.tagName.toLowerCase() === 'g'
        ? el.querySelectorAll<SVGPathElement>('path')
        : [el as SVGPathElement];

      paths.forEach(path => {
        path.setAttribute('fill', '#EFBF04'); 
        path.setAttribute('stroke', '#000');
        path.setAttribute('stroke-width', '0.5');
      });
    }
  });
}




}
