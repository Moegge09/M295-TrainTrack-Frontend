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
import { Plan } from '../../models/plan';
import { PlanService } from '../../services/plan.service';

@Component({
  selector: 'app-plan-list',
  templateUrl: './plan-list.html',
  styleUrls: ['./plan-list.scss'],
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
export class PlanList implements OnInit {

  private planService = inject(PlanService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  public readonly plans = signal<Plan[]>([]);
  public readonly loading = signal(false);
  public readonly error = signal('');

  public readonly displayedColumns = ['id', 'name', 'trainings', 'actions'];

  public readonly roles = AppRoles;

  ngOnInit(): void {
    this.load();
  }

  public load(): void {
    this.loading.set(true);
    this.error.set('');

    this.planService.getAll().subscribe({
      next: data => {
        this.plans.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.toMessage(err));
        this.loading.set(false);
      }
    });
  }

  /** Namen der enthaltenen Trainings, kommagetrennt. */
  public trainingNames(plan: Plan): string {
    const names = (plan.trainings ?? []).map(t => t.name);
    return names.length > 0 ? names.join(', ') : '-';
  }

  /** Löscht erst nach Bestätigung. Backend verlangt die Rolle "admin". */
  public deletePlan(plan: Plan): void {
    const data: ConfirmDialogData = {
      title: 'Plan löschen?',
      message: `"${plan.name}" wird endgültig entfernt.`,
      confirmLabel: 'Löschen',
    };

    this.dialog.open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed !== true || plan.id === undefined) {
          return;
        }
        this.remove(plan.id);
      });
  }

  public remove(id: number): void {
    this.planService.remove(id).subscribe({
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
        return 'Keine Berechtigung (403). Zum Lesen braucht es die Rolle "read", zum Ändern "admin".';
      default:
        return `Fehler ${err.status}: ${err.message}`;
    }
  }
}
