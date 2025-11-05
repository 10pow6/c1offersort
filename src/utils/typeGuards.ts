import { VALID_URLS } from "./constants";

export function isValidCapitalOneUrl(url: string | undefined): boolean {
  if (!url) return false;
  return VALID_URLS.some((validUrl) => url.startsWith(validUrl));
}
