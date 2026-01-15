import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DistritosService } from '../../../../services/distritos.service';
import { Router } from '@angular/router';

export interface Distrito {
  idOrganizacion: number;
  nombreOrganizacion: string;
  codigoUbigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  logo?: string | null;
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './distritos.component.html',
  styleUrls: ['./distritos.component.css'],
})
export class DistritosComponent implements OnInit {
  search = new FormControl('');
  items: Distrito[] = [];
  loading = false;

  selectedIds = new Set<number>();

  constructor(private distritos: DistritosService, private router: Router) { }

  ngOnInit(): void {
    this.cargar('', 0);
  }

  onBuscar(): void {
    const q = (this.search.value ?? '').trim();
    this.cargar(q, 0);
  }

  onEnter(ev: KeyboardEvent): void {
    if (ev.key === 'Enter') this.onBuscar();
  }

  toggle(d: Distrito): void {
    if (this.selectedIds.has(d.idOrganizacion)) this.selectedIds.delete(d.idOrganizacion);
    else this.selectedIds.add(d.idOrganizacion);
  }

  isSelected(d: Distrito): boolean {
    return this.selectedIds.has(d.idOrganizacion);
  }

  agregar(): void {
    const selected = this.items.filter(x => this.selectedIds.has(x.idOrganizacion));
    localStorage.setItem('distritos_seleccionados', JSON.stringify(selected));


    //this.router.navigateByUrl('/mapa');
    console.log('Seleccionados:', selected);
  }

  private cargar(nombre: string, page: number): void {
    this.loading = true;

    this.distritos.buscar(nombre, page, 6).subscribe({
      next: (res) => {
        const orgs: Distrito[] = res?.data?.organizaciones ?? [];

        this.items = [...orgs]
          .sort((a, b) => (a.distrito ?? '').localeCompare(b.distrito ?? ''))
          .slice(0, 6);

        this.selectedIds.clear();

        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.selectedIds.clear();
        this.loading = false;
      },
    });
  }
}



// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { DistritosService } from '../../../../services/distritos.service';
// import { Organizacion } from '../../../../models/organizacion.model';
//
// @Component({
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './distritos.component.html',
//   styleUrl: './distritos.component.css'
// })
// export class DistritosComponent implements OnInit {
//
//   search = new FormControl<string>('', { nonNullable: true });
//   items: Organizacion[] = [];
//   page = 0;
//   size = 6;
//   total = 0;
//   totalPages = 1;
//   loading = false;
//
//   selectedId = new Set<number>();
//
//   constructor(
//     private distritosService: DistritosService,
//     private router: Router) {}
//
//   ngOnInit(): void {
//     this.cargar('', 0);
//   }
//
//   onBuscar(): void {
//     const q = this.search.value.trim();
//     this.cargar(q, 0);
//   }
//
//   onEnter(ev: KeyboardEvent): void {
//     if (ev.key === 'Enter') this.onBuscar();
//   }
//
//   prev(): void {
//     if (this.page > 0) {
//       this.cargar(this.search.value.trim(), this.page - 1);
//     }
//   }
//
//   next(): void {
//     if (this.page + 1 < this.totalPages) {
//       this.cargar(this.search.value.trim(), this.page + 1);
//     }
//   }
//
//   toggleSelection(org: Organizacion): void {
//     if (this.selectedId.has(org.idOrganizacion)) this.selectedId.delete(org.idOrganizacion);
//     else this.selectedId.add(org.idOrganizacion);
//   }
//
//   isSelected(org: Organizacion):boolean {
//     return this.selectedId.has(org.idOrganizacion);
//   }
//
//   agregar(): void {
//     const selected = this.items.filter(x => this.selectedId.has(x.idOrganizacion));
//     localStorage.setItem('distritos_seleccionados', JSON.stringify(selected));
//     this.router.navigateByUrl('/mapa');
//   }
//
//   private cargar(nombre: string, page: number): void {
//     this.loading = true;
//
//     this.distritosService.buscar(nombre, page, this.size).subscribe({
//       next: (res) => {
//         const orgs  = res?.data?.organizaciones ?? [];
//         this.items = orgs ;
//         this.page = page;
//         this.total = res?.total ?? orgs.length;
//         this.totalPages = Math.max(1, Math.ceil(this.total / this.size));
//
//         this.loading = false;
//       },
//       error: () => {
//         this.items = [];
//         this.total = 0;
//         this.totalPages = 1;
//         this.loading = false;
//       }
//     });
//   }
// }
