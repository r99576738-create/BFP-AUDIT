import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  Output,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type Point = { x: number; y: number };
type Stroke = Point[];

@Component({
  selector: 'app-ui-signature',
  standalone: false,
  templateUrl: './ui-signature.component.html',
  styleUrls: ['./ui-signature.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSignatureComponent),
      multi: true
    }
  ]
})
export class UiSignatureComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  // ============ INPUTS ============
  @Input() label = '';
  @Input() required = false;
  @Input() title = 'Signature';
  @Input() hint = 'Tracez votre signature ici';
  @Input() note = 'Utilisez le doigt ou la souris.';

  // ============ OUTPUTS ============
  @Output() valueChange = new EventEmitter<string>();

  // ============ VIEW CHILDREN ============
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // ============ STATE ============
  private ctx!: CanvasRenderingContext2D;
  drawing = false;
  private dpr = 1;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private resizeTimeout?: number;

  isEmpty = true;
  canUndo = false;

  // ControlValueAccessor
  private internalValue = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  disabled = false;

  // ============ LIFECYCLE ============
  ngAfterViewInit(): void {
    this.setupCanvas();

    if (this.internalValue) {
      this.loadImage(this.internalValue);
      this.isEmpty = false;
    }

    this.updateToolsState();
  }

  ngOnDestroy(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
  }

  // ============ WINDOW RESIZE HANDLER ============
  @HostListener('window:resize')
  onResize(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = window.setTimeout(() => {
      const snapshot = this.exportDataUrlSafe();
      this.setupCanvas();

      if (snapshot) {
        this.loadImage(snapshot);
        this.isEmpty = false;
      } else {
        this.redrawFromStrokes();
      }
    }, 150);
  }

  // ============ CANVAS SETUP ============

  /** Apply pen style based on current theme (dark/light) */
/** Apply pen style (white in dark, black in light) */
private applyPenStyle(): void {
  if (!this.ctx) return;

  // ✅ Read token from the canvas itself (inherits correct theme from parent)
  const ink = getComputedStyle(this.canvasRef.nativeElement)
    .getPropertyValue('--bf-sign-ink')
    .trim();

  // Fallback if token missing
  const theme =
    document.documentElement.getAttribute('data-theme') ||
    document.body.getAttribute('data-theme') ||
    '';

  const fallback = theme === 'light'
    ? 'rgba(0,0,0,0.90)'
    : 'rgba(255,255,255,0.95)';

  this.ctx.strokeStyle = ink || fallback;

  this.ctx.lineWidth = 2.5;
  this.ctx.lineCap = 'round';
  this.ctx.lineJoin = 'round';
}

  /** Clear canvas in CSS pixels (safe with DPR transform) */
  private clearCanvasOnly(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  /** Initialize canvas with proper DPR scaling */
  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    this.dpr = window.devicePixelRatio || 1;

    // Set canvas resolution (DPR-aware)
    canvas.width = Math.max(1, Math.floor(rect.width * this.dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * this.dpr));

    // Get 2D context
    this.ctx = canvas.getContext('2d', { willReadFrequently: false })!;

    // Scale context (draw using CSS pixels)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Smoothing
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Pen (theme-aware)
    this.applyPenStyle();
  }

  // ============ DRAWING HANDLERS ============

  onDown(event: PointerEvent): void {
    if (this.disabled) return;

    // IMPORTANT: theme-aware pen color (black in light, white in dark)
    this.applyPenStyle();

    const canvas = this.canvasRef.nativeElement;
    canvas.setPointerCapture(event.pointerId);

    this.drawing = true;
    const point = this.getPointerPosition(event);

    this.currentStroke = [point];
    this.strokes.push(this.currentStroke);

    this.isEmpty = false;
    this.updateToolsState();
    this.markAsTouched();
  }

  onMove(event: PointerEvent): void {
    if (!this.drawing || !this.currentStroke || this.disabled) return;

    const point = this.getPointerPosition(event);
    const prevPoint = this.currentStroke[this.currentStroke.length - 1];

    this.currentStroke.push(point);

    this.ctx.beginPath();
    this.ctx.moveTo(prevPoint.x, prevPoint.y);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
  }

  onUp(): void {
    if (!this.drawing) return;

    this.drawing = false;
    this.currentStroke = null;

    this.emitValue();
    this.updateToolsState();
  }

  // ============ ACTIONS ============

  undo(): void {
    if (!this.strokes.length || this.disabled) return;

    this.strokes.pop();
    this.redrawFromStrokes();

    this.isEmpty = this.strokes.length === 0;
    this.emitValue();
    this.updateToolsState();
    this.markAsTouched();
  }

  clear(): void {
    if (this.disabled) return;

    this.clearCanvasOnly();

    this.strokes = [];
    this.currentStroke = null;
    this.isEmpty = true;

    this.internalValue = '';
    this.onChange('');
    this.valueChange.emit('');

    this.updateToolsState();
    this.markAsTouched();
  }

  // ============ DRAWING UTILITIES ============

  private redrawFromStrokes(): void {
    // Ensure correct pen style (in case theme changed)
    this.applyPenStyle();

    this.clearCanvasOnly();

    for (const stroke of this.strokes) {
      if (stroke.length < 2) continue;

      for (let i = 1; i < stroke.length; i++) {
        const a = stroke[i - 1];
        const b = stroke[i];

        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }
  }

  private getPointerPosition(event: PointerEvent): Point {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  // ============ DATA EXPORT/IMPORT ============

  private exportDataUrlSafe(): string | null {
    try {
      return this.canvasRef.nativeElement.toDataURL('image/png');
    } catch (error) {
      console.warn('Failed to export signature:', error);
      return null;
    }
  }

  private loadImage(dataUrl: string): void {
    if (!dataUrl) return;

    const img = new Image();
    img.onload = () => {
      // Keep pen style for next strokes
      this.applyPenStyle();

      this.clearCanvasOnly();

      const canvas = this.canvasRef.nativeElement;
      const rect = canvas.getBoundingClientRect();
      this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };

    img.onerror = () => console.warn('Failed to load signature image');
    img.src = dataUrl;
  }

  // ============ VALUE EMISSION ============

  private emitValue(): void {
    const dataUrl = this.exportDataUrlSafe();
    const value = dataUrl ?? '';

    this.internalValue = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  private updateToolsState(): void {
    this.canUndo = this.strokes.length > 0;
  }

  private markAsTouched(): void {
    this.onTouched();
  }

  // ============ CONTROL VALUE ACCESSOR ============

  writeValue(value: string): void {
    this.internalValue = value || '';

    if (value) {
      this.loadImage(value);
      this.isEmpty = false;
    } else {
      // IMPORTANT: do not call clear() here (it emits onChange)
      if (this.ctx) this.clearCanvasOnly();
      this.strokes = [];
      this.currentStroke = null;
      this.isEmpty = true;
      this.updateToolsState();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
