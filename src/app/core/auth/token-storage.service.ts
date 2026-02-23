import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  private readonly KEY = 'AUTH_TOKEN';

  set(token: string) { localStorage.setItem(this.KEY, token); }
  get(): string | null { return localStorage.getItem(this.KEY); }
  clear() { localStorage.removeItem(this.KEY); }
  has(): boolean { return !!this.get(); }

}
