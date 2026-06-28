import { describe, it, expect } from 'vitest';
import { makeSequentialScale, NO_DATA_COLOR } from '../src/lib/colors';

describe('color scale', () => {
  it('returns the no-data color for null', () => {
    const scale = makeSequentialScale([0, 100]);
    expect(scale(null)).toBe(NO_DATA_COLOR);
  });
  it('returns different colors for low vs high values', () => {
    const scale = makeSequentialScale([0, 100]);
    expect(scale(5)).not.toBe(scale(95));
  });
});
