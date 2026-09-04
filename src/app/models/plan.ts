import { Training } from './training';

/** Entspricht der Entity Plan im Backend. */
export interface Plan {
  id?: number;
  name: string;
  trainings: Training[];
}

/** Was das Backend bei POST und PUT erwartet (PlanRequestDTO): nur IDs. */
export interface PlanRequest {
  name: string;
  trainingIds: number[];
}
