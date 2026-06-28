import { describe, it, expect } from 'vitest';
import { monthlyMaxima, annualMax } from '../scripts/fetch-heat-history.mjs';

describe('monthlyMaxima', () => {
  it('reduces daily maxima to per-year 12-month arrays', () => {
    const dates = ['2020-01-01', '2020-01-15', '2020-07-10', '2021-07-01'];
    const vals = [5, 8, 33, 30];
    const out = monthlyMaxima(dates, vals);
    expect(out['2020'][0]).toBe(8);   // Jan 2020 max
    expect(out['2020'][6]).toBe(33);  // Jul 2020 max
    expect(out['2020'][1]).toBeNull(); // Feb 2020 absent
    expect(out['2021'][6]).toBe(30);  // Jul 2021
  });
});

describe('annualMax', () => {
  it('takes the max across a year\'s months, null if all null', () => {
    const monthly = { '2020': [8, null, null, null, null, null, 33, null, null, null, null, null], '2019': new Array(12).fill(null) };
    const out = annualMax(monthly);
    expect(out['2020']).toBe(33);
    expect(out['2019']).toBeNull();
  });
});
