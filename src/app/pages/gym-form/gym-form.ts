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
import { Gym } from '../../models/gym';
import { GymService } from '../../services/gym.service';

@Component({
  selector: 'app-gym-form',
  templateUrl: './gym-form.html',
  styleUrls: ['./gym-form.scss'],
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
export class GymForm implements OnInit {

  private fb = inject(FormBuilder);
  private gymService = inject(GymService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Adresse als verschachtelte Gruppe. Pflichtfeld ist nur der Name. */
  public readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    address: this.fb.nonNullable.group({
      street: [''],
      houseNumber: [''],
      // Typprüfung: international gültige Postleitzahl - 3 bis 10 Zeichen aus
      // Ziffern, Buchstaben, Leerzeichen und Bindestrich (8001, SW1A 1AA, K1A 0B1)
      plz: ['', [Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/)]],
      city: [''],
      country: [''],
    }),
  });

  public readonly id = signal<number | null>(null);
  public readonly loading = signal(false);
  public readonly saving = signal(false);
  public readonly error = signal('');

  public readonly isEdit = computed(() => this.id() !== null);
  public readonly title = computed(() => this.isEdit() ? 'Gym bearbeiten' : 'Neues Gym');

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');

    if (param !== null) {
      this.id.set(Number(param));
      this.loadGym(Number(param));
    }
  }

  public loadGym(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.gymService.getOne(id).subscribe({
      next: gym => {
        this.form.patchValue({
          name: gym.name,
          address: {
            street: gym.address?.street ?? '',
            houseNumber: gym.address?.houseNumber ?? '',
            plz: gym.address?.plz ?? '',
            city: gym.address?.city ?? '',
            country: gym.address?.country ?? '',
          }
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

    const gym: Gym = this.form.getRawValue();
    const id = this.id();

    const request = id === null
      ? this.gymService.create(gym)
      : this.gymService.update(id, gym);

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

  public cancel(): void {
    this.router.navigate(['gym']);
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
        return 'Dieses Gym gibt es nicht (404).';
      default:
        return `Fehler ${err.status}: ${err.message}`;
    }
  }
}
