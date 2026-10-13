import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as svgPanZoom from 'svg-pan-zoom';
import { CoinsService } from '../AuthService/coins.service';
import { AVAILABLE_COUNTRIES, Country } from '../models/countries';
import { LoadingService } from '../shared/loading.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;
import { logoBase64 } from 'src/assets/logo';


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
  private flagCache: { [code: string]: string } = {};
  private readonly ISO_CODES: string[] = (
    'ad ae af ag ai al am ao ar as at au aw ax az ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bw by bz ' +
    'ca cc cd cf cg ch ci ck cl cm cn co cr cu cv cw cx cy cz de dj dk dm do dz ec ee eg eh er es et fi fj fk fm fo fr ' +
    'ga gb gd ge gf gg gh gi gl gm gn gp gq gr gt gu gw gy hk hn hr ht hu id ie il im in iq ir is it je jm jo jp ' +
    'ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz ' +
    'na nc ne nf ng ni nl no np nr nu nz om pa pe pf pg ph pk pl pm pn pr ps pt pw py qa re ro rs ru rw ' +
    'sa sb sc sd se sg sh si sj sk sl sm sn so sr ss st sv sx sy sz tc td tg th tj tk tl tm tn to tr tt tv tw tz ' +
    'ua ug us uy uz va vc ve vg vi vn vu wf ws ye yt za zm zw'
  ).split(' ');

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

  // =====================================================================
  // PDF DE PAÍSES
  // =====================================================================

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject();
      r.readAsDataURL(blob);
    });
  }

  private async loadFlags(codes: string[]): Promise<void> {
    const toLoad = Array.from(new Set(codes.filter(c => c && !this.flagCache[c])));
    await Promise.all(toLoad.map(async code => {
      try {
        const res = await fetch(`https://flagcdn.com/w40/${code}.png`);
        if (!res.ok) return;
        this.flagCache[code] = await this.blobToBase64(await res.blob());
      } catch { /* sem bandeira: segue sem imagem */ }
    }));
  }

  async gerarPDFPaises(): Promise<void> {
    // ---------- cores ----------
    const INK = '#15120f';
    const COPPER = '#d2703f';
    const PAPER = '#f7f5f0';
    const LINE = '#e2ded6';
    const MUTED = '#7b766d';
    const OWNED_BG = '#fbefe7';
    const CONTENT_W = 555; // A4 (595) menos as margens 20 + 20

    if (!this.albumCoins?.length) {
      alert('Nenhum item no álbum para gerar o PDF.');
      return;
    }

    this.loadingService.show();

    try {
      // ---------- 1) totais por país (separando moeda e cédula) ----------
      const coinsByIssuer: Record<string, number> = {};
      const notesByIssuer: Record<string, number> = {};

      this.albumCoins.forEach(item => {
        const issuer = item.issuer || 'Desconhecido';
        const qty = Number(item.quantity) || 1;
        if (item.category === 'coin') coinsByIssuer[issuer] = (coinsByIssuer[issuer] || 0) + qty;
        else if (item.category === 'banknote') notesByIssuer[issuer] = (notesByIssuer[issuer] || 0) + qty;
      });

      interface CountryRow { name: string; code: string; }

      const all: CountryRow[] = this.availableCountries.map(c => ({
        name: c.name,
        code: (c.code || '').toLowerCase()
      }));
      const knownNames = new Set(all.map(c => c.name));
      const knownCodes = new Set(all.map(c => c.code));

      const regionNames = new (Intl as any).DisplayNames(['pt-BR'], { type: 'region' });
      this.ISO_CODES.forEach(code => {
        if (knownCodes.has(code)) return;
        let name = '';
        try { name = regionNames.of(code.toUpperCase()) || ''; } catch { /* ignora */ }
        if (!name || name.toUpperCase() === code.toUpperCase() || knownNames.has(name)) return;
        knownCodes.add(code);
        knownNames.add(name);
        all.push({ name, code });
      });

      [...Object.keys(coinsByIssuer), ...Object.keys(notesByIssuer)].forEach(name => {
        if (!knownNames.has(name)) {
          knownNames.add(name);
          all.push({ name, code: '' });
        }
      });

      all.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      await this.loadFlags(all.map(c => c.code));

      const today = new Date().toLocaleDateString('pt-BR');
      const totalCountries = all.length;
      const withCoins = all.filter(c => (coinsByIssuer[c.name] || 0) > 0).length;
      const withNotes = all.filter(c => (notesByIssuer[c.name] || 0) > 0).length;
      const withAny = all.filter(c =>
        (coinsByIssuer[c.name] || 0) > 0 || (notesByIssuer[c.name] || 0) > 0
      ).length;

      const stat = (label: string, value: string, color: string = INK) => ({
        stack: [
          { text: label, style: 'statLabel' },
          { text: value, style: 'statValue', color }
        ]
      });

      const buildTable = () => {
        const body: any[] = [[
          { text: '', style: 'th' },
          { text: 'País', style: 'th' },
          { text: 'Moedas', style: 'th', alignment: 'center' },
          { text: 'Cédulas', style: 'th', alignment: 'center' }
        ]];

        all.forEach(c => {
          const coins = coinsByIssuer[c.name] || 0;
          const notes = notesByIssuer[c.name] || 0;
          const has = coins > 0 || notes > 0;
          const fill = has ? OWNED_BG : null;
          const flag = this.flagCache[c.code];

          const qtyCell = (n: number) => ({
            text: String(n),
            fontSize: 9.5,
            bold: n > 0,
            alignment: 'center',
            color: n > 0 ? COPPER : MUTED,
            fillColor: fill
          });

          body.push([
            flag
              ? { image: flag, fit: [22, 15], opacity: has ? 1 : 0.35, fillColor: fill }
              : { text: '', fillColor: fill },
            {
              text: c.name,
              fontSize: 9.5,
              bold: has,
              color: has ? INK : MUTED,
              fillColor: fill
            },
            qtyCell(coins),
            qtyCell(notes)
          ]);
        });

        return {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: [28, '*', 70, 70],
            body
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? INK : null),
            hLineWidth: (i: number) => (i <= 1 ? 0 : 0.5),
            vLineWidth: () => 0,
            hLineColor: () => LINE,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 5,
            paddingBottom: () => 5
          }
        };
      };

      const content: any[] = [
        { text: 'Meus países', fontSize: 28, bold: true, color: INK },
        {
          text: 'Moedas e cédulas por país',
          fontSize: 12,
          bold: true,
          color: COPPER,
          margin: [0, 2, 0, 2]
        },
        {
          text: `Destacado = você tem algum item · gerado em ${today}`,
          fontSize: 8.5,
          color: MUTED,
          margin: [0, 0, 0, 14]
        },
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [[
              stat('PAÍSES', String(totalCountries)),
              stat('COM ITENS', String(withAny), COPPER),
              stat('COM MOEDAS', String(withCoins), COPPER),
              stat('COM CÉDULAS', String(withNotes), COPPER)
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
          margin: [0, 0, 0, 14]
        },

        buildTable()
      ];

      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [20, 70, 20, 40],

        info: { title: 'Meus países - Álbum Numismático', author: 'Álbum Numismático' },
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

        content,

        styles: {
          th: { bold: true, color: '#ffffff', fontSize: 9 },
          statLabel: { fontSize: 7, color: MUTED, characterSpacing: 0.6 },
          statValue: { fontSize: 22, bold: true, margin: [0, 2, 0, 0] }
        }
      };

      pdfMake.createPdf(docDefinition).download('meus-paises-moedas-e-cedulas.pdf');
    } finally {
      this.loadingService.hide();
    }
  }
}
