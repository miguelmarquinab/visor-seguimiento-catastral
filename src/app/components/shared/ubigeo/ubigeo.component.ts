import { Component, EventEmitter, inject, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { UbigeoFacade } from '../../../core/ubigeo/ubigeo.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, of, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-ubigeo-selector',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ubigeo.component.html',
  styleUrl: './ubigeo.component.css'
})
export class UbigeoComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(UbigeoFacade);

  @Input() showTodos = true;
  /** Lista de códigos ubigeo permitidos para el usuario logado */
  @Input() allowedUbigeos: string[] = [];
  /** Distritos ya seleccionados (chips); se usa para resetear el campo distrito cuando se quita un chip. */
  @Input() selectedUbigeos: string[] = [];
  @Output() distritoChange = new EventEmitter<{ ubigeo: string; distrito: string }>();

  private readonly allowedUbigeos$ = new BehaviorSubject<string[]>([]);

  form = this.fb.group({
    departamento: [''],
    provincia: [''],
    distrito: [''],
  });

  departamentos = toSignal(
    this.allowedUbigeos$.pipe(
      switchMap(allowed =>
        allowed.length ? this.facade.getFilteredDepartamentos$(allowed) : this.facade.departamentos$
      )
    ),
    { initialValue: [] }
  );

  provincias = toSignal(
    combineLatest([
      this.allowedUbigeos$,
      this.form.get('departamento')!.valueChanges.pipe(startWith(this.form.get('departamento')?.value ?? ''))
    ]).pipe(
      switchMap(([allowed, depto]) =>
        allowed.length
          ? this.facade.getFilteredProvincias$(allowed, depto || '')
          : (depto ? this.facade.provincias$(depto) : of([]))
      )
    ),
    { initialValue: [] }
  );

  distritos = toSignal(
    combineLatest([
      this.allowedUbigeos$,
      this.form.get('departamento')!.valueChanges.pipe(startWith(this.form.get('departamento')?.value ?? '')),
      this.form.get('provincia')!.valueChanges.pipe(startWith(this.form.get('provincia')?.value ?? ''))
    ]).pipe(
      switchMap(([allowed, depto, prov]) =>
        allowed.length
          ? this.facade.getFilteredDistritos$(allowed, depto || '', prov || '')
          : (depto && prov ? this.facade.distritos$(depto, prov) : of([]))
      )
    ),
    { initialValue: [] }
  );

  ngOnChanges(changes: SimpleChanges): void {
    const allowed = this.allowedUbigeos ?? [];
    const selected = this.selectedUbigeos ?? [];
    if (changes['allowedUbigeos'] || changes['selectedUbigeos']) {
      const listForOptions = allowed.length ? allowed : selected;
      this.allowedUbigeos$.next(listForOptions);
    }
    if (changes['selectedUbigeos']) {
      const current = this.form.get('distrito')?.value;
      if (current && selected.length && !selected.includes(current)) {
        this.form.patchValue({ distrito: '' }, { emitEvent: false });
      }
    }
  }

  ngOnInit(): void {
    this.facade.preload();
    const allowed = this.allowedUbigeos ?? [];
    const selected = this.selectedUbigeos ?? [];
    this.allowedUbigeos$.next(allowed.length ? allowed : selected);
    this.form.get('departamento')?.valueChanges.subscribe(() => {
      this.form.patchValue({ provincia: '', distrito: '' }, { emitEvent: false });
    });
    this.form.get('provincia')?.valueChanges.subscribe(() => {
      this.form.patchValue({ distrito: '' }, { emitEvent: false });
    });
    this.form.get('distrito')?.valueChanges.subscribe(ubigeo => {
      if (ubigeo) {
        const item = this.distritos().find(d => d.value === ubigeo);
        if (item) this.distritoChange.emit({ ubigeo, distrito: item.label });
      }
    });
  }
}
