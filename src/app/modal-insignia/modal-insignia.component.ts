import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LoadingService } from '../shared/loading.service';
import { InsigniaService } from '../AuthService/insignia.service';
import { CoinsService } from '../AuthService/coins.service';

interface InsigniaCollection {
  name: string;
  items: any[];
}

@Component({
  selector: 'app-modal-insignia',
  templateUrl: './modal-insignia.component.html',
  styleUrls: ['./modal-insignia.component.css']
})
export class ModalInsigniaComponent {
  @Input() show: boolean = false;
  @Output() closed = new EventEmitter<void>();

  insignias: any[] = [];
  collections: InsigniaCollection[] = [];
  albumItems: any[] = [];

  constructor(
    private loadingService: LoadingService,
    private InsigniaService: InsigniaService,
    private coinsService: CoinsService
  ) { }

  ngOnInit() {
    this.loadingService.show();
    this.getListInsignias();
    this.getAlbum();
  }

  closeModal() {
    this.closed.emit();
  }

  getListInsignias(): void {
    this.InsigniaService.getInsignias().subscribe({
      next: (res) => {
        this.insignias = res || [];
        this.groupInsignias(this.insignias);
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Erro ao buscar insignias:', err);
        this.loadingService.hide();
      }
    });
  }

  groupInsignias(insignias: any[]) {
    const map: any = {
      '🇧🇷 Coleção Brasileira': [],
      '🌍 Coleção Estrangeira': [],
      '🌐 Coleção Global': []
    };

    insignias.forEach(i => {
      if (i.code.startsWith('BRAZIL_')) {
        map['🇧🇷 Coleção Brasileira'].push(i);
      } else if (i.code.startsWith('FOREIGN_')) {
        map['🌍 Coleção Estrangeira'].push(i);
      } else if (i.code.startsWith('GLOBAL_')) {
        map['🌐 Coleção Global'].push(i);
      }
    });

    Object.keys(map).forEach(key => {
      map[key] = this.sortInsignias(map[key]);
    });

    this.collections = Object.keys(map)
      .map(key => ({ name: key, items: map[key] }))
      .filter(col => col.items.length > 0);
  }

  sortInsignias(insignias: any[]) {
    return insignias.sort((a, b) => {
      const getType = (code: string) => {
        if (code.includes('_COINS_')) return 1;
        if (code.includes('_BANKNOTES_')) return 2;
        return 3;
      };

      const t = getType(a.code) - getType(b.code);
      if (t !== 0) return t;

      const getNum = (code: string) => {
        if (code.endsWith('_FULL')) return 9999;
        const m = code.match(/_(\d+)$/);
        return m ? Number(m[1]) : 0;
      };

      return getNum(a.code) - getNum(b.code);
    });
  }

  getAlbum() {
    this.coinsService.getAlbumByUser().subscribe({
      next: (res) => {
        this.albumItems = res || [];
      },
      error: (err) => {
        console.error('Erro ao buscar álbum:', err);
      }
    });
  }

  getBrazilCoinsCount(): number {
    return this.albumItems.filter(i =>
      i.type === 'coin' && i.issuer === 'Brasil'
    ).length;
  }

  getBrazilBanknotesCount(): number {
    return this.albumItems.filter(i =>
      i.type === 'banknote' && i.issuer === 'Brasil'
    ).length;
  }

  getForeignCoinsCountriesCount(): number {
    const issuers = this.albumItems
      .filter(i => i.type === 'coin' && i.issuer !== 'Brasil')
      .map(i => i.issuer);

    return new Set(issuers).size;
  }

  getForeignBanknotesCountriesCount(): number {
    const issuers = this.albumItems
      .filter(i => i.type === 'banknote' && i.issuer !== 'Brasil')
      .map(i => i.issuer);

    return new Set(issuers).size;
  }

  getGlobalCount(): number {
    return new Set(
      this.albumItems.map(i => `${i.type}-${i.id}`)
    ).size;
  }

  isNextInsignia(insignia: any, list: any[]): boolean {
    if (insignia.unlocked) return false;
    if (insignia.code.endsWith('_FULL')) return false;

    let prefix = '';

    if (insignia.code.startsWith('BRAZIL_')) {
      prefix = insignia.code.split('_').slice(0, 3).join('_');
    }

    if (insignia.code.startsWith('FOREIGN_')) {
      prefix = insignia.code.split('_').slice(0, 3).join('_');
    }

    if (insignia.code.startsWith('GLOBAL_')) {
      prefix = 'GLOBAL_COLLECTOR';
    }

    const blocked = list
      .filter(i =>
        i.code.startsWith(prefix) &&
        !i.unlocked &&
        !i.code.endsWith('_FULL')
      )
      .sort((a, b) => this.getTarget(a) - this.getTarget(b));

    return blocked.length > 0 && blocked[0] === insignia;
  }

  getTarget(insignia: any): number {
    return Number(insignia.code.split('_').pop());
  }

  getCurrentCount(insignia: any): number {
    const code = insignia.code;

    if (code.startsWith('BRAZIL_COLLECTOR_COINS_')) {
      return this.getBrazilCoinsCount();
    }

    if (code.startsWith('BRAZIL_COLLECTOR_BANKNOTES_')) {
      return this.getBrazilBanknotesCount();
    }

    if (code.startsWith('FOREIGN_COLLECTOR_COINS_')) {
      return this.getForeignCoinsCountriesCount();
    }

    if (code.startsWith('FOREIGN_COLLECTOR_BANKNOTES_')) {
      return this.getForeignBanknotesCountriesCount();
    }

    if (code.startsWith('GLOBAL_COLLECTOR_')) {
      return this.getGlobalCount();
    }
    return 0;
  }
}
