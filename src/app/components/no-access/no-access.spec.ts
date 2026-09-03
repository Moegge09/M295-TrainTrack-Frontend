import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoAccess } from './no-access';
import { authConfig } from '../../app.auth';
import { AuthConfig, OAuthModule } from 'angular-oauth2-oidc';

describe('NoAccessComponent', () => {
  let component: NoAccess;
  let fixture: ComponentFixture<NoAccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        OAuthModule.forRoot({ 
            resourceServer: { 
                sendAccessToken: true 
            } 
        }),
        NoAccess
    ],
    providers: [
        { provide: AuthConfig, useValue: authConfig },
        ],
        teardown: {destroyAfterEach: true}
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoAccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
