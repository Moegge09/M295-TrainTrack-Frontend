import { Routes } from "@angular/router";
import { NoAccess } from "./pages/no-access/no-access";
import { ExerciseList } from "./pages/exercise-list/exercise-list";
import { AppRoles } from "./app.roles";
import { appCanActivate } from "./guard/app.auth.guard";

export const routes: Routes = [
  {
    path: 'exercise',
    component: ExerciseList,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Read],
      pagetitle: 'Alle Uebungen'
    }
  },
  // TODO: gleiches Muster fuer plan, training und gym
  {
    path: '',
    redirectTo: 'exercise',
    pathMatch: 'full'
  },
  {
    path: 'noaccess',
    component: NoAccess
  },
];
