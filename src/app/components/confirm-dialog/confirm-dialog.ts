import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

/** Inhalt, den die aufrufende Seite dem Dialog mitgibt. */
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
}

/** Rückfrage vor einer nicht umkehrbaren Aktion. Schliesst mit true oder false. */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrls: ['./confirm-dialog.scss'],
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfirmDialog {
  public readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
