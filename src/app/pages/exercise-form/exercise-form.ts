import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Exercise } from '../../models/exercise';
import { ExerciseService } from '../../services/exercise.service';

@Component({
  selector: 'app-exercise-form',
  templateUrl: './exercise-form.html',
  styleUrls: ['./exercise-form.scss'],
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
})
export class ExerciseForm implements OnInit {

  private fb = inject(FormBuilder);
  private exerciseService = inject(ExerciseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    weight: [0, [Validators.required, Validators.min(0)]],
  });

  public readonly id = signal<number | null>(null);
  public readonly loading = signal(false);
  public readonly saving = signal(false);
  public readonly error = signal('');

  public readonly isEdit = computed(() => this.id() !== null);
  public readonly title = computed(() => this.isEdit() ? 'Übung bearbeiten' : 'Neue Übung');

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');

    if (param !== null) {
      this.id.set(Number(param));
      this.loadExercise(Number(param));
    }
  }

  /** Lädt die zu bearbeitende Übung und schreibt sie ins Formular. */
  public loadExercise(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.exerciseService.getOne(id).subscribe({
      next: exercise => {
        this.form.patchValue({ name: exercise.name, weight: exercise.weight });
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.toMessage(err));
        this.loading.set(false);
      }
    });
  }

  /** Legt an oder aktualisiert, je nachdem ob eine ID vorhanden ist. */
  public save(): void {
    if (this.form.invalid) {
      // markiert alle Felder als berührt, damit die mat-error sichtbar werden
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const exercise: Exercise = this.form.getRawValue();
    const id = this.id();

    const request = id === null
      ? this.exerciseService.create(exercise)
      : this.exerciseService.update(id, exercise);

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

  /** Zurück zur Liste, ohne zu speichern. */
  public cancel(): void {
    this.router.navigate(['exercise']);
  }

  /** Übersetzt die Statuscodes des Backends in eine lesbare Meldung. */
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
        return 'Diese Übung gibt es nicht (404).';
      default:
        return `Fehler ${err.status}: ${err.message}`;
    }
  }
}
