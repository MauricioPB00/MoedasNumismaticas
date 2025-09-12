import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: any = {};
  showForm = false;
  showPhoto = false
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    const controleUsuario = localStorage.getItem('ControleUsuario');
    if (controleUsuario) {
      this.user = JSON.parse(controleUsuario);
    }
  }


  toggleForm() {
    this.showForm = !this.showForm;
  }

  togglePhoto() {
    this.showPhoto = !this.showPhoto;

    if (this.showPhoto) {
      this.previewUrl = null;

      const token = localStorage.getItem('jwt');
      this.http.get('http://localhost:8000/api/informacao', {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe((res: any) => {
        this.user = res; // atualiza dados do usuário
      });
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result; // mostra preview da foto escolhida
      };
      reader.readAsDataURL(this.selectedFile);
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
          localStorage.setItem('jwt', res.token);
          alert('Dados atualizados com sucesso!');
          this.showForm = false;
        },
        error: (err) => {
          console.error(err);
          alert('Erro ao atualizar dados');
        }
      });
  }

  onSubmitPhoto() {
    const token = localStorage.getItem('jwt');
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('photo', this.selectedFile);

    this.http.post('http://localhost:8000/api/photo', formData, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe((res: any) => {
      this.user.photo = res.photo; // backend retorna nome salvo
      this.previewUrl = null;      // volta a exibir a foto oficial do banco
      this.selectedFile = null;
    });
  }

}
