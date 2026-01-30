import { Routes } from '@angular/router';
import { authGuard} from './core/auth/auth.guard';
import {ubigeoResolver} from './core/ubigeo/ubigeo.resolver';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent : () =>
        import('./components/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    resolve: { ubigeoData: ubigeoResolver },
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
