import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DistritosService } from '../../../../services/distritos.service';
import { Organizacion } from '../../../../models/organizacion.model';

@Component({
  // selector: 'app-distritos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './distritos.component.html',
  styleUrl: './distritos.component.css'
})
export class DistritosComponent implements OnInit {

  search = new FormControl<string>('', { nonNullable: true });

  items: Organizacion[] = [];

  page = 0;
  size = 6;

  total = 0;
  totalPages = 1;

  loading = false;

  constructor(private distritos: DistritosService) {}

  ngOnInit(): void {
    this.cargar('', 0);
  }

  onBuscar(): void {
    const q = this.search.value.trim();
    this.cargar(q, 0);
  }

  onEnter(ev: KeyboardEvent): void {
    if (ev.key === 'Enter') this.onBuscar();
  }

  prev(): void {
    if (this.page > 0) {
      this.cargar(this.search.value.trim(), this.page - 1);
    }
  }

  next(): void {
    if (this.page + 1 < this.totalPages) {
      this.cargar(this.search.value.trim(), this.page + 1); // ✅ FIX (antes estaba -1)
    }
  }

  private cargar(nombre: string, page: number): void {
    this.loading = true;

    this.distritos.buscar(nombre, page, this.size).subscribe({
      next: (res) => {
        const organizaciones = res?.data?.organizaciones ?? [];

        this.items = organizaciones;
        this.page = page;

        // El backend te está mandando total=0, así que hacemos fallback para que no salga NaN.
        const totalApi = res?.total ?? 0;
        this.total = totalApi > 0 ? totalApi : (page === 0 ? organizaciones.length : this.total);

        // Si total es 0, no se puede paginar real. Dejamos mínimo 1.
        this.totalPages = Math.max(1, Math.ceil(this.total / this.size));

        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.total = 0;
        this.totalPages = 1;
        this.loading = false;
      }
    });
  }
}
