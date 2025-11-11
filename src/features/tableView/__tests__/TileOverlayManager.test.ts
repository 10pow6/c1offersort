import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveTileState,
  applyInvisibleOverlay,
  restoreTileState,
  hasSavedState,
} from '../TileOverlayManager';

describe('TileOverlayManager', () => {
  let tile: HTMLElement;

  beforeEach(() => {
    tile = document.createElement('div');
    // Set some initial styles
    tile.style.position = 'relative';
    tile.style.opacity = '1';
    tile.style.zIndex = '1';
    tile.style.display = 'block';
  });

  describe('saveTileState', () => {
    it('should save tile original styles', () => {
      saveTileState(tile);
      expect(hasSavedState(tile)).toBe(true);
    });

    it('should only save original state once', () => {
      tile.style.opacity = '1';
      saveTileState(tile);

      // Modify styles
      tile.style.opacity = '0.5';

      // Save again - should not overwrite
      saveTileState(tile);

      // Restore should use ORIGINAL state
      restoreTileState(tile);

      expect(tile.style.opacity).toBe('1');
    });

    it('should save all critical style properties', () => {
      tile.style.position = 'absolute';
      tile.style.top = '100px';
      tile.style.left = '50px';
      tile.style.width = '200px';
      tile.style.height = '300px';
      tile.style.opacity = '0.8';
      tile.style.pointerEvents = 'none';
      tile.style.zIndex = '10';
      tile.style.display = 'flex';

      saveTileState(tile);

      // Change all styles
      tile.style.position = 'fixed';
      tile.style.opacity = '0';

      // Restore
      restoreTileState(tile);

      expect(tile.style.position).toBe('absolute');
      expect(tile.style.top).toBe('100px');
      expect(tile.style.left).toBe('50px');
      expect(tile.style.width).toBe('200px');
      expect(tile.style.height).toBe('300px');
      expect(tile.style.opacity).toBe('0.8');
      expect(tile.style.pointerEvents).toBe('none');
      expect(tile.style.zIndex).toBe('10');
      expect(tile.style.display).toBe('flex');
    });
  });

  describe('applyInvisibleOverlay', () => {
    it('should apply invisible overlay styles', () => {
      applyInvisibleOverlay(tile);

      expect(tile.style.position).toBe('absolute');
      expect(tile.style.top).toBe('0px');
      expect(tile.style.left).toBe('0px');
      expect(tile.style.width).toBe('100%');
      expect(tile.style.height).toBe('100%');
      expect(tile.style.opacity).toBe('0'); // INVISIBLE
      expect(tile.style.pointerEvents).toBe('auto'); // But CLICKABLE
      expect(tile.style.zIndex).toBe('5'); // Above table
    });

    it('should apply overflow and height constraints', () => {
      applyInvisibleOverlay(tile);

      expect(tile.style.overflow).toBe('hidden');
      expect(tile.style.maxHeight).toBe('100%');
    });

    it('should make tile invisible but clickable', () => {
      applyInvisibleOverlay(tile);

      // These are the KEY properties for the workaround
      expect(tile.style.opacity).toBe('0'); // User can't see it
      expect(tile.style.pointerEvents).toBe('auto'); // But can click it
      expect(tile.style.zIndex).toBe('5'); // It's on top
    });
  });

  describe('restoreTileState', () => {
    it('should restore original styles', () => {
      tile.style.opacity = '1';
      tile.style.zIndex = '2';

      saveTileState(tile);
      applyInvisibleOverlay(tile);

      expect(tile.style.opacity).toBe('0');
      expect(tile.style.zIndex).toBe('5');

      restoreTileState(tile);

      expect(tile.style.opacity).toBe('1');
      expect(tile.style.zIndex).toBe('2');
    });

    it('should do nothing if no saved state', () => {
      tile.style.opacity = '0.5';

      restoreTileState(tile);

      // Should remain unchanged
      expect(tile.style.opacity).toBe('0.5');
    });

    it('should handle empty string styles', () => {
      // Tiles might not have inline styles set initially
      const freshTile = document.createElement('div');

      saveTileState(freshTile);
      applyInvisibleOverlay(freshTile);
      restoreTileState(freshTile);

      // Should restore to empty strings
      expect(freshTile.style.opacity).toBe('');
      expect(freshTile.style.zIndex).toBe('');
    });
  });

  describe('hasSavedState', () => {
    it('should return false initially', () => {
      expect(hasSavedState(tile)).toBe(false);
    });

    it('should return true after saving state', () => {
      saveTileState(tile);
      expect(hasSavedState(tile)).toBe(true);
    });

    it('should work with multiple tiles', () => {
      const tile1 = document.createElement('div');
      const tile2 = document.createElement('div');

      saveTileState(tile1);

      expect(hasSavedState(tile1)).toBe(true);
      expect(hasSavedState(tile2)).toBe(false);
    });
  });

  describe('complete workflow', () => {
    it('should preserve original state through overlay and restore', () => {
      // Set up original state
      tile.style.position = 'relative';
      tile.style.opacity = '1';
      tile.style.zIndex = '1';
      tile.style.display = 'block';

      // Save state
      saveTileState(tile);

      // Apply overlay (table view active)
      applyInvisibleOverlay(tile);

      expect(tile.style.opacity).toBe('0');
      expect(tile.style.zIndex).toBe('5');
      expect(tile.style.position).toBe('absolute');

      // Restore (back to grid view)
      restoreTileState(tile);

      expect(tile.style.opacity).toBe('1');
      expect(tile.style.zIndex).toBe('1');
      expect(tile.style.position).toBe('relative');
      expect(tile.style.display).toBe('block');
    });

    it('should handle multiple overlay/restore cycles', () => {
      tile.style.opacity = '1';

      saveTileState(tile);

      // Cycle 1
      applyInvisibleOverlay(tile);
      restoreTileState(tile);
      expect(tile.style.opacity).toBe('1');

      // Cycle 2
      applyInvisibleOverlay(tile);
      restoreTileState(tile);
      expect(tile.style.opacity).toBe('1');

      // Cycle 3
      applyInvisibleOverlay(tile);
      restoreTileState(tile);
      expect(tile.style.opacity).toBe('1');
    });
  });

  describe('WeakMap memory management', () => {
    it('should not prevent garbage collection', () => {
      let tempTile: HTMLElement | null = document.createElement('div');

      saveTileState(tempTile);
      expect(hasSavedState(tempTile)).toBe(true);

      // Clear reference (would allow GC in real scenario)
      tempTile = null;

      // WeakMap should allow the tile to be garbage collected
      // (Can't test GC directly, but WeakMap implementation ensures this)
    });
  });
});
