import { Address } from './address';

/** Entspricht der Entity Gym im Backend. */
export interface Gym {
  id?: number;
  name: string;
  address: Address;
}
