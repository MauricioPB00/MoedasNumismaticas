import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as svgPanZoom from 'svg-pan-zoom';
import { CoinsService } from '../AuthService/coins.service';
import { AVAILABLE_COUNTRIES, Country } from '../models/countries';
import { LoadingService } from '../shared/loading.service';

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

  constructor(
    private http: HttpClient, 
    private coinsService: CoinsService,
    private loadingService: LoadingService,
  ) { }

  ngOnInit(): void {
    this.loadingService.show();
    this.http.get('assets/svg/mapa-mundi.svg', { responseType: 'text' })
      .subscribe(svgText => this.insertAndSetupSvg(svgText));

    this.getAlbumMap();
    this.loadingService.hide();
  }

  private insertAndSetupSvg(svgText: string) {
    this.loadingService.show();
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

    let defs = svgEl.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgEl.insertBefore(defs, svgEl.firstChild);
    }
    const defsEl = defs as SVGDefsElement;

    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'oceanGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '100%'); 
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '0%');  

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#0a4e8a'); 

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '50%');
    stop2.setAttribute('stop-color', '#1f74c0'); 

    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', '#7fc9f9'); 

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defsEl.appendChild(gradient);

    const oceanPath = svgEl.querySelector('#ocean, .oceanxx') as SVGPathElement;
    if (oceanPath) {
      oceanPath.setAttribute('fill', 'url(#oceanGradient)');
      oceanPath.setAttribute('stroke', '#0d3b66');
      oceanPath.setAttribute('stroke-width', '0.3');
    }

    const useGlobalGradient = false;

    if (useGlobalGradient) {
      const countryGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      countryGradient.setAttribute('id', 'countryGradient');
      countryGradient.setAttribute('x1', '0%');
      countryGradient.setAttribute('y1', '100%');
      countryGradient.setAttribute('x2', '0%');
      countryGradient.setAttribute('y2', '0%');

      const cStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      cStop1.setAttribute('offset', '0%');
      cStop1.setAttribute('stop-color', '#0e8116ff'); 

      const cStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      cStop2.setAttribute('offset', '100%');
      cStop2.setAttribute('stop-color', '#55d85bff'); 

      countryGradient.appendChild(cStop1);
      countryGradient.appendChild(cStop2);
      defsEl.appendChild(countryGradient);

      svgEl.querySelectorAll<SVGElement>('path:not(#ocean):not(.oceanxx)').forEach(el => {
        el.setAttribute('fill', 'url(#countryGradient)');
        el.setAttribute('stroke', '#ffffff');
        el.setAttribute('stroke-width', '0.5');
      });

    } else {

      svgEl.querySelectorAll<SVGElement>('path:not(#ocean):not(.oceanxx)').forEach((el, i) => {
        const gradId = `countryGradient${i}`;
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', gradId);
        grad.setAttribute('x1', '0%');
        grad.setAttribute('y1', '100%'); 
        grad.setAttribute('x2', '0%');
        grad.setAttribute('y2', '0%');  

        const lightness = 35 + Math.random() * 15;
        const color1 = `hsl(120, 50%, ${lightness - 10}%)`; 
        const color2 = `hsl(120, 60%, ${lightness + 15}%)`;

        const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s1.setAttribute('offset', '0%');
        s1.setAttribute('stop-color', color1);

        const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s2.setAttribute('offset', '100%');
        s2.setAttribute('stop-color', color2);

        grad.appendChild(s1);
        grad.appendChild(s2);
        defsEl.appendChild(grad);

        el.setAttribute('fill', `url(#${gradId})`);
        el.setAttribute('stroke', '#ffffff');
        el.setAttribute('stroke-width', '0.5');
      });
    }

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
    this.loadingService.hide();
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
    this.loadingService.show();
    this.coinsService.getAlbumByUserMap().subscribe({
      next: (res) => {
        this.albumCoins = res || [];
        const grouped: Record<string, { coins: number, banknotes: number }> = {};
        this.loadingService.show();
        this.albumCoins.forEach(item => {
          const issuer = item.issuer || 'Desconhecido';
          if (!grouped[issuer]) grouped[issuer] = { coins: 0, banknotes: 0 };
          if (item.category === 'coin') grouped[issuer].coins += item.quantity || 1;
          else if (item.category === 'banknote') grouped[issuer].banknotes += item.quantity || 1;
        });

        this.userCountries = Object.entries(grouped).map(([issuer, totals]) => {
          const country = AVAILABLE_COUNTRIES.find(c => c.name === issuer);
          return {
            name: issuer,
            code: country ? country.code.toLowerCase() : '',
            coins: totals.coins,
            banknotes: totals.banknotes
          };
        });

        const svgEl = this.svgContainer.nativeElement.querySelector('svg');
        if (svgEl) this.paintUserCountries(svgEl as SVGSVGElement);
        this.loadingService.hide();
      },
      error: err => console.error('Erro ao carregar mapa do álbum:', err)
    });
    this.loadingService.hide();
  }
  onSelectChange() {
    const svgEl = this.svgContainer.nativeElement.querySelector('svg');
    if (!svgEl) return;

    if (this.highlightedCountryCode) {
      const prevEl = svgEl.querySelector<SVGElement>(`#${this.highlightedCountryCode}`);
      if (prevEl) {
        const paths = prevEl.tagName.toLowerCase() === 'g'
          ? Array.from(prevEl.querySelectorAll<SVGPathElement>('path'))
          : [prevEl as SVGPathElement];

        paths.forEach(path => {
          const isUserCountry = this.userCountries.some(c => c.code === this.highlightedCountryCode);

          if (isUserCountry) {
            path.setAttribute('fill', '#EFBF04');
            path.setAttribute('stroke', '#ffffffff');
          } else {
            const originalFill = path.getAttribute('data-original-fill');
            if (originalFill) {
              path.setAttribute('fill', originalFill);
            } else {
              path.setAttribute('fill', '#ffffffff');
            }
            path.setAttribute('stroke', '#ffffffff');
          }
          path.setAttribute('stroke-width', '0.5');
        });
      }
    }

    this.highlightedCountryCode = this.selectedCountryCode;

    if (!this.selectedCountryCode) return;

    const selectedEl = svgEl.querySelector<SVGElement>(`#${this.selectedCountryCode}`);
    if (!selectedEl) return;

    const selectedPaths = selectedEl.tagName.toLowerCase() === 'g'
      ? Array.from(selectedEl.querySelectorAll<SVGPathElement>('path'))
      : [selectedEl as SVGPathElement];

    selectedPaths.forEach(path => {
      if (!path.getAttribute('data-original-fill')) {
        path.setAttribute('data-original-fill', path.getAttribute('fill') || '');
      }

      path.setAttribute('fill', '#e74c3c');
      path.setAttribute('stroke', '#fffdfdff');
      path.setAttribute('stroke-width', '0.5');
    });
  }

  clearFilters() {
    this.selectedCountryCode = '';
    this.highlightedCountryCode = null;

    const svgEl = this.svgContainer.nativeElement.querySelector('svg') as SVGSVGElement;
    if (!svgEl) return;

    svgEl.querySelectorAll<SVGPathElement>('path:not(#ocean):not(.oceanxx)').forEach(path => {
      const original = path.getAttribute('data-original-fill');

      if (original && original.trim() !== '') {
        path.setAttribute('fill', original);
      } else {
        const current = path.getAttribute('fill') || '';
        if (!current.startsWith('url(')) {
          path.setAttribute('fill', '#d1d1d1');
        }
      }

      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '0.5');
    });

    this.userCountries.forEach(country => {
      const el = svgEl.querySelector<SVGElement>(`#${country.code}`);
      if (!el) return;

      const paths = el.tagName.toLowerCase() === 'g'
        ? Array.from(el.querySelectorAll<SVGPathElement>('path'))
        : [el as SVGPathElement];

      paths.forEach(path => {
        if (!path.getAttribute('data-original-fill')) {
          path.setAttribute('data-original-fill', path.getAttribute('fill') || '');
        }

        path.setAttribute('fill', '#EFBF04');
        path.setAttribute('stroke', '#000000')
        path.setAttribute('stroke-width', '0.5');
      });
    });
  }
}
