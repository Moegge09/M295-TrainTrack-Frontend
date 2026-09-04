import { Routes } from "@angular/router";
import { NoAccess } from "./pages/no-access/no-access";
import { ExerciseList } from "./pages/exercise-list/exercise-list";
import { ExerciseForm } from "./pages/exercise-form/exercise-form";
import { GymList } from "./pages/gym-list/gym-list";
import { GymForm } from "./pages/gym-form/gym-form";
import { TrainingList } from "./pages/training-list/training-list";
import { TrainingForm } from "./pages/training-form/training-form";
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
  {
    path: 'gym',
    component: GymList,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Read],
      pagetitle: 'Alle Gyms'
    }
  },
  {
    // MUSS vor 'gym/:id' stehen
    path: 'gym/new',
    component: GymForm,
    canActivate: [appCanActivate],
    data: {
      // Gyms schreiben verlangt im Backend die Rolle admin, nicht update
      roles: [AppRoles.Admin],
      pagetitle: 'Neues Gym'
    }
  },
  {
    path: 'gym/:id',
    component: GymForm,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Admin],
      pagetitle: 'Gym bearbeiten'
    }
  },
  {
    path: 'training',
    component: TrainingList,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Read],
      pagetitle: 'Alle Trainings'
    }
  },
  {
    // MUSS vor 'training/:id' stehen
    path: 'training/new',
    component: TrainingForm,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Update],
      pagetitle: 'Neues Training'
    }
  },
  {
    path: 'training/:id',
    component: TrainingForm,
    canActivate: [appCanActivate],
    data: {
      roles: [AppRoles.Update],
      pagetitle: 'Training bearbeiten'
    }
  },
  // TODO: gleiches Muster für plan
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
