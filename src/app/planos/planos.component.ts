import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PlanoService, Plano } from '../AuthService/planos.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-planos',
  templateUrl: './planos.component.html',
  styleUrls: ['./planos.component.css']
})
export class PlanosComponent implements OnInit, OnDestroy {

  planos: Plano[] = [];

  carregando = false;

  pagamento: any = null;

  planoSelecionado: Plano | null = null;

  private verificacaoPagamento?: Subscription;

  constructor(
    private planoService: PlanoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.carregarPlanos();
  }

  carregarPlanos(): void {

    this.carregando = true;

    this.planoService.getPlanos().subscribe({

      next: (planos) => {

        this.planos = planos;

        this.carregando = false;

        // console.log('PLANOS:', planos);

      },

      error: (error) => {

        this.carregando = false;

        console.error(
          'ERRO AO CARREGAR PLANOS:',
          error
        );

      }

    });

  }

  assinar(plano: Plano): void {

    if (this.carregando || this.pagamento) {
      return;
    }

    // console.log(
    //   '========== CRIANDO PAGAMENTO =========='
    // );

    // console.log(
    //   'PLANO:',
    //   plano
    // );

    this.planoSelecionado = plano;

    this.carregando = true;

    this.planoService
      .pagarAssinatura(plano.id)
      .subscribe({

        next: (data) => {

          // console.log(
          //   'PAGAMENTO CRIADO:',
          //   data
          // );

          this.pagamento = data;

          this.carregando = false;

          this.iniciarVerificacaoPagamento();

          setTimeout(() => {

            const pixContainer =
              document.querySelector('.pix-container');

            if (pixContainer) {

              pixContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });

            }

          }, 100);

        },

        error: (error) => {

          console.error(
            'ERRO AO CRIAR PAGAMENTO:',
            error
          );

          this.carregando = false;

          this.planoSelecionado = null;

          alert(
            error?.error?.message ||
            'Não foi possível gerar o pagamento.'
          );

        }

      });

  }

  iniciarVerificacaoPagamento(): void {

    // console.log(
    //   '========== INICIANDO VERIFICAÇÃO =========='
    // );

    this.verificacaoPagamento?.unsubscribe();

    const assinaturaId =
      this.pagamento?.assinaturaId;

    if (!assinaturaId) {

      console.error(
        'ASSINATURA ID NÃO ENCONTRADO'
      );

      return;

    }

    // console.log(
    //   'VERIFICANDO ASSINATURA:',
    //   assinaturaId
    // );

    this.verificacaoPagamento =
      interval(5000).subscribe(() => {

        // console.log(
        //   'VERIFICANDO STATUS:',
        //   assinaturaId
        // );

        this.planoService
          .statusPagamento(assinaturaId)
          .subscribe({

            next: (data) => {

              // console.log(
              //   'STATUS DO PAGAMENTO:',
              //   data
              // );

              if (data.status === 'ativo') {

                // console.log(
                //   'PAGAMENTO CONFIRMADO!'
                // );

                this.verificacaoPagamento
                  ?.unsubscribe();

                this.pagamento = null;

                this.planoSelecionado = null;

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

    const codigoPix =
      this.pagamento?.pix?.qrCode;

    if (!codigoPix) {
      return;
    }

    navigator.clipboard
      .writeText(codigoPix)
      .then(() => {

        alert(
          'Código PIX copiado!'
        );

      });

  }

  cancelarPagamento(): void {

    this.verificacaoPagamento
      ?.unsubscribe();

    this.pagamento = null;

    this.planoSelecionado = null;

  }

  ngOnDestroy(): void {

    // console.log(
    //   'PLANOS DESTRUÍDO'
    // );

    this.verificacaoPagamento
      ?.unsubscribe();

  }

}