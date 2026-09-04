import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {

  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;

  const data: ConfirmDialogData = {
    title: 'Übung löschen?',
    message: 'Bankdrücken wird endgültig entfernt.',
    confirmLabel: 'Löschen',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('sollte Titel, Text und Beschriftung aus den Dialogdaten anzeigen', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Übung löschen?');
    expect(text).toContain('Bankdrücken wird endgültig entfernt.');
    expect(text).toContain('Löschen');
    expect(text).toContain('Abbrechen');
  });
});
