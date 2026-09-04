import { Routes } from "@angular/router";
import { NoAccess } from "./pages/no-access/no-access";
import { ExerciseList } from "./pages/exercise-list/exercise-list";
import { ExerciseForm } from "./pages/exercise-form/exercise-form";
import { AppRoles } from "./app.roles";
import { appCanActivate } from "./guard/app.auth.guard";

export const routes: Routes = [
  {
    path: 'exercise',
    component: ExerciseList,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Read],
      pagetitle: 'Alle Übungen'
    }
  },
  {
    // MUSS vor 'exercise/:id' stehen, sonst würde ':id' den Wert "new" schlucken
    path: 'exercise/new',
    component: ExerciseForm,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Update],
      pagetitle: 'Neue Übung'
    }
  },
  {
    path: 'exercise/:id',
    component: ExerciseForm,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Update],
      pagetitle: 'Übung bearbeiten'
    }
  },
  // TODO: gleiches Muster für gym, training und plan
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
