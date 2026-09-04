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
import { Gym } from '../../models/gym';
import { GymService } from '../../services/gym.service';

@Component({
  selector: 'app-gym-list',
  templateUrl: './gym-list.html',
  styleUrls: ['./gym-list.scss'],
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
export class GymList implements OnInit {

  private gymService = inject(GymService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  public readonly gyms = signal<Gym[]>([]);
  public readonly loading = signal(false);
  public readonly error = signal('');

  public readonly displayedColumns = ['id', 'name', 'address', 'actions'];

  // für *appIsInRoles im Template
  public readonly roles = AppRoles;

  ngOnInit(): void {
    this.load();
  }

  public load(): void {
    this.loading.set(true);
    this.error.set('');

    this.gymService.getAll().subscribe({
      next: data => {
        this.gyms.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.toMessage(err));
        this.loading.set(false);
      }
    });
  }

  /** Adressfelder als eine Zeile. */
  public formatAddress(gym: Gym): string {
    const address = gym.address;
    if (!address) {
      return '-';
    }

    const strasse = [address.street, address.houseNumber].filter(Boolean).join(' ');
    const ort = [address.plz, address.city].filter(Boolean).join(' ');

    return [strasse, ort, address.country].filter(Boolean).join(', ') || '-';
  }

  /** Löscht erst nach Bestätigung. Backend verlangt die Rolle "admin". */
  public deleteGym(gym: Gym): void {
    const data: ConfirmDialogData = {
      title: 'Gym löschen?',
      message: `"${gym.name}" wird endgültig entfernt, zusammen mit der Adresse.`,
      confirmLabel: 'Löschen',
    };

    this.dialog.open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed !== true || gym.id === undefined) {
          return;
        }
        this.remove(gym.id);
      });
  }

  public remove(id: number): void {
    this.gymService.remove(id).subscribe({
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
