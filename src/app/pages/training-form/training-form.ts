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
import { Exercise } from '../../models/exercise';
import { Gym } from '../../models/gym';
import { DAY_LABELS, DayOfWeek, Training, TrainingRequest } from '../../models/training';
import { ExerciseService } from '../../services/exercise.service';
import { GymService } from '../../services/gym.service';
import { TrainingService } from '../../services/training.service';

@Component({
  selector: 'app-training-form',
  templateUrl: './training-form.html',
  styleUrls: ['./training-form.scss'],
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
export class TrainingForm implements OnInit {

  private fb = inject(FormBuilder);
  private trainingService = inject(TrainingService);
  private gymService = inject(GymService);
  private exerciseService = inject(ExerciseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    day: ['MONDAY' as DayOfWeek, [Validators.required]],
    gymId: [null as number | null],
    exerciseIds: [[] as number[]],
  });

  /** Auswahlmöglichkeiten der Dropdowns. */
  public readonly gyms = signal<Gym[]>([]);
  public readonly exercises = signal<Exercise[]>([]);
  public readonly days = Object.entries(DAY_LABELS) as [DayOfWeek, string][];

  public readonly id = signal<number | null>(null);
  public readonly loading = signal(false);
  public readonly saving = signal(false);
  public readonly error = signal('');

  public readonly isEdit = computed(() => this.id() !== null);
  public readonly title = computed(() => this.isEdit() ? 'Training bearbeiten' : 'Neues Training');

  ngOnInit(): void {
    this.loadOptions();

    const param = this.route.snapshot.paramMap.get('id');
    if (param !== null) {
      this.id.set(Number(param));
      this.loadTraining(Number(param));
    }
  }

  /** Lädt die Listen für die beiden Dropdowns. */
  public loadOptions(): void {
    this.gymService.getAll().subscribe({
      next: data => this.gyms.set(data),
      error: (err: HttpErrorResponse) => this.error.set(this.toMessage(err))
    });

    this.exerciseService.getAll().subscribe({
      next: data => this.exercises.set(data),
      error: (err: HttpErrorResponse) => this.error.set(this.toMessage(err))
    });
  }

  public loadTraining(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.trainingService.getOne(id).subscribe({
      next: training => {
        this.form.patchValue({
          name: training.name,
          day: training.day,
          gymId: training.gym?.id ?? null,
          exerciseIds: (training.exercises ?? []).map(e => e.id).filter((id): id is number => id !== undefined),
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

    const id = this.id();
    const request = id === null
      ? this.trainingService.create(this.toRequest())
      : this.trainingService.update(id, this.toEntity(id));

    request.subscribe({
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

  /** POST erwartet das DTO mit blossen IDs. */
  public toRequest(): TrainingRequest {
    const value = this.form.getRawValue();
    return {
      name: value.name,
      day: value.day,
      gymId: value.gymId,
      exerciseIds: value.exerciseIds,
    };
  }

  /** PUT erwartet abweichend die ganze Entity - IDs zurück auf Objekte abbilden. */
  public toEntity(id: number): Training {
    const value = this.form.getRawValue();
    return {
      id,
      name: value.name,
      day: value.day,
      gym: this.gyms().find(g => g.id === value.gymId) ?? null,
      exercises: this.exercises().filter(e => e.id !== undefined && value.exerciseIds.includes(e.id)),
    };
  }

  public cancel(): void {
    this.router.navigate(['training']);
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
        return 'Abgelehnt (403). Entweder fehlt die Rolle "update", oder der XSRF-Token wurde nicht mitgeschickt.';
      case 404:
        return 'Dieses Training gibt es nicht (404).';
      default:
        return `Fehler ${err.status}: ${err.message}`;
    }
  }
}
