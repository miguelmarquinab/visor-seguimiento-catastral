import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormGroup, FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService} from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loading: boolean = false;
  error : string = '';
  form!: FormGroup;

  constructor (
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      username: ['87654321', Validators.required],
      password: ['Abc*2025', Validators.required],
    });

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
        this.loading = false;
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.loading = false;
        this.error = 'Usuario o contraseña inválidos';
      }
    });

  }
}
