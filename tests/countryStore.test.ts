import { describe, it, expect } from 'vitest';
import { parseCountryParam, DEFAULT_COUNTRY, selectedCountry, setCountry } from '../src/lib/countryStore';

describe('parseCountryParam', () => {
  it('extracts and upper-cases a valid code', () => {
    expect(parseCountryParam('?country=fr')).toBe('FR');
  });
  it('falls back when missing', () => {
    expect(parseCountryParam('')).toBe(DEFAULT_COUNTRY);
  });
  it('falls back when invalid', () => {
    expect(parseCountryParam('?country=france')).toBe(DEFAULT_COUNTRY);
    expect(parseCountryParam('?country=1')).toBe(DEFAULT_COUNTRY);
  });
  it('uses provided fallback', () => {
    expect(parseCountryParam('', 'DE')).toBe('DE');
  });
});

describe('selectedCountry atom', () => {
  it('initialises to DEFAULT_COUNTRY on the server', () => {
    expect(selectedCountry.get()).toBe(DEFAULT_COUNTRY);
  });
  it('setCountry upper-cases and updates', () => {
    setCountry('es');
    expect(selectedCountry.get()).toBe('ES');
  });
});
