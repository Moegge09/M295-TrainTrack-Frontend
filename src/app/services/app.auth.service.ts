import {inject, Injectable} from '@angular/core';
import {JwtHelperService} from '@auth0/angular-jwt';
import {AuthConfig, OAuthErrorEvent, OAuthService} from 'angular-oauth2-oidc';
import {BehaviorSubject, Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppAuthService {
  private oauthService = inject(OAuthService);
  private authConfig = inject(AuthConfig);
  private jwtHelper: JwtHelperService = new JwtHelperService();
  private usernameSubject: BehaviorSubject<string> = new BehaviorSubject('');
  public readonly usernameObservable: Observable<string> = this.usernameSubject.asObservable();
  private useraliasSubject: BehaviorSubject<string> = new BehaviorSubject('');
  public readonly useraliasObservable: Observable<string> = this.useraliasSubject.asObservable();
  private accessTokenSubject: BehaviorSubject<string> = new BehaviorSubject('');
  public readonly accessTokenObservable: Observable<string> = this.accessTokenSubject.asObservable();

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
    // erst warten bis das Discovery-Document geladen und ein evtl. Login-Redirect
    // verarbeitet ist, danach den Silent Refresh aufsetzen
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.oauthService.setupAutomaticSilentRefresh();
  }

  public getRoles(): Observable<Array<string>> {
    // Client-ID kommt aus der AuthConfig, damit sie nicht doppelt gepflegt werden muss.
    // Muss mit app.name im Backend uebereinstimmen (application.yaml),
    // weil der AuthenticationRoleConverter dort resource_access[app.name].roles liest.
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
    this.useraliasSubject.next('');
    this.usernameSubject.next('');
  }

  public login() {
    this.oauthService.initLoginFlow();
  }

  private handleEvents(event: any) {
    if (event instanceof OAuthErrorEvent) {
      // console.error(event);
    } else {
      this._accessToken = this.oauthService.getAccessToken();
      this.accessTokenSubject.next(this._accessToken);
      this._decodedAccessToken = this.jwtHelper.decodeToken(this._accessToken);

      if (this._decodedAccessToken?.family_name && this._decodedAccessToken?.given_name) {
        const username = this._decodedAccessToken?.given_name + ' ' + this._decodedAccessToken?.family_name;
        this.usernameSubject.next(username);
      }

      const claims = this.getIdentityClaims();
      if (claims !== null) {
        if (claims['preferred_username'] !== '') {
          this.useraliasSubject.next(claims['preferred_username']);
        }
      }
    }
  }
}
