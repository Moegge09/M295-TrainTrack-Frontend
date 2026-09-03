import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatChip } from '@angular/material/chips';
import { MatButton } from '@angular/material/button';
import { AppAuthService } from '../../services/app.auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './app-login.html',
    styleUrls: ['./app-login.scss'],
    imports: [MatIcon, MatChip, MatButton]
})
export class AppLogin {

  private authService = inject(AppAuthService)

  public readonly username = this.authService.username;
  public readonly useralias = this.authService.useralias;
  public readonly isAuthenticated = this.authService.authenticated;

  public login () {
    this.authService.login()
  }

  public logout () {
    this.authService.logout()
  }
}
