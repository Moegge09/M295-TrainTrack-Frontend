import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { AppRoles } from '../../app.roles';
import { ConfirmDialog, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog';
import { IsInRolesDirective } from '../../directives/app-is-in-roles.dir';
import { DAY_LABELS, Training } from '../../models/training';
import { TrainingService } from '../../services/training.service';

@Component({
  selector: 'app-training-list',
  templateUrl: './training-list.html',
  styleUrls: ['./training-list.scss'],
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
export class TrainingList implements OnInit {

  private trainingService = inject(TrainingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  public readonly trainings = signal<Training[]>([]);
  public readonly loading = signal(false);
  public readonly error = signal('');

  public readonly displayedColumns = ['id', 'name', 'day', 'gym', 'exercises', 'actions'];

  public readonly roles = AppRoles;

  ngOnInit(): void {
    this.load();
  }

  public load(): void {
    this.loading.set(true);
    this.error.set('');

    this.trainingService.getAll().subscribe({
      next: data => {
        this.trainings.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.toMessage(err));
        this.loading.set(false);
      }
    });
  }

  /** Deutscher Wochentag statt MONDAY. */
  public dayLabel(training: Training): string {
    return DAY_LABELS[training.day] ?? training.day;
  }

  public gymName(training: Training): string {
    return training.gym?.name ?? '-';
  }

  public exerciseCount(training: Training): number {
    return training.exercises?.length ?? 0;
  }

  /** Löscht erst nach Bestätigung. Backend verlangt die Rolle "update". */
  public deleteTraining(training: Training): void {
    const data: ConfirmDialogData = {
      title: 'Training löschen?',
      message: `"${training.name}" wird endgültig entfernt.`,
      confirmLabel: 'Löschen',
    };

    this.dialog.open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed !== true || training.id === undefined) {
          return;
        }
        this.remove(training.id);
      });
  }

  public remove(id: number): void {
    this.trainingService.remove(id).subscribe({
      next: response => {
        this.snackBar.open(response.message, 'OK', { duration: 4000 });
        this.load();
      },
      error: (err: HttpErrorResponse) => this.error.set(this.toMessage(err))
    });
  }

  public toMessage(err: HttpErrorResponse): string {
    switch (err.status) {
      case 0:
        return 'Keine Verbindung zum Backend. Läuft es auf Port 6767, und stimmt die CORS-Konfiguration?';
      case 401:
        return 'Nicht angemeldet (401). Der Access Token wurde nicht mitgeschickt oder ist abgelaufen.';
      case 403:
        return 'Keine Berechtigung (403). Zum Lesen braucht es die Rolle "read", zum Ändern "update".';
      default:
        return `Fehler ${err.status}: ${err.message}`;
    }
  }
}
