import { VALID_URLS } from "./constants";

/**
 * Type guard to check if an element is an HTMLElement.
 *
 * @param el - The element to check
 * @returns True if the element is a non-null HTMLElement
 */
export function isHTMLElement(el: Element | null): el is HTMLElement {
  return el !== null && el instanceof HTMLElement;
}

/**
 * Type guard to check if an element is an HTMLButtonElement.
 *
 * @param el - The element to check
 * @returns True if the element is a non-null HTMLButtonElement
 */
export function isHTMLButtonElement(
  el: Element | null
): el is HTMLButtonElement {
  return el !== null && el instanceof HTMLButtonElement;
}

/**
 * Validates if a URL is a supported Capital One offers page.
 * Checks against the list of valid URLs defined in constants.
 *
 * @param url - The URL to validate
 * @returns True if the URL starts with one of the valid Capital One offers URLs
 */
export function isValidCapitalOneUrl(url: string | undefined): boolean {
  if (!url) return false;
  return VALID_URLS.some((validUrl) => url.startsWith(validUrl));
}
