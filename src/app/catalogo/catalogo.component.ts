import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { AVAILABLE_COUNTRIES_CAD } from '../models/countriesCAD';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoadingService } from '../shared/loading.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css']
})
export class CatalogoComponent {

  showHeader = false;
  cadCountries = AVAILABLE_COUNTRIES_CAD;

  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private router: Router,
    private loadingService: LoadingService,
    private http: HttpClient,
  ) { }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showHeader = window.scrollY > 150;
  }

  ngOnInit() {
    this.loadSVG();
  }

  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { mode: 'login' }
    });
  }

  goToRegister() {
    this.router.navigate(['/login'], {
      queryParams: { mode: 'signup' }
    });
  }

  loadSVG() {
    this.http.get('assets/svg/mapa-mundi.svg', { responseType: 'text' })
      .subscribe(svgText => this.insertAndSetupSvg(svgText));
  }

  private insertAndSetupSvg(svgText: string) {
    this.loadingService.show();

    const container = this.svgContainer.nativeElement;
    container.innerHTML = svgText;

    const svgEl = container.querySelector('svg') as SVGSVGElement;
    if (!svgEl) return;

    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    svgEl.querySelectorAll<SVGElement>('circle[id$="_"]').forEach(el => el.remove());

    let defsEl = svgEl.querySelector('defs') as SVGDefsElement | null;

    if (!defsEl) {
      defsEl = document.createElementNS('http://www.w3.org/2000/svg', 'defs') as SVGDefsElement;
      svgEl.insertBefore(defsEl, svgEl.firstChild);
    }

    const defs = defsEl as SVGDefsElement;

    const gradOcean = this.makeGradient('oceanGradient', [
      ['0%', '#0a4e8a'],
      ['50%', '#1f74c0'],
      ['100%', '#7fc9f9']
    ]);

    defs.appendChild(gradOcean);

    const ocean = svgEl.querySelector('#ocean, .oceanxx') as SVGPathElement;
    if (ocean) {
      ocean.setAttribute('fill', 'url(#oceanGradient)');
      ocean.setAttribute('stroke', '#0d3b66');
      ocean.setAttribute('stroke-width', '0.3');
    }

    svgEl.querySelectorAll<SVGElement>('path:not(#ocean):not(.oceanxx)').forEach((el, i) => {
      const gradId = `countryGradient${i}`;
      const grad = this.makeGradient(gradId, [
        ['0%', `hsl(120, 50%, ${35 + Math.random() * 10}%)`],
        ['100%', `hsl(120, 60%, ${50 + Math.random() * 15}%)`]
      ]);
      defs.appendChild(grad);

      el.setAttribute('fill', `url(#${gradId})`);
      el.setAttribute('stroke', '#ffffff');
      el.setAttribute('stroke-width', '0.5');
    });

    this.paintCadCountries(svgEl);

    svgEl.classList.remove('map-animate');
    (svgEl as any).offsetWidth;
    svgEl.classList.add('map-animate');

    this.loadingService.hide();
  }

  private makeGradient(id: string, stops: [string, string][]) {
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', id);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '100%');
    grad.setAttribute('x2', '0%');
    grad.setAttribute('y2', '0%');

    stops.forEach(s => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', s[0]);
      stop.setAttribute('stop-color', s[1]);
      grad.appendChild(stop);
    });

    return grad;
  }

  private paintCadCountries(svgEl: SVGSVGElement) {
    this.cadCountries.forEach(country => {
      const element = svgEl.querySelector(`#${country.code}`);
      if (!element) {
        console.warn(`País não encontrado no SVG: ${country.code}`);
        return;
      }

      const paths = element.tagName === 'g'
        ? element.querySelectorAll('path')
        : [element as SVGPathElement];

      paths.forEach(p => {
        p.setAttribute('fill', '#EFBF04');
        p.setAttribute('stroke', '#333');
        p.setAttribute('stroke-width', '1.0');
      });
    });
  }
}
