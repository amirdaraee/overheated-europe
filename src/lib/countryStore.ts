import { atom } from 'nanostores';

export const DEFAULT_COUNTRY = 'IT';

export function parseCountryParam(search: string, fallback: string = DEFAULT_COUNTRY): string {
  const raw = new URLSearchParams(search).get('country');
  if (!raw) return fallback;
  const code = raw.toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : fallback;
}

const initial =
  typeof window !== 'undefined' ? parseCountryParam(window.location.search) : DEFAULT_COUNTRY;

export const selectedCountry = atom<string>(initial);

export function setCountry(code: string): void {
  selectedCountry.set(code.toUpperCase());
}

// Browser-only: keep the URL in sync (no reload) so the view is shareable.
if (typeof window !== 'undefined') {
  selectedCountry.subscribe((code) => {
    const url = new URL(window.location.href);
    url.searchParams.set('country', code);
    window.history.replaceState({}, '', url);
  });
}
