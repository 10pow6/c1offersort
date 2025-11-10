export interface OfferData {
  tile: HTMLElement;
  merchantName: string;
  mileage: string;
  merchantTLD: string;
  logoUrl?: string;
  offerType?: string;
  order?: number;
}

export interface TileState {
  originalStyles: {
    position: string;
    top: string;
    left: string;
    width: string;
    height: string;
    opacity: string;
    pointerEvents: string;
    zIndex: string;
    display: string;
  };
}

export interface TableViewResult {
  success: boolean;
  offersShown?: number;
  error?: string;
}
