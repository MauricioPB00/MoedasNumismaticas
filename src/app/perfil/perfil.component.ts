import {
  Component,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  PerfilService
} from '../AuthService/perfil.service';

import {
  CoinsService
} from '../AuthService/coins.service'; // AJUSTE o caminho para o seu CoinsService

import {
  environment
} from 'src/environments/environment';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  perfil: any = null;
  carregando = true;
  erro = false;
  environment = environment;

  // ---------- filtro e ordenação das peças repetidas ----------
  typeFilter: 'all' | 'coin' | 'banknote' = 'all';
  sortBy: 'quantity' | 'title' | 'year' = 'quantity';
  sortDir: 'asc' | 'desc' = 'desc'; // por padrão: as com mais unidades primeiro

  // ---------- comparação com o MEU álbum ----------
  ownedKeys = new Set<string>();
  albumLoaded = false;   // só mostra as marcações depois que o meu álbum carregou
  onlyMissing = false;   // filtro "Que não tenho"
  issuerFilter = '';     // filtro por país/emissor ('' = todos)

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private perfilService: PerfilService,
    private coinsService: CoinsService
  ) { }

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );
    if (!id) {
      this.erro = true;
      this.carregando = false;
      return;
    }
    this.carregarPerfil(id);
    this.carregarMeuAlbum();
  }

  carregarPerfil(id: number): void {
    this.carregando = true;
    this.erro = false;

    // volta o filtro ao padrão ao abrir outro perfil
    this.typeFilter = 'all';
    this.sortBy = 'quantity';
    this.sortDir = 'desc';
    this.onlyMissing = false;
    this.issuerFilter = '';

    this.perfilService
      .getPerfil(id)
      .subscribe({
        next: (res) => {
          console.log('PERFIL:', res);
          this.perfil = res;
          this.carregando = false;
        },

        error: (err) => {
          console.error(
            'Erro ao carregar perfil:',
            err
          );
          this.erro = true;
          this.carregando = false;
        }
      });
  }

  // =========================================================
  // MEU ÁLBUM (para saber o que eu tenho / não tenho)
  // =========================================================

  /** carrega as peças que EU tenho para comparar com as repetidas do perfil */
  carregarMeuAlbum(): void {
    this.coinsService.getAlbumByUser().subscribe({
      next: (res: any[]) => {
        this.ownedKeys = new Set((res || []).map(i => this.getItemKey(i)));
        this.albumLoaded = true;

        // DEBUG: descomente para conferir se as chaves batem
        // console.log('MINHAS CHAVES:', [...this.ownedKeys]);
        // console.log('EXEMPLO REPETIDA:', this.repeatedAll[0], this.getItemKey(this.repeatedAll[0]));
      },
      error: (err) => {
        console.error('Erro ao carregar meu álbum:', err);
        this.albumLoaded = false; // sem álbum, não marca nada (evita falso "não tenho")
      }
    });
  }

  /**
   * Chave única da peça. AJUSTE os campos conforme o retorno da sua API:
   * o item do álbum e o item de "repeated" precisam gerar a MESMA chave.
   * Se o álbum não tiver "type", remova o type da chave.
   */
  private getItemKey(item: any): string {
    const id = item?.coin_id ?? item?.coinId ?? item?.id;
    return `${item?.type ?? ''}:${id}`;
  }

  /** true quando EU não tenho essa peça */
  isMissing(item: any): boolean {
    return this.albumLoaded && !this.ownedKeys.has(this.getItemKey(item));
  }

  /** quantas repetidas do perfil eu não tenho */
  get missingCount(): number {
    return this.repeatedAll.filter(i => this.isMissing(i)).length;
  }

  toggleOnlyMissing(): void {
    this.onlyMissing = !this.onlyMissing;
  }

  // =========================================================
  // HELPERS DO PERFIL
  // =========================================================

  getUserPhotoPath(photo: string | null): string {
    if (!photo) {
      return 'assets/img/default-user.png';
    }
    return `${this.environment.API_URL}/uploads/users/${photo}`;
  }

  getImagePath(image: string | null): string {
    if (!image) {
      return '';
    }
    return `assets/img/imagens/${image}`;
  }

  voltar(): void {
    this.router.navigate(['/user']);
  }

  formatSince(date: string | null): string {
    if (!date) {
      return '';
    }
    const parts = date.split('-');
    if (parts.length !== 3) {
      return date;
    }
    return parts[0];
  }

  getCollectionPercentage(): number {
    if (!this.perfil?.stats) {
      return 0;
    }
    const items = this.perfil.stats.items || 0;
    if (items >= 1000) {
      return 100;
    }
    return Math.min(
      Math.round((items / 1000) * 100),
      100
    );
  }

  // =========================================================
  // FILTRO (Todas / Moedas / Cédulas / Que não tenho) E ORDENAÇÃO
  // =========================================================

  /** todas as repetidas do perfil */
  get repeatedAll(): any[] {
    return this.perfil?.repeated ?? [];
  }

  get coinsCount(): number {
    return this.repeatedAll.filter(i => i.type === 'coin').length;
  }

  get banknotesCount(): number {
    return this.repeatedAll.filter(i => i.type === 'banknote').length;
  }

  /** lista de países/emissores presentes nas repetidas (sem repetir, em ordem alfabética) */
  get issuers(): string[] {
    const set = new Set<string>(
      this.repeatedAll
        .map(i => (i.issuer || '').trim())
        .filter(Boolean)
    );
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }

  /** quantas repetidas existem de um país (mostrado no select) */
  issuerCount(issuer: string): number {
    return this.repeatedAll.filter(i => (i.issuer || '').trim() === issuer).length;
  }

  setIssuerFilter(issuer: string): void {
    this.issuerFilter = issuer;
  }

  /** limpa todos os filtros (usado no botão "Ver todas") */
  clearFilters(): void {
    this.typeFilter = 'all';
    this.onlyMissing = false;
    this.issuerFilter = '';
  }

  /** só mostra a opção "Ano" se alguma peça tiver ano */
  get hasYears(): boolean {
    return this.repeatedAll.some(i => this.getItemYear(i) !== null);
  }

  /** repetidas já filtradas e ordenadas (é isso que o HTML lista) */
  get filteredRepeated(): any[] {
    const list = this.repeatedAll.filter(
      i => (this.typeFilter === 'all' || i.type === this.typeFilter)
        && (!this.onlyMissing || this.isMissing(i))
        && (!this.issuerFilter || (i.issuer || '').trim() === this.issuerFilter)
    );

    const dir = this.sortDir === 'asc' ? 1 : -1;
    const byTitle = (a: any, b: any) =>
      (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' });

    return [...list].sort((a, b) => {
      let result = 0;

      if (this.sortBy === 'quantity') {
        result = (Number(a.quantity) || 0) - (Number(b.quantity) || 0);
      } else if (this.sortBy === 'year') {
        const ya = this.getItemYear(a);
        const yb = this.getItemYear(b);
        // peças sem ano ficam sempre por último
        if (ya === null && yb === null) result = 0;
        else if (ya === null) return 1;
        else if (yb === null) return -1;
        else result = ya - yb;
      } else {
        result = byTitle(a, b);
      }

      // desempate por título, para a ordem não "pular"
      if (result === 0) result = byTitle(a, b);

      return result * dir;
    });
  }

  /** texto do botão de ordem, de acordo com o campo escolhido */
  get sortDirLabel(): string {
    if (this.sortBy === 'title') {
      return this.sortDir === 'asc' ? 'A → Z' : 'Z → A';
    }
    if (this.sortBy === 'year') {
      return this.sortDir === 'asc' ? 'Mais antigas' : 'Mais recentes';
    }
    return this.sortDir === 'asc' ? 'Menos unidades' : 'Mais unidades';
  }

  setTypeFilter(type: 'all' | 'coin' | 'banknote'): void {
    this.typeFilter = type;
  }

  setSortBy(field: string): void {
    if (field === 'quantity' || field === 'title' || field === 'year') {
      this.sortBy = field;
    }
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
  }

  /** evita recriar os cartões quando a ordem muda */
  trackByItem(_index: number, item: any): string | number {
    return item.id ?? `${item.type}-${item.title}`;
  }

  /** tenta achar o ano da peça em campos comuns (year, min_year, minYear) */
  private getItemYear(item: any): number | null {
    const raw = item?.year ?? item?.min_year ?? item?.minYear ?? null;
    if (raw === null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}