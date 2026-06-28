import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { loadCsv } from '../src/lib/loadCsv';
import {
  CountrySchema, AcPenetrationSchema, AcBySettingSchema,
  RegulationSchema, PriceSchema, SurveySchema,
} from '../src/lib/schemas';

const dir = resolve('src/data/curated');
const cases: [string, any][] = [
  ['countries.csv', CountrySchema],
  ['ac_penetration.csv', AcPenetrationSchema],
  ['ac_by_setting.csv', AcBySettingSchema],
  ['regulations.csv', RegulationSchema],
  ['prices.csv', PriceSchema],
  ['surveys.csv', SurveySchema],
];

describe('curated CSV files load and validate', () => {
  for (const [file, schema] of cases) {
    it(file, () => {
      expect(() => loadCsv(resolve(dir, file), schema)).not.toThrow();
    });
  }
});
