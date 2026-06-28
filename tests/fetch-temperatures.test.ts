import { describe, it, expect } from 'vitest';
import { transformForecast } from '../scripts/fetch-temperatures.mjs';

const sample = {
  current: { temperature_2m: 31.4 },
  daily: {
    time: ['2026-06-20', '2026-06-21', '2026-06-22'],
    temperature_2m_max: [30, 32, 34],
  },
};

describe('transformForecast', () => {
  it('extracts current temp, daily max series, and mean', () => {
    const r = transformForecast('FR', 'France', sample);
    expect(r.iso2).toBe('FR');
    expect(r.current_temp_c).toBe(31.4);
    expect(r.daily_max_c).toEqual([30, 32, 34]);
    expect(r.dates).toEqual(['2026-06-20', '2026-06-21', '2026-06-22']);
    expect(r.summer_mean_c).toBe(32);
    expect(r.stale).toBe(false);
  });

  it('handles missing data gracefully', () => {
    const r = transformForecast('NO', 'Norway', {});
    expect(r.current_temp_c).toBeNull();
    expect(r.daily_max_c).toEqual([]);
    expect(r.summer_mean_c).toBeNull();
    expect(r.stale).toBe(true);
  });
});
