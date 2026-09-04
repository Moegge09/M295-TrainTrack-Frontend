import { Exercise } from './exercise';
import { Gym } from './gym';

/** Entspricht dem Enum java.time.DayOfWeek, im Token als String serialisiert. */
export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

/** Deutsche Beschriftung je Wochentag, Reihenfolge wie im Enum. */
export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Montag',
  TUESDAY: 'Dienstag',
  WEDNESDAY: 'Mittwoch',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
  SATURDAY: 'Samstag',
  SUNDAY: 'Sonntag',
};

/** Entspricht der Entity Training im Backend. */
export interface Training {
  id?: number;
  name: string;
  day: DayOfWeek;
  exercises: Exercise[];
  gym: Gym | null;
}

/** Was das Backend beim Anlegen erwartet (TrainingRequestDTO): nur IDs. */
export interface TrainingRequest {
  name: string;
  day: DayOfWeek;
  gymId: number | null;
  exerciseIds: number[];
}
