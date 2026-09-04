import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanRequest } from '../../models/plan';
import { DAY_LABELS, Training } from '../../models/training';
import { PlanService } from '../../services/plan.service';
import { TrainingService } from '../../services/training.service';

@Component({
  selector: 'app-plan-form',
  templateUrl: './plan-form.html',
  styleUrls: ['./plan-form.scss'],
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
})
export class PlanForm implements OnInit {

  private fb = inject(FormBuilder);
  private planService = inject(PlanService);
  private trainingService = inject(TrainingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    trainingIds: [[] as number[]],
  });

  public readonly trainings = signal<Training[]>([]);

  public readonly id = signal<number | null>(null);
  public readonly loading = signal(false);
  public readonly saving = signal(false);
  public readonly error = signal('');

  public readonly isEdit = computed(() => this.id() !== null);
  public readonly title = computed(() => this.isEdit() ? 'Plan bearbeiten' : 'Neuer Plan');

  ngOnInit(): void {
    this.loadOptions();

    const param = this.route.snapshot.paramMap.get('id');
    if (param !== null) {
      this.id.set(Number(param));
      this.loadPlan(Number(param));
    }
  }

  public loadOptions(): void {
    this.trainingService.getAll().subscribe({
      next: data => this.trainings.set(data),
      error: (err: HttpErrorResponse) => this.error.set(this.toMessage(err))
    });
  }

  public loadPlan(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.planService.getOne(id).subscribe({
      next: plan => {
        this.form.patchValue({
          name: plan.name,
          trainingIds: (plan.trainings ?? []).map(t => t.id).filter((tid): tid is number => tid !== undefined),
        });
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.toMessage(err));
        this.loading.set(false);
      }
    });
  }

  public save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const request: PlanRequest = this.form.getRawValue();
    const id = this.id();

    const call = id === null
      ? this.planService.create(request)
      : this.planService.update(id, request);

    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.toMessage(err));
        this.saving.set(false);
      }
    });
  }

  /** Beschriftung im Dropdown: Name plus Wochentag. */
  public trainingLabel(training: Training): string {
    return `${training.name} (${DAY_LABELS[training.day] ?? training.day})`;
  }

  public cancel(): void {
    this.router.navigate(['plan']);
  }

  public toMessage(err: HttpErrorResponse): string {
    switch (err.status) {
      case 0:
        return 'Keine Verbindung zum Backend. Läuft es auf Port 6767, und stimmt die CORS-Konfiguration?';
      case 400:
        return 'Das Backend hat die Eingaben abgelehnt (400). Bean Validation im Backend prüfen.';
      case 401:
        return 'Nicht angemeldet (401). Der Access Token wurde nicht mitgeschickt oder ist abgelaufen.';
      case 403:
        return 'Abgelehnt (403). Entweder fehlt die Rolle "admin", oder der XSRF-Token wurde nicht mitgeschickt.';
      case 404:
        return 'Diesen Plan gibt es nicht (404).';
      default:
        return `Fehler ${err.status}: ${err.message}`;
    }
  }
}
