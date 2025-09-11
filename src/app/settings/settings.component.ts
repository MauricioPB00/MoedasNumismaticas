import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: any = {};

  constructor(private http: HttpClient) { }

  ngOnInit() {
    // Pega os dados do localStorage para preencher o formulário
    const controleUsuario = localStorage.getItem('ControleUsuario');
    if (controleUsuario) {
      this.user = JSON.parse(controleUsuario);
    }
  }

  onSubmit() {
  const token = localStorage.getItem('jwt'); // pega o JWT
  console.log(token);
  if (!token) {
    alert('Usuário não autenticado');
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  this.http.put<any>('http://localhost:8000/api/update', JSON.stringify(this.user), { headers })
  .subscribe({
    next: (res) => {
      console.log(res);
      localStorage.setItem('jwt', res.token); // agora o TS aceita
      alert('Dados atualizados com sucesso!');
    },
    error: (err) => {
      console.error(err);
      alert('Erro ao atualizar dados');
    }
  });
}

}
