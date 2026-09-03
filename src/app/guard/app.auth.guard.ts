import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {OAuthService} from 'angular-oauth2-oidc';
import { AppAuthService } from '../services/app.auth.service';

export const appCanActivate: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state: RouterStateSnapshot
) => {
  const authService: AppAuthService = inject(AppAuthService);
  const oauthService: OAuthService = inject(OAuthService);
  const router = inject(Router);

  let userRoles: string[] = [];

  authService.getRoles().subscribe(roles => {
    userRoles = roles;
  });

  if (oauthService.hasValidAccessToken()) {
    const hasRoles = checkRoles(route, userRoles);
    if (!hasRoles) {
      return router.parseUrl('/noaccess');
    }
    return hasRoles;
  }
  return router.parseUrl('/noaccess');
};

function checkRoles(route: ActivatedRouteSnapshot, userRoles: string[]): boolean {
  const roles = route.data['roles'] as Array<string>;

  if (roles === undefined || roles === null || roles.length === 0) {
    return true;
  }

  if (userRoles === undefined) {
    return false;
  }

  for (const role of roles) {
    if (userRoles.indexOf(role) > -1) {
      return true;
    }
  }
  return false;
}

export const appCanActivateChild: CanActivateChildFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => appCanActivate(route, state);