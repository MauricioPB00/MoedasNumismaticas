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

    const planoSelecionado = localStorage.getItem('planoSelecionado');

    if (!planoSelecionado) {
      this.router.navigate(['/planos']);
      return;
    }

    this.plano = JSON.parse(planoSelecionado);

    console.log('Plano para pagamento:', this.plano);
  }

  continuarPagamento(): void {

    if (!this.plano || this.carregando) {
      return;
    }

    this.carregando = true;

    this.planoService.pagarAssinatura(this.plano.id).subscribe({

      next: (data) => {

        console.log('Pagamento iniciado:', data);

        this.pagamento = data;

        this.carregando = false;

        this.iniciarVerificacaoPagamento();
      },

      error: (error) => {

        console.error('Erro ao iniciar pagamento:', error);

        this.carregando = false;
      }
    });
  }

  iniciarVerificacaoPagamento(): void {

    console.log('INICIANDO VERIFICAÇÃO DO PAGAMENTO');

    this.verificacaoPagamento?.unsubscribe();

    this.verificacaoPagamento = interval(5000).subscribe(() => {

      console.log('VERIFICANDO ASSINATURA...');

      this.planoService.statusAssinatura().subscribe({

        next: (data) => {

          console.log('STATUS DO PAGAMENTO:', data);

          if (data.acesso === true) {

            console.log('PAGAMENTO CONFIRMADO!');
            console.log('ASSINATURA ATIVA!');

            this.verificacaoPagamento?.unsubscribe();

            localStorage.removeItem('planoSelecionado');

            this.router.navigate(['/']);
          }

        },

        error: (error) => {

          console.error(
            'Erro ao verificar pagamento:',
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

    this.verificacaoPagamento?.unsubscribe();

  }
}