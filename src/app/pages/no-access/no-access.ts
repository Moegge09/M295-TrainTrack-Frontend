import { Component, inject } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { AppAuthService } from '../../services/app.auth.service';

@Component({
    selector: 'app-no-access',
    templateUrl: './no-access.html',
    styleUrls: ['./no-access.scss'],
    imports: [MatCard, MatCardContent, MatIcon],
})
export class NoAccess {

    public authService = inject(AppAuthService)

}
