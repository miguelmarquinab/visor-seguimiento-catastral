import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormGroup, FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService} from '../../../core/auth/auth.service';
import { SessionstateServiceService} from '../../../services/sessionstate.service.service';
import { environment} from '../../../../environments/environment';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule, MatIconModule,
    MatProgressSpinnerModule,
    RecaptchaModule,
    RecaptchaFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loading: boolean = false;
  error : string = '';
  form!: FormGroup;
  hidePassword = true;
  keysite: string = "";

  constructor (
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly sessionState : SessionstateServiceService
  ) {
    this.keysite = environment.keySiteCatpcha;
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      recaptcha: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/distritos']);
      return;
    }

    const sessionExpired = this.route.snapshot.queryParamMap.get('sessionExpired') === '1';
    if (sessionExpired) {
      this.error = 'Sesión expirada, debes iniciar sesión.';
    }
  }

  submit() : void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.form.value.recaptcha;
    if (!token) {
      this.error = 'Completa el reCAPTCHA.';
      return;
    }

    const credentials = {
      username: this.form.value.username!,
      password: this.form.value.password!,
      recaptchaToken: token
    };

    this.loading = true;

    this.auth.login(credentials).subscribe({
      next: () => {
        this.sessionState.setBuscador();
        this.router.navigate(['/distritos']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Usuario o contraseña inválidos';
      }
    });
  }
}
