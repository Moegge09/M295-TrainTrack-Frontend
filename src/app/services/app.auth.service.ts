import {inject, Injectable, signal} from '@angular/core';
import {JwtHelperService} from '@auth0/angular-jwt';
import {AuthConfig, OAuthErrorEvent, OAuthService} from 'angular-oauth2-oidc';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppAuthService {
  private oauthService = inject(OAuthService);
  private authConfig = inject(AuthConfig);
  private jwtHelper: JwtHelperService = new JwtHelperService();

  private readonly usernameSignal = signal('');
  public readonly username = this.usernameSignal.asReadonly();

  private readonly useraliasSignal = signal('');
  public readonly useralias = this.useraliasSignal.asReadonly();

  private readonly authenticatedSignal = signal(false);
  public readonly authenticated = this.authenticatedSignal.asReadonly();

  constructor(
  ) {
    this.handleEvents(null);
  }

  private _decodedAccessToken: any;

  get decodedAccessToken() {
    return this._decodedAccessToken;
  }

  private _accessToken = '';

  get accessToken() {
    return this._accessToken;
  }

  async initAuth(): Promise<void> {
    this.oauthService.configure(this.authConfig);
    this.oauthService.events
      .subscribe(e => this.handleEvents(e));
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.oauthService.setupAutomaticSilentRefresh();
  }

  public getRoles(): Observable<Array<string>> {
    const clientId = this.authConfig.clientId ?? '';
    const roles = this._decodedAccessToken?.resource_access?.[clientId]?.roles;

    if (!roles) {
      return of([]);
    }

    const roleArray: string[] = Array.isArray(roles) ? roles : [roles];
    return of(roleArray.map(r => r.replace('ROLE_', '')));
  }

  public getIdentityClaims(): Record<string, any> {
    return this.oauthService.getIdentityClaims();
  }

  public isAuthenticated () {
    return this.oauthService.hasValidAccessToken()
  }

  public logout() {
    this.oauthService.logOut();
    this.useraliasSignal.set('');
    this.usernameSignal.set('');
    this.authenticatedSignal.set(false);
  }

  public login() {
    this.oauthService.initLoginFlow();
  }

  private handleEvents(event: any) {
    if (event instanceof OAuthErrorEvent) {
      // console.error(event);
      return;
    }

    this._accessToken = this.oauthService.getAccessToken();
    this._decodedAccessToken = this.jwtHelper.decodeToken(this._accessToken);
    this.authenticatedSignal.set(this.oauthService.hasValidAccessToken());

    if (this._decodedAccessToken?.family_name && this._decodedAccessToken?.given_name) {
      this.usernameSignal.set(
        this._decodedAccessToken.given_name + ' ' + this._decodedAccessToken.family_name
      );
    }

    const claims = this.getIdentityClaims();
    if (claims?.['preferred_username']) {
      this.useraliasSignal.set(claims['preferred_username']);
    }
  }
}
