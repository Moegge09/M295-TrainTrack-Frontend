import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Exercise } from '../../models/exercise';
import { ExerciseService } from '../../services/exercise.service';

@Component({
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.html',
  styleUrls: ['./exercise-list.scss'],
  imports: [MatTableModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule],
})
export class ExerciseList implements OnInit {

  private exerciseService = inject(ExerciseService);

  // Signals, weil die App zoneless laeuft (kein zone.js). Ein normales Feld,
  // das im subscribe gesetzt wird, wuerde die View nicht aktualisieren -
  // genau der Effekt, der beim Login wie ein doppelter Login aussah.
  public readonly exercises = signal<Exercise[]>([]);
  public readonly loading = signal(false);
  public readonly error = signal('');

  // Spalten der MatTable, Reihenfolge bestimmt die Anzeige
  public readonly displayedColumns = ['id', 'name', 'weight'];

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

  /** Uebersetzt die Statuscodes des Backends in eine lesbare Meldung. */
  private toMessage(err: HttpErrorResponse): string {
    switch (err.status) {
      case 0:
        return 'Keine Verbindung zum Backend. Laeuft es auf Port 6767, und stimmt die CORS-Konfiguration?';
      case 401:
        return 'Nicht angemeldet (401). Der Access Token wurde nicht mitgeschickt oder ist abgelaufen.';
      case 403:
        return 'Keine Berechtigung (403). Fuer diese Ansicht braucht der Benutzer die Rolle "read".';
      default:
        return `Fehler ${err.status}: ${err.message}`;
    }
  }
}
