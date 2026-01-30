import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import {map, Observable, shareReplay} from 'rxjs';
import { environment} from '../../../environments/environment';
import {UbigeoItemDto, UbigeoResponse} from '../../interfaces/UbigeoItemDto';

@Injectable({
  providedIn: 'root'
})
export class UbigeoService {

  private cache$?: Observable<UbigeoItemDto[]>;
  constructor(private http : HttpClient) { }

  listar() : Observable<UbigeoItemDto[]>{
    //return this.http.get<UbigeoItemDto>(`${environment.urlWebApiSecurity}consultaDatosUsuarioPorNomb`);
    this.cache$ ??= this.http
      .get<UbigeoResponse>(`${environment.urlWebApiSecurity}ubigeo/listar`)
      .pipe(
        map(res => res.data),
        shareReplay(1)
      );
    return this.cache$;
  }
}
