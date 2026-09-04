import { TestBed } from '@angular/core/testing';
import { AuthConfig, OAuthModule } from 'angular-oauth2-oidc';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { authConfig } from './app.auth';

describe('App', () => {

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // App bindet über IsInRolesDirective den AppAuthService ein, der wiederum
      // den OAuthService braucht. Ohne OAuthModule.forRoot() scheitert der Test
      // schon beim Erzeugen der Komponente (NG0201).
      imports: [
        App,
        OAuthModule.forRoot({ resourceServer: { sendAccessToken: true } })
      ],
      providers: [
        { provide: AuthConfig, useValue: authConfig }
      ],
    }).compileComponents();
  });

  it('sollte die App erstellen', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sollte die Toolbar rendern', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')).toBeTruthy();
  });

  it('sollte ohne Anmeldung den Login-Button zeigen', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Login');
    expect(compiled.textContent).not.toContain('Logout');
  });

  it('sollte ohne Rolle read den Navigationspunkt Übungen ausblenden', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    // *appIsInRoles blendet den Button aus, solange keine Rollen im Token stehen
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Übungen');
  });
});
