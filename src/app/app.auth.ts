import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';

export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8080/realms/M295-TrainTrack-Backend',
  requireHttps: false,
  redirectUri: environment.frontendBaseUrl,
  postLogoutRedirectUri: environment.frontendBaseUrl,
  clientId: 'M295-TrainTrack-Backend',
  scope: 'openid profile roles offline_access',
  responseType: 'code',
  showDebugInformation: true,
  requestAccessToken: true,
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
  silentRefreshTimeout: 500,
  clearHashAfterLogin: true,
  waitForTokenInMsec: 1000
};