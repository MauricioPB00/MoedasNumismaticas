import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface CoinsResponse {
  data: any[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CollectionPageResponse {
  data: any[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CoinService {

  constructor(
    private http: HttpClient
  ) { }

  getCoins(
    issuer: string = 'Brasil',
    page: number = 1,
    limit: number = 24,
    searchName: string = '',
    category: string = '',
    minYear: number | null = null,
    maxYear: number | null = null
  ): Observable<CoinsResponse> {

    let params = new HttpParams()
      .set('issuer', issuer)
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (searchName) {
      params = params.set(
        'searchName',
        searchName
      );
    }

    if (category) {
      params = params.set(
        'category',
        category
      );
    }

    if (minYear !== null) {
      params = params.set(
        'minYear',
        minYear.toString()
      );
    }

    if (maxYear !== null) {
      params = params.set(
        'maxYear',
        maxYear.toString()
      );
    }

    return this.http.get<CoinsResponse>(
      `${API_CONFIG.baseUrl}/coin/list/collection`,
      {
        params
      }
    );
  }

  getCoinsPdf(params: {
    issuer: string;
    type: 'coins' | 'banknotes';
    page: number;
    limit: number;
    minYear?: number;
    maxYear?: number;
    sort?: 'asc' | 'desc';
  }): Observable<CollectionPageResponse> {

    let httpParams = new HttpParams()
      .set('issuer', params.issuer)
      .set('type', params.type)
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.minYear !== undefined) {
      httpParams = httpParams.set(
        'minYear',
        params.minYear.toString()
      );
    }

    if (params.maxYear !== undefined) {
      httpParams = httpParams.set(
        'maxYear',
        params.maxYear.toString()
      );
    }

    if (params.sort) {
      httpParams = httpParams.set(
        'sort',
        params.sort
      );
    }

    return this.http.get<CollectionPageResponse>(
      `${API_CONFIG.baseUrl}/coin/list/collection/pdf`,
      { params: httpParams }
    );
  }
}