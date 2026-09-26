
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface Plano {
    id: number;
    nome: string;
    codigo: string;
    valor: string;
    meses: number;
}

@Injectable({
    providedIn: 'root'
})
export class PlanoService {

    constructor(private http: HttpClient) { }

    getPlanos(): Observable<Plano[]> {
        return this.http.get<Plano[]>(`${API_CONFIG.baseUrl}/planos`);
    }

    statusAssinatura(): Observable<any> {
        return this.http.get<any>(`${API_CONFIG.baseUrl}/assinatura/status`);
    }

    pagarAssinatura(planoId: number) {
        return this.http.post<any>(`${API_CONFIG.baseUrl}/assinatura/pagar`, { planoId });
    }
}

