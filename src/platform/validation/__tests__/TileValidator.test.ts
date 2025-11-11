import { describe, it, expect } from 'vitest';
import {
  isValidMerchantTLD,
  isValidMerchantName,
  isValidMileageValue,
  isValidParsedMileage,
  isValidTileElement,
  isValidTileData,
} from '../TileValidator';

describe('TileValidator', () => {
  describe('isValidMerchantTLD', () => {
    it('should validate correct TLDs', () => {
      expect(isValidMerchantTLD('example.com')).toBe(true);
      expect(isValidMerchantTLD('sub.example.com')).toBe(true);
      expect(isValidMerchantTLD('my-domain.co.uk')).toBe(true);
      expect(isValidMerchantTLD('123.com')).toBe(true);
    });

    it('should reject invalid TLDs', () => {
      expect(isValidMerchantTLD('')).toBe(false);
      expect(isValidMerchantTLD('unknown')).toBe(false);
      expect(isValidMerchantTLD('   ')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidMerchantTLD(null as any)).toBe(false);
      expect(isValidMerchantTLD(undefined as any)).toBe(false);
      expect(isValidMerchantTLD(123 as any)).toBe(false);
    });

    it('should validate domain format', () => {
      expect(isValidMerchantTLD('valid-domain.com')).toBe(true);
      expect(isValidMerchantTLD('-invalid.com')).toBe(false);
      expect(isValidMerchantTLD('invalid-.com')).toBe(false);
      expect(isValidMerchantTLD('in..valid.com')).toBe(false);
    });
  });

  describe('isValidMerchantName', () => {
    it('should validate correct merchant names', () => {
      expect(isValidMerchantName('Amazon')).toBe(true);
      expect(isValidMerchantName('Walmart')).toBe(true);
      expect(isValidMerchantName('Best Buy')).toBe(true);
      expect(isValidMerchantName('1-800-Flowers')).toBe(true);
    });

    it('should reject empty or placeholder names', () => {
      expect(isValidMerchantName('')).toBe(false);
      expect(isValidMerchantName('Unknown')).toBe(false);
      expect(isValidMerchantName('N/A')).toBe(false);
      expect(isValidMerchantName('   ')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidMerchantName(null as any)).toBe(false);
      expect(isValidMerchantName(undefined as any)).toBe(false);
      expect(isValidMerchantName(123 as any)).toBe(false);
    });

    it('should validate length constraints', () => {
      expect(isValidMerchantName('A')).toBe(false); // Too short
      expect(isValidMerchantName('AB')).toBe(true); // Minimum
      expect(isValidMerchantName('A'.repeat(200))).toBe(true); // Maximum
      expect(isValidMerchantName('A'.repeat(201))).toBe(false); // Too long
    });
  });

  describe('isValidMileageValue', () => {
    it('should validate miles format', () => {
      expect(isValidMileageValue('5X miles')).toBe(true);
      expect(isValidMileageValue('10,000 miles')).toBe(true);
      expect(isValidMileageValue('5000 miles')).toBe(true);
      expect(isValidMileageValue('2x miles')).toBe(true);
    });

    it('should validate cashback format', () => {
      expect(isValidMileageValue('5% back')).toBe(true);
      expect(isValidMileageValue('2.5% back')).toBe(true);
      expect(isValidMileageValue('up to 10% back')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidMileageValue('')).toBe(false);
      expect(isValidMileageValue('invalid')).toBe(false);
      expect(isValidMileageValue('just text')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidMileageValue(null as any)).toBe(false);
      expect(isValidMileageValue(undefined as any)).toBe(false);
      expect(isValidMileageValue(123 as any)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidMileageValue('5X MILES')).toBe(true);
      expect(isValidMileageValue('5% BACK')).toBe(true);
    });
  });

  describe('isValidParsedMileage', () => {
    it('should validate positive numbers', () => {
      expect(isValidParsedMileage(0)).toBe(true);
      expect(isValidParsedMileage(100)).toBe(true);
      expect(isValidParsedMileage(5000)).toBe(true);
      expect(isValidParsedMileage(1000000)).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(isValidParsedMileage(-1)).toBe(false);
      expect(isValidParsedMileage(-100)).toBe(false);
    });

    it('should reject unreasonably large numbers', () => {
      expect(isValidParsedMileage(1000001)).toBe(false);
      expect(isValidParsedMileage(Infinity)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(isValidParsedMileage(NaN)).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(isValidParsedMileage('123' as any)).toBe(false);
      expect(isValidParsedMileage(null as any)).toBe(false);
      expect(isValidParsedMileage(undefined as any)).toBe(false);
    });
  });

  describe('isValidTileElement', () => {
    it('should validate tile elements with correct attributes', () => {
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', 'feed-tile-abc123');

      expect(isValidTileElement(tile)).toBe(true);
    });

    it('should reject elements without data-testid', () => {
      const tile = document.createElement('div');

      expect(isValidTileElement(tile)).toBe(false);
    });

    it('should reject elements with wrong data-testid prefix', () => {
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', 'wrong-prefix-abc123');

      expect(isValidTileElement(tile)).toBe(false);
    });

    it('should reject non-HTMLElement values', () => {
      expect(isValidTileElement(null)).toBe(false);
      expect(isValidTileElement(undefined)).toBe(false);
      expect(isValidTileElement({})).toBe(false);
      expect(isValidTileElement('div')).toBe(false);
    });
  });

  describe('isValidTileData', () => {
    const createValidTileData = () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', 'feed-tile-abc123');

      return {
        element,
        merchantTLD: 'example.com',
        merchantName: 'Example Store',
        mileage: '5X miles',
        parsedMileage: 5000,
      };
    };

    it('should validate complete valid tile data', () => {
      const data = createValidTileData();
      expect(isValidTileData(data)).toBe(true);
    });

    it('should reject data with invalid element', () => {
      const data = createValidTileData();
      data.element = document.createElement('div'); // Missing data-testid

      expect(isValidTileData(data)).toBe(false);
    });

    it('should reject data with invalid merchantTLD', () => {
      const data = createValidTileData();
      data.merchantTLD = 'unknown';

      expect(isValidTileData(data)).toBe(false);
    });

    it('should reject data with invalid merchantName', () => {
      const data = createValidTileData();
      data.merchantName = 'Unknown';

      expect(isValidTileData(data)).toBe(false);
    });

    it('should reject data with invalid mileage', () => {
      const data = createValidTileData();
      data.mileage = 'invalid';

      expect(isValidTileData(data)).toBe(false);
    });

    it('should reject data with invalid parsedMileage', () => {
      const data = createValidTileData();
      data.parsedMileage = -100;

      expect(isValidTileData(data)).toBe(false);
    });

    it('should reject data with missing fields', () => {
      const data = createValidTileData();
      delete (data as any).merchantTLD;

      expect(isValidTileData(data)).toBe(false);
    });

    it('should reject empty object', () => {
      expect(isValidTileData({})).toBe(false);
    });

    it('should reject partial data', () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', 'feed-tile-abc123');

      expect(isValidTileData({ element })).toBe(false);
      expect(isValidTileData({ element, merchantTLD: 'example.com' })).toBe(false);
    });

    it('should validate all fields together', () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', 'feed-tile-abc123');

      const completeData = {
        element,
        merchantTLD: 'walmart.com',
        merchantName: 'Walmart',
        mileage: '10,000 miles',
        parsedMileage: 10000,
      };

      expect(isValidTileData(completeData)).toBe(true);
    });
  });

  describe('type guards', () => {
    it('isValidTileElement should narrow type', () => {
      const element: any = document.createElement('div');
      element.setAttribute('data-testid', 'feed-tile-abc');

      if (isValidTileElement(element)) {
        // TypeScript should know this is HTMLElement
        expect(element.tagName).toBeDefined();
      }
    });

    it('isValidMerchantTLD should narrow type', () => {
      const tld: unknown = 'example.com';

      if (isValidMerchantTLD(tld)) {
        // TypeScript should know this is string
        expect(tld.toLowerCase()).toBe('example.com');
      }
    });
  });
});
