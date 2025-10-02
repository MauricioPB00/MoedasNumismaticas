import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as svgPanZoom from 'svg-pan-zoom';

interface CountryData {
  code: string; // Ex: 'BR', 'US', 'FR'
  name: string;
  coins: number;
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
  tooltipInfo: string = '';
  tooltipStyle: any = {};

  userCountries: CountryData[] = [
    { code: 'BR', name: 'Brasil', coins: 12 },
    { code: 'US', name: 'Estados Unidos', coins: 7 },
    { code: 'IT', name: 'Itália', coins: 3 },
    { code: 'JP', name: 'Japão', coins: 5 },
    { code: 'FR', name: 'França', coins: 2 },
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get('assets/svg/mapa-mundi.svg', { responseType: 'text' })
      .subscribe(svgText => this.insertAndSetupSvg(svgText));
  }

  private insertAndSetupSvg(svgText: string) {
    // Injeta o SVG
    this.svgContainer.nativeElement.innerHTML = svgText;
    const svgEl = this.svgContainer.nativeElement.querySelector('svg') as SVGSVGElement;

    if (!svgEl) {
      console.error('SVG não encontrado no arquivo.');
      return;
    }

    // Responsivo
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Remove apenas as bolinhas pretas (_)
    svgEl.querySelectorAll<SVGElement>('circle[id$="_"]').forEach(el => el.remove());

    // Aplica cor padrão a todos os países
    svgEl.querySelectorAll<SVGElement>('path').forEach(el => {
      el.setAttribute('fill', '#c0c0c0'); // cinza padrão
      el.setAttribute('stroke', '#fff');  // borda branca
      el.setAttribute('stroke-width', '0.5');
    });

    // Pinta países do usuário e adiciona eventos
    this.userCountries.forEach(country => {
      const el = svgEl.querySelector<SVGElement>(`#${country.code}`);
      if (el) {
        el.setAttribute('fill', '#00b894'); // verde
        el.setAttribute('stroke', '#222');  // borda mais escura
        el.style.transition = 'fill 0.25s ease';

        el.addEventListener('mouseenter', (e: MouseEvent) => this.showTooltip(e, country));
        el.addEventListener('mousemove', (e: MouseEvent) => this.moveTooltip(e));
        el.addEventListener('mouseleave', () => this.hideTooltip());
      } else {
        console.warn(`ID do país não encontrado no SVG: ${country.code}`);
      }
    });

    // Zoom e Pan
    (svgPanZoom as any)(svgEl, {
      zoomEnabled: true,
      controlIconsEnabled: true,
      fit: true,
      center: true,
      minZoom: 1,
      maxZoom: 20
    });
  }
  // Tooltip
  showTooltip(event: MouseEvent, country: CountryData) {
    this.tooltipVisible = true;
    this.tooltipCountry = country.name;
    this.tooltipInfo = `${country.coins} moeda${country.coins > 1 ? 's' : ''}`;
    this.moveTooltip(event);
  }

  moveTooltip(event: MouseEvent) {
    this.tooltipStyle = {
      top: event.pageY + 12 + 'px',
      left: event.pageX + 12 + 'px'
    };
  }

  hideTooltip() {
    this.tooltipVisible = false;
  }

  openCountryPage(country: CountryData) {
    alert(`Abrir página do país: ${country.name}`);
    // Exemplo real:
    // this.router.navigate(['/pais', country.code.toLowerCase()]);
  }
}
