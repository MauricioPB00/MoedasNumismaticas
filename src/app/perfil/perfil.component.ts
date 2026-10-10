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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private perfilService: PerfilService
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
  }

  carregarPerfil(id: number): void {
    this.carregando = true;
    this.erro = false;

    // volta o filtro ao padrão ao abrir outro perfil
    this.typeFilter = 'all';
    this.sortBy = 'quantity';
    this.sortDir = 'desc';

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
  // FILTRO (Todas / Moedas / Cédulas) E ORDENAÇÃO DAS REPETIDAS
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

  /** só mostra a opção "Ano" se alguma peça tiver ano */
  get hasYears(): boolean {
    return this.repeatedAll.some(i => this.getItemYear(i) !== null);
  }

  /** repetidas já filtradas e ordenadas (é isso que o HTML lista) */
  get filteredRepeated(): any[] {
    const list = this.repeatedAll.filter(
      i => this.typeFilter === 'all' || i.type === this.typeFilter
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