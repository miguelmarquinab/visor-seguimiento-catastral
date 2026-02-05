import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormGroup, FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService} from '../../../core/auth/auth.service';
import { SessionstateServiceService} from '../../../services/sessionstate.service.service';

// Angular Material
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
    MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loading: boolean = false;
  error : string = '';
  form!: FormGroup;
  hidePassword = true;

  constructor (
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private sessionState : SessionstateServiceService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/distritos']);
    }
  }


  submit() : void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const credentials = {
      username: this.form.value.username!,
      password: this.form.value.password!
    };

    this.auth.login(credentials).subscribe({
      next: () => {
        this.sessionState.setBuscador();
        //this.router.navigateByUrl('/');
        this.router.navigate(['/distritos']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Usuario o contraseña inválidos';
      }
    });

  }
}
