import { describe, it, expect } from 'vitest';
import {
  extractMerchantTLD,
  extractMerchantName,
  extractMileageText,
  parseMileageValue,
  domainToDisplayName,
  isValidMerchantTLD,
} from '../TileExtractor';

describe('TileExtractor', () => {
  describe('isValidMerchantTLD', () => {
    it('should validate correct TLDs', () => {
      expect(isValidMerchantTLD('example.com')).toBe(true);
      expect(isValidMerchantTLD('sub.example.com')).toBe(true);
      expect(isValidMerchantTLD('my-site.co.uk')).toBe(true);
      expect(isValidMerchantTLD('test123.io')).toBe(true);
    });

    it('should reject invalid TLDs', () => {
      expect(isValidMerchantTLD('')).toBe(false);
      expect(isValidMerchantTLD('.')).toBe(false);
      expect(isValidMerchantTLD('.com')).toBe(false);
      expect(isValidMerchantTLD('-example.com')).toBe(false);
      expect(isValidMerchantTLD('example..com')).toBe(false);
      expect(isValidMerchantTLD('example.com.')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidMerchantTLD(null as any)).toBe(false);
      expect(isValidMerchantTLD(undefined as any)).toBe(false);
      expect(isValidMerchantTLD(123 as any)).toBe(false);
      expect(isValidMerchantTLD({} as any)).toBe(false);
    });

    it('should reject too long TLDs', () => {
      const longTLD = 'a'.repeat(101) + '.com';
      expect(isValidMerchantTLD(longTLD)).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      expect(isValidMerchantTLD('../../../etc/passwd')).toBe(false);
      expect(isValidMerchantTLD('..\\..\\windows\\system32')).toBe(false);
    });
  });

  describe('extractMerchantTLD', () => {
    it('should extract TLD from data-testid (Base64 JSON)', () => {
      const data = { inventory: { merchantTLD: 'example.com' } };
      const base64 = btoa(JSON.stringify(data));
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', `feed-tile-${base64}`);

      expect(extractMerchantTLD(tile)).toBe('example.com');
    });

    it('should return empty string for invalid Base64', () => {
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', 'feed-tile-invalid!!!base64');

      expect(extractMerchantTLD(tile)).toBe('');
    });

    it('should return empty string for malformed JSON', () => {
      const base64 = btoa('not valid json{');
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', `feed-tile-${base64}`);

      expect(extractMerchantTLD(tile)).toBe('');
    });

    it('should validate extracted TLD format', () => {
      const data = { inventory: { merchantTLD: 'invalid..domain' } };
      const base64 = btoa(JSON.stringify(data));
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', `feed-tile-${base64}`);

      expect(extractMerchantTLD(tile)).toBe('');
    });

    it('should extract TLD from image src (fallback)', () => {
      const tile = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://example.com/logo?domain=merchant.com';
      tile.appendChild(img);

      expect(extractMerchantTLD(tile)).toBe('merchant.com');
    });

    it('should extract TLD from link href (fallback)', () => {
      const tile = document.createElement('div');
      const link = document.createElement('a');
      link.href = '/offers?merchantTLD=merchant.com&other=param';
      tile.appendChild(link);

      expect(extractMerchantTLD(tile)).toBe('merchant.com');
    });

    it('should return empty string if no extraction method works', () => {
      const tile = document.createElement('div');
      expect(extractMerchantTLD(tile)).toBe('');
    });

    it('should reject excessively long Base64', () => {
      const longBase64 = 'A'.repeat(10001);
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', `feed-tile-${longBase64}`);

      expect(extractMerchantTLD(tile)).toBe('');
    });

    it('should handle URL decoding in link href', () => {
      const tile = document.createElement('div');
      const link = document.createElement('a');
      link.href = '/offers?merchantTLD=my%2Dmerchant.com';
      tile.appendChild(link);

      expect(extractMerchantTLD(tile)).toBe('my-merchant.com');
    });
  });

  describe('domainToDisplayName', () => {
    it('should convert simple domains to display names', () => {
      expect(domainToDisplayName('amazon.com')).toBe('Amazon');
      expect(domainToDisplayName('walmart.com')).toBe('Walmart');
      expect(domainToDisplayName('target.com')).toBe('Target');
    });

    it('should handle multi-word domains', () => {
      expect(domainToDisplayName('bestbuy.com')).toBe('Bestbuy');
      expect(domainToDisplayName('cumberlandfarms.com')).toBe('Cumberlandfarms');
    });

    it('should handle domains with hyphens', () => {
      expect(domainToDisplayName('capital-one.com')).toBe('Capital One');
      expect(domainToDisplayName('coca-cola.com')).toBe('Coca Cola');
    });

    it('should handle domains with underscores', () => {
      expect(domainToDisplayName('my_merchant.com')).toBe('My Merchant');
    });

    it('should strip common TLDs', () => {
      expect(domainToDisplayName('example.com')).toBe('Example');
      expect(domainToDisplayName('example.net')).toBe('Example');
      expect(domainToDisplayName('example.org')).toBe('Example');
      expect(domainToDisplayName('example.co.uk')).toBe('Example');
      expect(domainToDisplayName('example.io')).toBe('Example');
    });

    it('should handle camelCase domains', () => {
      expect(domainToDisplayName('eBay.com')).toBe('E Bay');
      expect(domainToDisplayName('PayPal.com')).toBe('Pay Pal');
    });

    it('should return "Unknown Merchant" for empty domain', () => {
      expect(domainToDisplayName('')).toBe('Unknown Merchant');
    });

    it('should capitalize properly', () => {
      expect(domainToDisplayName('WALMART.COM')).toBe('Walmart');
      expect(domainToDisplayName('target.COM')).toBe('Target');
    });
  });

  describe('extractMerchantName', () => {
    it('should extract and convert merchant name from TLD', () => {
      const data = { inventory: { merchantTLD: 'amazon.com' } };
      const base64 = btoa(JSON.stringify(data));
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', `feed-tile-${base64}`);

      expect(extractMerchantName(tile)).toBe('Amazon');
    });

    it('should return "Unknown Merchant" if TLD not found', () => {
      const tile = document.createElement('div');
      expect(extractMerchantName(tile)).toBe('Unknown Merchant');
    });
  });

  describe('extractMileageText', () => {
    it('should extract mileage text from tile', () => {
      const tile = document.createElement('div');
      const mileageDiv = document.createElement('div');
      mileageDiv.className = 'CardReward';
      mileageDiv.setAttribute('style', 'color: rgb(37, 129, 14)');
      mileageDiv.textContent = '5X miles';
      tile.appendChild(mileageDiv);

      expect(extractMileageText(tile)).toBe('5X miles');
    });

    it('should trim whitespace', () => {
      const tile = document.createElement('div');
      const mileageDiv = document.createElement('div');
      mileageDiv.className = 'CardReward';
      mileageDiv.setAttribute('style', 'color: rgb(37, 129, 14)');
      mileageDiv.textContent = '  10X miles  ';
      tile.appendChild(mileageDiv);

      expect(extractMileageText(tile)).toBe('10X miles');
    });

    it('should return "0 miles" if not found', () => {
      const tile = document.createElement('div');
      expect(extractMileageText(tile)).toBe('0 miles');
    });
  });

  describe('parseMileageValue', () => {
    it('should parse multiplier format (e.g., "5X miles")', () => {
      expect(parseMileageValue('5X miles')).toBe(5000);
      expect(parseMileageValue('10X miles')).toBe(10000);
      expect(parseMileageValue('2X miles')).toBe(2000);
    });

    it('should parse numeric format (e.g., "5,000 miles")', () => {
      expect(parseMileageValue('5,000 miles')).toBe(5000);
      expect(parseMileageValue('10,000 miles')).toBe(10000);
      expect(parseMileageValue('50,000 miles')).toBe(50000);
    });

    it('should handle "Up to" prefix', () => {
      expect(parseMileageValue('Up to 10,000 miles')).toBe(10000);
      expect(parseMileageValue('Up to 5X miles')).toBe(5000);
    });

    it('should remove asterisks', () => {
      expect(parseMileageValue('5X miles*')).toBe(5000);
      expect(parseMileageValue('*5,000 miles*')).toBe(5000);
    });

    it('should be case insensitive', () => {
      expect(parseMileageValue('5x Miles')).toBe(5000);
      expect(parseMileageValue('5X MILES')).toBe(5000);
    });

    it('should return 0 for invalid formats', () => {
      expect(parseMileageValue('')).toBe(0);
      expect(parseMileageValue('invalid')).toBe(0);
      expect(parseMileageValue('no numbers here')).toBe(0);
    });

    it('should handle numbers without commas', () => {
      expect(parseMileageValue('5000 miles')).toBe(5000);
      expect(parseMileageValue('10000 miles')).toBe(10000);
    });

    it('should prioritize multiplier pattern over miles pattern', () => {
      // If both patterns match, multiplier takes precedence
      expect(parseMileageValue('5X miles')).toBe(5000);
    });
  });

  describe('security', () => {
    it('should reject script injection in data-testid', () => {
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', 'feed-tile-<script>alert(1)</script>');

      expect(extractMerchantTLD(tile)).toBe('');
    });

    it('should handle malicious JSON safely', () => {
      const maliciousData = {
        inventory: {
          merchantTLD: '<img src=x onerror=alert(1)>',
        },
      };
      const base64 = btoa(JSON.stringify(maliciousData));
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', `feed-tile-${base64}`);

      expect(extractMerchantTLD(tile)).toBe('');
    });

    it('should handle prototype pollution attempts', () => {
      const maliciousData = {
        inventory: {
          merchantTLD: 'example.com',
          __proto__: { polluted: true },
        },
      };
      const base64 = btoa(JSON.stringify(maliciousData));
      const tile = document.createElement('div');
      tile.setAttribute('data-testid', `feed-tile-${base64}`);

      // Should extract valid TLD, ignore prototype pollution
      expect(extractMerchantTLD(tile)).toBe('example.com');
    });
  });
});
