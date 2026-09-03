/**
 * Entspricht der Entity Exercise im Backend
 * (ch.mamie.mike.M295_TrainTrack_Backend.exercise.Exercise).
 *
 * id ist optional, weil sie beim Anlegen noch nicht existiert -
 * die vergibt erst die Datenbank (@GeneratedValue).
 */
export interface Exercise {
  id?: number;
  name: string;
  weight: number;
}
