/** Entspricht der Entity Address im Backend. */
export interface Address {
  id?: number;
  street: string;
  houseNumber: string;
  plz: string;
  city: string;
  country: string;
}
