import { Component, EventEmitter, inject, Input, Output, effect, ChangeDetectorRef, HostBinding, HostListener, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoteService, LoteOption } from '../../../services/lote.service';
import { UiStateService } from '../../../services/ui-state.service';
import { toSignal } from '@angular/core/rxjs-interop';

/** Valor interno para la opción "Seleccionar Lote" (limpiar selección). */
export const LOTE_NINGUNO = '__ninguno__';

@Component({
  selector: 'app-lote-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lote-selector.component.html',
  styleUrls: ['./lote-selector.component.css']
})
export class LoteSelectorComponent implements AfterViewChecked {
  private readonly loteService = inject(LoteService);
  private readonly uiState = inject(UiStateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly el = inject(ElementRef);

  readonly LOTE_NINGUNO = LOTE_NINGUNO;

  /** 'inicio' = página INICIO (fondo oscuro). 'default' = Reporte Espacial, etc. (alineado con Departamento/Provincia/Distrito). */
  @Input() variant: 'inicio' | 'default' = 'default';

  @HostBinding('class.lote-selector-inicio') get isInicioVariant(): boolean {
    return this.variant === 'inicio';
  }

  @HostBinding('class.lote-selector-default') get isDefaultVariant(): boolean {
    return this.variant === 'default';
  }

  selectedCodigos = this.uiState.selectedLoteCodigos;
  @Input() allUbigeos: string[] = [];
  lotes = toSignal(this.loteService.getLotes(), { initialValue: [] as LoteOption[] });
  @Output() loteChange = new EventEmitter<string[]>();

  @ViewChild('selectAllCb') selectAllCbRef?: ElementRef<HTMLInputElement>;

  open = false;

  constructor() {
    effect(() => {
      this.selectedCodigos();
      this.cdr.markForCheck();
    });
  }

  get labelSummary(): string {
    const codigos = this.selectedCodigos();
    if (!codigos.length) return 'Seleccionar Lotes';
    const list = this.lotes();
    const names = codigos
      .map((c) => list.find((l) => l.codigo === c)?.descripcion ?? c)
      .filter(Boolean);
    if (!names.length) return 'Seleccionar Lotes';
    const maxNames = 3;
    if (names.length <= maxNames) return names.join(', ');
    return `${names.length} lotes seleccionados`;
  }

  isSelected(codigo: string): boolean {
    return this.selectedCodigos().includes(codigo);
  }

  /** True cuando están todos los lotes seleccionados. */
  get allSelected(): boolean {
    const list = this.lotes();
    const codigos = this.selectedCodigos();
    return list.length > 0 && codigos.length === list.length;
  }

  /** True cuando hay algunos pero no todos seleccionados (estado indeterminado del checkbox). */
  get indeterminate(): boolean {
    const list = this.lotes();
    const codigos = this.selectedCodigos();
    return codigos.length > 0 && codigos.length < list.length;
  }

  toggleLote(codigo: string): void {
    if (!codigo || codigo === LOTE_NINGUNO) {
      this.clearSelection();
      return;
    }
    const current = [...this.selectedCodigos()];
    const idx = current.indexOf(codigo);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(codigo);
    }
    this.uiState.setSelectedLoteCodigos(current);
    if (!current.length) {
      this.loteChange.emit([]);
      this.open = false;
      this.cdr.markForCheck();
      return;
    }
    this.loteService.getUbigeosByLotes(current, this.allUbigeos).subscribe((ubigeos) => {
      this.loteChange.emit(ubigeos);
      this.cdr.markForCheck();
    });
  }

  clearSelection(): void {
    this.uiState.setSelectedLoteCodigos([]);
    this.loteChange.emit([]);
    this.open = false;
    this.cdr.markForCheck();
  }

  /** Marca todos los lotes y emite sus ubigeos. */
  selectAll(): void {
    const all = this.lotes().map((l) => l.codigo);
    if (!all.length) return;
    this.uiState.setSelectedLoteCodigos(all);
    this.cdr.markForCheck();
    this.loteService.getUbigeosByLotes(all, this.allUbigeos).subscribe((ubigeos) => {
      this.loteChange.emit(ubigeos);
      this.cdr.markForCheck();
    });
  }

  /** Al hacer clic en el botón: abre o cierra el panel para ver y modificar los lotes seleccionados. */
  onTriggerClick(): void {
    this.open = !this.open;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.open = false;
    this.cdr.markForCheck();
  }

  /** Cierra el modal de INICIO cuando el foco sale del contenido (p. ej. Tab fuera). */
  onModalFocusOut(event: FocusEvent): void {
    if (this.variant !== 'inicio' || !this.open) return;
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && this.el.nativeElement.contains(relatedTarget)) return;
    setTimeout(() => {
      if (this.open && document.activeElement && !this.el.nativeElement.contains(document.activeElement)) {
        this.closeModal();
      }
    }, 0);
  }

  ngAfterViewChecked(): void {
    const el = this.selectAllCbRef?.nativeElement;
    if (el) el.indeterminate = this.indeterminate;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) return;
    const target = event.target as Node;
    if (this.el.nativeElement.contains(target)) return;
    this.open = false;
    this.cdr.markForCheck();
  }
}
