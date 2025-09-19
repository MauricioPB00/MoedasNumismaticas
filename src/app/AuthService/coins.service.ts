// src/app/services/coin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class CoinsService {
  constructor(private http: HttpClient) { }

  getCoin(id: number): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.baseUrl}/coins/${id}`);
  }
}
