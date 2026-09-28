import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PlanoService } from '../AuthService/planos.service';

@Component({
  selector: 'app-pagamento',
  templateUrl: './pagamento.component.html',
  styleUrls: ['./pagamento.component.css']
})
export class PagamentoComponent implements OnInit {

  plano: any = null;
  pagamento: any = null;
  carregando = false;

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
      },
      error: (error) => {
        console.error('Erro ao iniciar pagamento:', error);

        this.carregando = false;
      }
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
}