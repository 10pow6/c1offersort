export interface TileData {
  element: HTMLElement;
  mileage: number;
  merchantName: string;
  merchantTLD: string;
}

export interface SortResult {
  success: boolean;
  tilesProcessed: number;
  pagesLoaded: number;
  error?: string;
}

export interface SortOptions {
  criteria: string;
  order: string;
  skipPagination?: boolean;
}
