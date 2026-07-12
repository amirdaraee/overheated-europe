import { describe, it, expect } from 'vitest';
import { getCountries, getTemperatures } from '../src/lib/data';

describe('data accessors', () => {
  it('returns all 31 countries', () => {
    expect(getCountries().length).toBe(31);
  });
  it('returns a temperatures object even if file missing', () => {
    const t = getTemperatures();
    expect(Array.isArray(t.countries)).toBe(true);
  });
});
