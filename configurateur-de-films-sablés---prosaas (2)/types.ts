
export interface WindowItem {
  id: string;
  width: number;
  height: number;
}

export interface ClientData {
  firstName: string;
  lastName: string;
  email: string;
  billingAddress: string;
  vatNumber: string;
  hasDifferentShipping: boolean;
  shippingAddress: string;
}

export enum FilmDesign {
  OPALE = 'Opale',
  RAYURES = 'Rayures',
  GEOMETRIQUE = 'Géométrique',
  DEGRADE = 'Dégradé'
}

export interface OrderOptions {
  design: FilmDesign;
  delivery: boolean;
  professionalInstallation: boolean;
}

export interface OrderSummary {
  windowCount: number;
  totalArea: number;
  filmCost: number;
  installCost: number;
  deliveryCost: number;
  totalHT: number;
}
