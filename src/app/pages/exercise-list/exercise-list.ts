import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { AppRoles } from '../../app.roles';
import { ConfirmDialog, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog';
import { IsInRolesDirective } from '../../directives/app-is-in-roles.dir';
import { Exercise } from '../../models/exercise';
import { ExerciseService } from '../../services/exercise.service';

@Component({
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.html',
  styleUrls: ['./exercise-list.scss'],
  imports: [
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    RouterLink,
    IsInRolesDirective,
  ],
})
export class ExerciseList implements OnInit {

  private exerciseService = inject(ExerciseService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals, weil die App zoneless läuft (kein zone.js). Ein normales Feld,
  // das im subscribe gesetzt wird, würde die View nicht aktualisieren -
  // genau der Effekt, der beim Login wie ein doppelter Login aussah.
  public readonly exercises = signal<Exercise[]>([]);
  public readonly loading = signal(false);
  public readonly error = signal('');

  // Spalten der MatTable, Reihenfolge bestimmt die Anzeige
  public readonly displayedColumns = ['id', 'name', 'weight', 'actions'];

  // für *appIsInRoles im Template
  public readonly roles = AppRoles;

  ngOnInit(): void {
    this.load();
  }

  public load(): void {
    this.loading.set(true);
    this.error.set('');

    this.exerciseService.getAll().subscribe({
      next: data => {
        this.exercises.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.toMessage(err));
        this.loading.set(false);
      }
    });
  }

  /**
   * Fragt vor dem Löschen nach und entfernt die Übung erst nach Bestätigung.
   * Das Backend verlangt dafür die Rolle "update".
   */
  public deleteExercise(exercise: Exercise): void {
    const data: ConfirmDialogData = {
      title: 'Übung löschen?',
      message: `"${exercise.name}" wird endgültig entfernt.`,
      confirmLabel: 'Löschen',
    };

    this.dialog.open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed !== true || exercise.id === undefined) {
          return;
        }
        this.remove(exercise.id);
      });
  }

  /** Führt das Löschen aus und lädt die Liste neu. */
  public remove(id: number): void {
    this.exerciseService.remove(id).subscribe({
      next: response => {
        this.snackBar.open(response.message, 'OK', { duration: 4000 });
        this.load();
      },
      error: (err: HttpErrorResponse) => this.error.set(this.toMessage(err))
    });
  }

  /** Übersetzt die Statuscodes des Backends in eine lesbare Meldung. */
  private toMessage(err: HttpErrorResponse): string {
    switch (err.status) {
      case 0:
        return 'Keine Verbindung zum Backend. Läuft es auf Port 6767, und stimmt die CORS-Konfiguration?';
      case 401:
        return 'Nicht angemeldet (401). Der Access Token wurde nicht mitgeschickt oder ist abgelaufen.';
      case 403:
        return 'Keine Berechtigung (403). Zum Lesen braucht es die Rolle "read", zum Löschen "update".';
      default:
        return `Fehler ${err.status}: ${err.message}`;
    }
  }
}
