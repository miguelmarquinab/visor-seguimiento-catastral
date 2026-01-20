import { Injectable } from '@angular/core';

//const TOKEN_KEY = 'SESSION_TOKEN';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
/*
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  clear(): void{
    localStorage.removeItem(TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

 */
  private readonly KEY = 'AUTH_TOKEN';

  set(token: string) { localStorage.setItem(this.KEY, token); }
  get(): string | null { return localStorage.getItem(this.KEY); }
  clear() { localStorage.removeItem(this.KEY); }
  has(): boolean { return !!this.get(); }


}
