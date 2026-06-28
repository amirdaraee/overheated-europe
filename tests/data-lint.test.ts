import { describe, it, expect } from 'vitest';
import { getAcPenetration, getAcBySetting, getRegulations, getPrices, getSurveys, getMortality, getHeatThresholds } from '../src/lib/data';

const all = {
  ac_penetration: getAcPenetration,
  ac_by_setting: getAcBySetting,
  regulations: getRegulations,
  prices: getPrices,
  surveys: getSurveys,
  mortality: getMortality,
  heat_thresholds: getHeatThresholds,
};

describe('curated data provenance', () => {
  for (const [name, fn] of Object.entries(all)) {
    it(`${name}: every row with a source_url has a name and date`, () => {
      for (const row of fn() as any[]) {
        if (row.source_url) {
          expect(row.source_name, `${name} row missing source_name`).toBeTruthy();
          expect(row.source_date, `${name} row missing source_date`).toBeTruthy();
        }
      }
    });
  }
});
