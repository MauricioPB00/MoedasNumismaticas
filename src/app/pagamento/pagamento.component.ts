import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PlanoService } from '../AuthService/planos.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-pagamento',
  templateUrl: './pagamento.component.html',
  styleUrls: ['./pagamento.component.css']
})
export class PagamentoComponent implements OnInit, OnDestroy {

  plano: any = null;
  pagamento: any = null;
  carregando = false;

  private verificacaoPagamento?: Subscription;

  constructor(
    private router: Router,
    private planoService: PlanoService
  ) {}

  ngOnInit(): void {

    console.log('========== PAGAMENTO ==========');

    const planoSelecionado = localStorage.getItem('planoSelecionado');

    if (!planoSelecionado) {
      console.log('SEM PLANO → PLANOS');
      this.router.navigate(['/planos']);
      return;
    }

    try {

      this.plano = JSON.parse(planoSelecionado);

      console.log('PLANO:', this.plano);

    } catch (error) {

      console.error('ERRO AO LER PLANO:', error);

      localStorage.removeItem('planoSelecionado');

      this.router.navigate(['/planos']);
    }
  }

  continuarPagamento(): void {

    if (!this.plano || this.carregando) {
      return;
    }

    this.carregando = true;

    console.log('CRIANDO PAGAMENTO PARA PLANO:', this.plano.id);

    this.planoService.pagarAssinatura(this.plano.id).subscribe({

      next: (data) => {

        console.log('PAGAMENTO CRIADO:', data);

        this.pagamento = data;

        this.carregando = false;

        this.iniciarVerificacaoPagamento();
      },

      error: (error) => {

        console.error('ERRO AO CRIAR PAGAMENTO:', error);

        this.carregando = false;
      }
    });
  }

  iniciarVerificacaoPagamento(): void {

  console.log('========== INICIANDO VERIFICAÇÃO ==========');

  this.verificacaoPagamento?.unsubscribe();

  const assinaturaId = this.pagamento?.assinaturaId;

  if (!assinaturaId) {
    console.error('ASSINATURA ID NÃO ENCONTRADO');
    return;
  }

  console.log('VERIFICANDO ASSINATURA:', assinaturaId);

  this.verificacaoPagamento = interval(5000).subscribe(() => {

    console.log(
      'VERIFICANDO STATUS DA ASSINATURA:',
      assinaturaId
    );

    this.planoService.statusPagamento(assinaturaId).subscribe({

      next: (data) => {

        console.log('STATUS DO PAGAMENTO:', data);

        if (data.status === 'ativo') {

          console.log('PAGAMENTO CONFIRMADO!');
          console.log('ASSINATURA ATIVA!');

          this.verificacaoPagamento?.unsubscribe();

          localStorage.removeItem('planoSelecionado');

          this.router.navigate(['/']);
        }

      },

      error: (error) => {

        console.error(
          'ERRO AO VERIFICAR PAGAMENTO:',
          error
        );

      }

    });

  });
}

  copiarPix(): void {

    const codigoPix = this.pagamento?.pix?.qrCode;

    if (!codigoPix) {
      return;
    }

    navigator.clipboard.writeText(codigoPix).then(() => {

      alert('Código PIX copiado!');

    });
  }

  ngOnDestroy(): void {

    console.log('PAGAMENTO DESTRUÍDO');

    this.verificacaoPagamento?.unsubscribe();
  }
}