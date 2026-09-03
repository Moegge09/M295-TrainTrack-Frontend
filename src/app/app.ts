import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppRoles } from './app.roles';
import { AppLogin } from './components/app-login/app-login';
import { IsInRolesDirective } from './directives/app-is-in-roles.dir';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    AppLogin,
    IsInRolesDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('M295-TrainTrack-Frontend');
  protected readonly roles = AppRoles;
}