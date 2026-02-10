import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LoadingService } from '../shared/loading.service';
import { InsigniaService } from '../AuthService/insignia.service';

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


  constructor(
    private loadingService: LoadingService,
    private InsigniaService: InsigniaService
  ) { }

  ngOnInit() {
    this.loadingService.show();
    this.getListInsignias();
    this.loadingService.hide();
  }

  closeModal() {
    this.closed.emit();
  }

  getListInsignias(): void {
    this.loadingService.show();
    this.InsigniaService.getInsignias().subscribe({
      next: (res) => {
        this.groupInsignias(res);
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
    map['🌍 Coleção Estrangeira'] =
      this.sortInsignias(map['🌍 Coleção Estrangeira']);
    this.collections = Object.keys(map)
      .map(key => ({
        name: key,
        items: map[key]
      }))
      .filter(col => col.items.length > 0);
  }

  sortInsignias(insignias: any[]) {
    return insignias.sort((a, b) => {
      const typeOrder = (code: string) => {
        if (code.includes('_COINS_')) return 1;
        if (code.includes('_BANKNOTES_')) return 2;
        return 3;
      };

      const typeDiff = typeOrder(a.code) - typeOrder(b.code);
      if (typeDiff !== 0) return typeDiff;

      const extractNumber = (code: string) => {
        if (code.endsWith('_FULL')) return 9999;
        const match = code.match(/_(\d+)$/);
        return match ? Number(match[1]) : 0;
      };
      return extractNumber(a.code) - extractNumber(b.code);
    });
  }
}
