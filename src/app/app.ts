import { Component, signal } from '@angular/core';
// RouterLink und IsInRolesDirective wieder in imports aufnehmen,
// sobald die Navigations-Buttons im Template aktiv sind.
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppRoles } from './app.roles';
import { AppLogin } from './components/app-login/app-login';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    AppLogin,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('M295-TrainTrack-Frontend');
  protected readonly roles = AppRoles;
}