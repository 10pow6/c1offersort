/**
 * Star button creation and management
 * Replaces: src/shared/favoritesHelpers.ts createStarButton
 */

import { toggleFavorite } from './FavoritesStore';
import { extractMileageText } from '@/platform/dom/TileExtractor';
import type { StarButtonConfig } from './favorites.types';

/**
 * Create a star button for a tile
 */
export function createStarButton(
  _tile: HTMLElement,
  config: StarButtonConfig
): HTMLElement {
  const star = document.createElement('button');
  star.className = 'c1-favorite-star';
  star.setAttribute('data-c1-favorite-star', 'true');
  star.setAttribute('data-merchant-tld', config.merchantTLD);
  star.setAttribute('data-merchant-name', config.merchantName);
  star.setAttribute('data-favorited', config.initiallyFavorited ? 'true' : 'false');
  star.textContent = config.initiallyFavorited ? "★" : "☆";
  star.setAttribute('aria-label', `${config.initiallyFavorited ? 'Remove from' : 'Add to'} favorites`);

  // Styles
  star.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 24px;
    padding: 4px;
    z-index: 10;
    color: ${config.initiallyFavorited ? 'black' : 'transparent'};
    -webkit-text-stroke: 1px black;
    transition: transform 0.2s ease;
  `;

  return star;
}

/**
 * Update star button state
 */
export function updateStarButton(star: HTMLElement, isFavorited: boolean): void {
  star.textContent = isFavorited ? "★" : "☆";
  star.setAttribute('data-favorited', isFavorited ? 'true' : 'false');
  star.style.color = isFavorited ? 'black' : 'transparent';
  star.setAttribute('aria-label', `${isFavorited ? 'Remove from' : 'Add to'} favorites`);
}

/**
 * Setup event delegation for star buttons (more efficient than individual listeners)
 */
export function setupStarEventDelegation(container: HTMLElement): AbortController {
  const abortController = new AbortController();

  container.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('c1-favorite-star')) return;

    e.stopPropagation();
    e.preventDefault();

    const merchantTLD = target.getAttribute('data-merchant-tld');
    const merchantName = target.getAttribute('data-merchant-name');
    if (!merchantTLD || !merchantName) return;

    // Find tile to extract mileage
    const tile = target.closest('[data-testid^="feed-tile-"]') as HTMLElement;
    if (!tile) return;

    try {
      const mileageValue = extractMileageText(tile);
      const nowFavorited = await toggleFavorite(merchantTLD, merchantName, mileageValue);

      // Update this star button
      updateStarButton(target, nowFavorited);

      // Update all other star buttons for this merchant (for duplicates)
      const allStars = container.querySelectorAll(
        `.c1-favorite-star[data-merchant-tld="${merchantTLD}"]`
      );
      allStars.forEach((star) => {
        if (star !== target) {
          updateStarButton(star as HTMLElement, nowFavorited);
        }
      });
    } catch (error) {
      console.error('[StarButton] Failed to toggle favorite:', error);
    }
  }, { signal: abortController.signal });

  return abortController;
}

/**
 * Inject CSS hover styles for star buttons (better performance than JS)
 */
export function injectStarHoverStyles(): void {
  const styleId = 'c1-favorites-hover-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .c1-favorite-star:hover {
      transform: scale(1.2) !important;
    }
  `;
  document.head.appendChild(style);
}
