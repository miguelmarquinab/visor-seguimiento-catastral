import { Routes } from '@angular/router';
import { authGuard} from './core/auth/auth.guard';
import {AppComponent} from './app.component';
import {LoginComponent} from './components/pages/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent : () =>
        import('./components/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent : () =>
        import('./components/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children:[
      {
        path:'',
        pathMatch:'full',
        redirectTo: 'distritos'
      },
      {
        path:'distritos',
        loadComponent : () =>
          import('./components/pages/distritos/distritos/distritos.component').then(m => m.DistritosComponent)
      }
    ]
  },
  {
    path: '**', redirectTo: ''
  }
];
