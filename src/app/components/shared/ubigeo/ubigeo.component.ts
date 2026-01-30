import {Component, EventEmitter, inject, Input, Output, OnInit, input} from '@angular/core';
import { CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import { UbigeoFacade} from '../../../core/ubigeo/ubigeo.facade';
import { UbigeoService} from '../../../core/ubigeo/ubigeo.service';
import { toSignal} from '@angular/core/rxjs-interop';
import { switchMap, of, startWith } from 'rxjs';

@Component({
  selector: 'app-ubigeo-selector',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ubigeo.component.html',
  styleUrl: './ubigeo.component.css'
})
export class UbigeoComponent  implements OnInit {
  private fb = inject(FormBuilder);
  private facade = inject(UbigeoFacade);

  @Input()showTodos = true;
  @Output() distritoChange = new EventEmitter<{ubigeo: string, distrito : string}>();

  form = this.fb.group({
    departamento: [''],
    provincia: [''],
    distrito: [''],
  });

  departamentos = toSignal(this.facade.departamentos$, {initialValue : []});

  //
  provincias = toSignal(
    this.form.get('departamento')!.valueChanges.pipe(
      startWith(this.form.get('departamento')?.value || ''), // <--- AGREGAR ESTO
      switchMap(depto => depto ? this.facade.provincias$(depto) : of([]))
    ), { initialValue: [] }
  );

  // Escuchamos cambios en provincia para traer distritos
  // distritos = toSignal(
  //   this.form.get('provincia')!.valueChanges.pipe(
  //     switchMap(prov => {
  //       const depto = this.form.get('departamento')?.value;
  //       return (depto && prov) ? this.facade.distritos$(depto, prov) : of([]);
  //     })
  //   ), { initialValue: [] }
  // );
  distritos = toSignal(
    this.form.get('provincia')!.valueChanges.pipe(
      startWith(this.form.get('provincia')?.value || ''), // <--- AGREGAR ESTO
      switchMap(prov => {
        const depto = this.form.get('departamento')?.value;
        return (depto && prov) ? this.facade.distritos$(depto, prov) : of([]);
      })
    ), { initialValue: [] }
  );

  ngOnInit(): void {
    // Limpiar hijos cuando el padre cambia
    this.form.get('departamento')?.valueChanges.subscribe(() => {
      this.form.patchValue({ provincia: '', distrito: '' }, { emitEvent: false });
    });

    this.form.get('provincia')?.valueChanges.subscribe(() => {
      this.form.patchValue({ distrito: '' }, { emitEvent: false });
    });

    // Emitir el resultado final
    this.form.get('distrito')?.valueChanges.subscribe(ubigeo => {
      if (ubigeo) {
        // Buscamos el nombre del distrito en la lista actual para emitirlo
        const item = this.distritos().find(d => d.value === ubigeo);
        if (item) {
          this.distritoChange.emit({ ubigeo, distrito: item.label });
        }
      }
    });
  }


}
