import { Routes } from "@angular/router";
import { NoAccess } from "./pages/no-access/no-access";
import { appCanActivate } from "./guard/app.auth.guard";

export const routes: Routes = [
  // TODO: Hier kommen die eigenen Seiten rein, z.B.:
  // {
  //   path: 'plan',
  //   component: PlanList,
  //   canActivate: [appCanActivate],
  //   data: {
  //     roles: [AppRoles.Read],
  //     pagetitle: 'Alle Plaene'
  //   }
  // },
  {
    path: 'noaccess',
    component: NoAccess
  },
];
