import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLogin } from './app-login';
import {AuthConfig, OAuthModule} from 'angular-oauth2-oidc';
import { authConfig } from '../../app.auth';

describe('AppLoginComponent', () => {
  let component: AppLogin;
  let fixture: ComponentFixture<AppLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        OAuthModule.forRoot({ resourceServer: { sendAccessToken: true } }),
        AppLogin
    ],
    providers: [
        { 
            provide: AuthConfig, 
            useValue: authConfig }
    ],
    teardown: {destroyAfterEach: true}
})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
