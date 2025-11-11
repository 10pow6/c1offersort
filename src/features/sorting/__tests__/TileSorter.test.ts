import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TileSorter } from '../TileSorter';
import { TileData } from '../sorting.types';
import { mockRequestAnimationFrame } from '@/test/testUtils';

describe('TileSorter', () => {
  const createTileData = (overrides: Partial<TileData> = {}): TileData => ({
    element: document.createElement('div'),
    merchantTLD: 'example.com',
    merchantName: 'Example',
    mileage: 0,
    ...overrides,
  });

  describe('sort by mileage', () => {
    it('should sort tiles by mileage descending', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'A', mileage: 5 }),
        createTileData({ merchantName: 'B', mileage: 10 }),
        createTileData({ merchantName: 'C', mileage: 3 }),
      ];

      const sorted = TileSorter.sort(tiles, 'mileage', 'desc');

      expect(sorted.map(t => t.mileage)).toEqual([10, 5, 3]);
      expect(sorted[0].sortOrder).toBe(0);
      expect(sorted[1].sortOrder).toBe(1);
      expect(sorted[2].sortOrder).toBe(2);
    });

    it('should sort tiles by mileage ascending', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'A', mileage: 5 }),
        createTileData({ merchantName: 'B', mileage: 10 }),
        createTileData({ merchantName: 'C', mileage: 3 }),
      ];

      const sorted = TileSorter.sort(tiles, 'mileage', 'asc');

      expect(sorted.map(t => t.mileage)).toEqual([3, 5, 10]);
    });

    it('should handle zero mileage values', () => {
      const tiles: TileData[] = [
        createTileData({ mileage: 0 }),
        createTileData({ mileage: 5 }),
        createTileData({ mileage: 0 }),
      ];

      const sorted = TileSorter.sort(tiles, 'mileage', 'desc');

      expect(sorted.map(t => t.mileage)).toEqual([5, 0, 0]);
    });

    it('should handle identical mileage values', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'A', mileage: 5 }),
        createTileData({ merchantName: 'B', mileage: 5 }),
        createTileData({ merchantName: 'C', mileage: 5 }),
      ];

      const sorted = TileSorter.sort(tiles, 'mileage', 'desc');

      expect(sorted.map(t => t.mileage)).toEqual([5, 5, 5]);
    });
  });

  describe('sort alphabetically', () => {
    it('should sort tiles alphabetically ascending', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'Zebra' }),
        createTileData({ merchantName: 'Apple' }),
        createTileData({ merchantName: 'Mango' }),
      ];

      const sorted = TileSorter.sort(tiles, 'alphabetical', 'asc');

      expect(sorted.map(t => t.merchantName)).toEqual(['Apple', 'Mango', 'Zebra']);
      expect(sorted[0].sortOrder).toBe(0);
      expect(sorted[1].sortOrder).toBe(1);
      expect(sorted[2].sortOrder).toBe(2);
    });

    it('should sort tiles alphabetically descending', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'Zebra' }),
        createTileData({ merchantName: 'Apple' }),
        createTileData({ merchantName: 'Mango' }),
      ];

      const sorted = TileSorter.sort(tiles, 'alphabetical', 'desc');

      expect(sorted.map(t => t.merchantName)).toEqual(['Zebra', 'Mango', 'Apple']);
    });

    it('should handle case-insensitive sorting', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'zebra' }),
        createTileData({ merchantName: 'Apple' }),
        createTileData({ merchantName: 'MANGO' }),
      ];

      const sorted = TileSorter.sort(tiles, 'alphabetical', 'asc');

      expect(sorted.map(t => t.merchantName)).toEqual(['Apple', 'MANGO', 'zebra']);
    });

    it('should handle special characters and numbers', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: '1-800-Flowers' }),
        createTileData({ merchantName: 'Amazon' }),
        createTileData({ merchantName: '99 Cents Store' }),
      ];

      const sorted = TileSorter.sort(tiles, 'alphabetical', 'asc');

      // localeCompare handles this
      expect(sorted[0].sortOrder).toBe(0);
      expect(sorted[1].sortOrder).toBe(1);
      expect(sorted[2].sortOrder).toBe(2);
    });
  });

  describe('sort by merchantMileage (combined)', () => {
    it('should sort by mileage desc, then merchant asc', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'Zebra', mileage: 10 }),
        createTileData({ merchantName: 'Apple', mileage: 10 }),
        createTileData({ merchantName: 'Mango', mileage: 5 }),
      ];

      const sorted = TileSorter.sort(tiles, 'merchantMileage', 'desc-asc');

      expect(sorted.map(t => `${t.merchantName}:${t.mileage}`)).toEqual([
        'Apple:10',
        'Zebra:10',
        'Mango:5',
      ]);
    });

    it('should sort by mileage asc, then merchant desc', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'Apple', mileage: 5 }),
        createTileData({ merchantName: 'Zebra', mileage: 5 }),
        createTileData({ merchantName: 'Mango', mileage: 10 }),
      ];

      const sorted = TileSorter.sort(tiles, 'merchantMileage', 'asc-desc');

      expect(sorted.map(t => `${t.merchantName}:${t.mileage}`)).toEqual([
        'Zebra:5',
        'Apple:5',
        'Mango:10',
      ]);
    });

    it('should default to desc-asc if no separator in order', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'Zebra', mileage: 10 }),
        createTileData({ merchantName: 'Apple', mileage: 10 }),
      ];

      const sorted = TileSorter.sort(tiles, 'merchantMileage', 'desc');

      expect(sorted.map(t => t.merchantName)).toEqual(['Apple', 'Zebra']);
    });

    it('should handle complex mixed data', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'Target', mileage: 5 }),
        createTileData({ merchantName: 'Walmart', mileage: 10 }),
        createTileData({ merchantName: 'Amazon', mileage: 10 }),
        createTileData({ merchantName: 'Costco', mileage: 5 }),
        createTileData({ merchantName: 'Best Buy', mileage: 15 }),
      ];

      const sorted = TileSorter.sort(tiles, 'merchantMileage', 'desc-asc');

      expect(sorted.map(t => `${t.merchantName}:${t.mileage}`)).toEqual([
        'Best Buy:15',
        'Amazon:10',
        'Walmart:10',
        'Costco:5',
        'Target:5',
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const sorted = TileSorter.sort([], 'mileage', 'desc');
      expect(sorted).toEqual([]);
    });

    it('should handle single tile', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'Solo', mileage: 5 }),
      ];

      const sorted = TileSorter.sort(tiles, 'mileage', 'desc');

      expect(sorted).toHaveLength(1);
      expect(sorted[0].sortOrder).toBe(0);
    });

    it('should not mutate original array', () => {
      const tiles: TileData[] = [
        createTileData({ merchantName: 'B', mileage: 2 }),
        createTileData({ merchantName: 'A', mileage: 1 }),
      ];

      const originalOrder = [...tiles];
      TileSorter.sort(tiles, 'alphabetical', 'asc');

      expect(tiles).toEqual(originalOrder);
    });

    it('should assign sequential sort orders starting from 0', () => {
      const tiles: TileData[] = [
        createTileData({ mileage: 1 }),
        createTileData({ mileage: 2 }),
        createTileData({ mileage: 3 }),
      ];

      const sorted = TileSorter.sort(tiles, 'mileage', 'asc');

      expect(sorted.map(t => t.sortOrder)).toEqual([0, 1, 2]);
    });
  });

  describe('applyToDOM', () => {
    it('should apply sort order to DOM elements', () => {
      const { raf, flush } = mockRequestAnimationFrame();

      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      const sortedTiles = [
        { ...createTileData({ element: element1 }), sortOrder: 0 },
        { ...createTileData({ element: element2 }), sortOrder: 1 },
      ];

      TileSorter.applyToDOM(sortedTiles);

      expect(raf).toHaveBeenCalled();

      flush();

      expect(element1.style.cssText).toContain('order: 0');
      expect(element2.style.cssText).toContain('order: 1');
      expect(element1.style.cssText).toContain('content-visibility: auto');
      expect(element1.style.cssText).toContain('grid-area: auto');
    });

    it('should skip tiles without element', () => {
      const { raf, flush } = mockRequestAnimationFrame();

      const element = document.createElement('div');
      const sortedTiles = [
        { ...createTileData({ element }), sortOrder: 0 },
        { ...createTileData({ element: null as any }), sortOrder: 1 },
      ];

      TileSorter.applyToDOM(sortedTiles);
      flush();

      expect(element.style.cssText).toContain('order: 0');
      // Should not throw for null element
    });

    it('should apply performance optimizations', () => {
      const { flush } = mockRequestAnimationFrame();

      const element = document.createElement('div');
      const sortedTiles = [
        { ...createTileData({ element }), sortOrder: 0 },
      ];

      TileSorter.applyToDOM(sortedTiles);
      flush();

      expect(element.style.cssText).toContain('content-visibility: auto');
      expect(element.style.cssText).toContain('contain: layout style');
      expect(element.style.cssText).toContain('contain-intrinsic-size: auto 200px');
    });
  });

  describe('default criteria', () => {
    it('should default to mileage if unknown criteria', () => {
      const tiles: TileData[] = [
        createTileData({ mileage: 5 }),
        createTileData({ mileage: 10 }),
        createTileData({ mileage: 3 }),
      ];

      const sorted = TileSorter.sort(tiles, 'unknown-criteria', 'desc');

      expect(sorted.map(t => t.mileage)).toEqual([10, 5, 3]);
    });
  });
});
