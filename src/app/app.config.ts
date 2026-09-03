import { ApplicationConfig, importProvidersFrom, inject, provideBrowserGlobalErrorListeners, provideAppInitializer } from "@angular/core";
import { AppAuthService } from "./services/app.auth.service";
import { environment } from "../environments/environment";
import { AuthConfig, OAuthStorage, provideOAuthClient } from "angular-oauth2-oidc";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { BrowserModule } from "@angular/platform-browser";
import { authConfig } from "./app.auth";
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from "@angular/common/http";

export function storageFactory(): OAuthStorage {
  return sessionStorage;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    importProvidersFrom(
        BrowserModule,
    ),
    { 
        provide: AuthConfig, 
        useValue: authConfig 
    },
    {
      provide: OAuthStorage,
      useFactory: storageFactory,
    },
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      })
    ),    
    provideOAuthClient({ 
        resourceServer: { 
            sendAccessToken: true, 
            allowedUrls: [environment.backendBaseUrl], 
        } 
    }),
    // provideAppInitializer, NICHT provideEnvironmentInitializer: nur dieser
    // wartet auf das zurueckgegebene Promise. Der Router startet seine erste
    // Navigation erst danach. Sonst leitet der Guard bereits um, bevor
    // tryLogin() den ?code=... aus der URL lesen konnte - und mit der
    // Umleitung ist der Code aus der URL verschwunden.
    provideAppInitializer(() =>
        inject(AppAuthService).initAuth()
    )
  ]
};
