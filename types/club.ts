export interface Club {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
