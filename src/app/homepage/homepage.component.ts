import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../shared/loading.service';
import { AVAILABLE_COUNTRIES_CAD } from '../models/countriesCAD';


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent {

  @ViewChild('welcomeSection') welcomeSection!: ElementRef;
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('highlightsSection') highlightsSection!: ElementRef;

  private hasAnimated = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private loadingService: LoadingService,
  ) { }

  coins = [
    {
      name: '1 Real JK 2002',
      country: 'Brasil',
      image: 'assets/img/carousel/6385_obverse.jpg'
    },
    {
      name: '1 Real BC 2005',
      country: 'Brasil',
      image: 'assets/img/carousel/6439_obverse.jpg'
    },
    {
      name: '1 Real',
      country: 'Brasil',
      image: 'assets/img/carousel/8896_obverse.jpg'
    },
    {
      name: '1 Real DH 1998',
      country: 'Brasil',
      image: 'assets/img/carousel/11096_obverse.jpg'
    },
    {
      name: '1 Real BD 2012',
      country: 'Brasil',
      image: 'assets/img/carousel/36721_obverse.jpg'
    },
    {
      name: '4000 Réis 1707',
      country: 'Brasil',
      image: 'assets/img/carousel/16997_obverse.jpg'
    },
    {
      name: '10000 Réis 1889',
      country: 'Brasil',
      image: 'assets/img/carousel/36129_obverse.jpg'
    },
    {
      name: '6400 Réis 1824',
      country: 'Brasil',
      image: 'assets/img/carousel/36204_reverse.jpg'
    },
    {
      name: '4000 Réis 1805',
      country: 'Brasil',
      image: 'assets/img/carousel/36271_reverse.jpg'
    },
    {
      name: '25 Céntimos 1953',
      country: 'Paraguai ',
      image: 'assets/img/carousel/4981_obverse.jpg'
    },
    {
      name: '1 Centesimo 1869',
      country: 'Uruguai',
      image: 'assets/img/carousel/86915_obverse.jpg'
    },
    {
      name: '20 Pesos 1976',
      country: 'Chile',
      image: 'assets/img/carousel/34944_reverse.jpg'
    },
    {
      name: '8 Escudos 1751',
      country: 'Peru',
      image: 'assets/img/carousel/46605_obverse.jpg'
    },


  ];

  showHeader = false;
  decorHeight = 120;
  cadCountries = AVAILABLE_COUNTRIES_CAD;
  hasHighlightsAnimated = false;
  countriesOpen = false;

  ngOnInit() {
    this.onSubmitLogout()
    window.addEventListener("scroll", this.handleScroll);
    this.loadSVG();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {

    this.showHeader = window.scrollY > 150;

    const scrollY = window.scrollY;
    const maxHeight = 400;
    const newHeight = 120 + scrollY * 0.5;
    this.decorHeight = Math.min(newHeight, maxHeight);

    // ===== WELCOME (NÃO ALTERADO) =====
    if (!this.hasAnimated && this.welcomeSection) {
      const element = this.welcomeSection.nativeElement;
      const rect = element.getBoundingClientRect();

      if (rect.bottom <= window.innerHeight) {
        element.classList.add('animate');
        this.hasAnimated = true;
      }
    }

   // ===== NOVA ANIMAÇÃO HIGHLIGHTS =====
if (this.highlightsSection?.nativeElement && !this.hasHighlightsAnimated) {

  const element = this.highlightsSection.nativeElement;
  const rect = element.getBoundingClientRect();

  // Só ativa quando 80% da viewport já passou
  if (rect.top <= window.innerHeight * 0.8) {

    const inner = element.querySelector('.highlights-inner');
    inner?.classList.add('visible');

    this.hasHighlightsAnimated = true; // trava para não repetir
  }
}


  }
  
toggleCountries() {
  this.countriesOpen = !this.countriesOpen;
}

  handleScroll = () => {
    const elements = document.querySelectorAll(".reveal, .reveal-card");
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const visible = rect.top < window.innerHeight - 80;
      if (visible) el.classList.add("visible");
    });
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

  onSubmitLogout() {
    localStorage.removeItem('ControleUsuarioLogado');
    localStorage.removeItem('ControleUsuario');
    localStorage.removeItem('ControleUsuarioPermi');
    localStorage.removeItem('ControleUsuarioIP');
    localStorage.removeItem('jwt');
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
