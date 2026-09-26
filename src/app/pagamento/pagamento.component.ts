
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
    if (!this.plano) {
      return;
    }

    this.planoService.pagarAssinatura(this.plano.id).subscribe({
      next: (data) => {
        console.log('Pagamento iniciado:', data);
      },
      error: (error) => {
        console.error('Erro ao iniciar pagamento:', error);
      }
    });
  }
}
