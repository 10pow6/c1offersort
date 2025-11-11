/**
 * Security validation utilities
 * Prevent injection attacks and validate untrusted data
 */

/**
 * Validate Base64 string
 */
export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Base64 regex
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) {
    return false;
  }

  // Try to decode
  try {
    const decoded = atob(str);
    return decoded.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  const temp = document.createElement('div');
  temp.textContent = html; // This escapes HTML
  return temp.innerHTML;
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow https for security
    return parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Validate Capital One URL
 */
export function isValidCapitalOneURL(url: string): boolean {
  if (!isValidURL(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Must be capitalone.com domain
    return parsed.hostname.endsWith('.capitalone.com') || parsed.hostname === 'capitalone.com';
  } catch (error) {
    return false;
  }
}

/**
 * Sanitize string input (remove HTML, control characters)
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');

  // Remove null bytes and control characters
  cleaned = cleaned.replace(/[\0-\x1F\x7F]/g, '');

  // Trim to max length
  cleaned = cleaned.substring(0, maxLength);

  return cleaned.trim();
}

/**
 * Validate JSON string
 */
export function isValidJSON(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Parse JSON safely
 */
export function parseJSONSafely<T = any>(str: string, fallback: T): T {
  if (!isValidJSON(str)) {
    return fallback;
  }

  try {
    return JSON.parse(str) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Validate storage key
 */
export function isValidStorageKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Should only contain alphanumeric, dash, underscore
  const keyRegex = /^[a-zA-Z0-9_-]+$/;
  if (!keyRegex.test(key)) {
    return false;
  }

  // Reasonable length
  if (key.length > 100) {
    return false;
  }

  return true;
}

/**
 * Validate data size for storage
 */
export function isWithinStorageLimit(data: any, maxBytes: number = 1000000): boolean {
  try {
    const serialized = JSON.stringify(data);
    const bytes = new Blob([serialized]).size;
    return bytes <= maxBytes;
  } catch (error) {
    return false;
  }
}
