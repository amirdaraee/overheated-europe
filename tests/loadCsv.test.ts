import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadCsv } from '../src/lib/loadCsv';
import { AcPenetrationSchema, PriceSchema } from '../src/lib/schemas';

function tmpCsv(contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'csvtest-'));
  const p = join(dir, 'data.csv');
  writeFileSync(p, contents);
  return p;
}

const HEADER = 'iso2,year,households_with_ac_pct,source_name,source_url,source_date';

describe('loadCsv', () => {
  it('parses a valid, fully-sourced row', () => {
    const p = tmpCsv(`${HEADER}\nFR,2020,25,IEA,https://iea.org/x,2020-05-01\n`);
    const rows = loadCsv(p, AcPenetrationSchema);
    expect(rows).toHaveLength(1);
    expect(rows[0].iso2).toBe('FR');
    expect(rows[0].households_with_ac_pct).toBe(25);
  });

  it('allows an empty data value (no data) with empty sources', () => {
    const p = tmpCsv(`${HEADER}\nNO,,,,,\n`);
    const rows = loadCsv(p, AcPenetrationSchema);
    expect(rows[0].households_with_ac_pct).toBeNull();
  });

  it('throws when a populated data row is missing a source_url', () => {
    const p = tmpCsv(`${HEADER}\nFR,2020,25,IEA,,2020-05-01\n`);
    expect(() => loadCsv(p, AcPenetrationSchema)).toThrow();
  });
});

describe('PriceSchema', () => {
  const PRICE_HEADER = 'type,capacity_kw,price_min_eur,price_max_eur,annual_running_cost_eur,region,source_name,source_url,source_date';

  it('throws when annual_running_cost_eur is populated but sources are empty', () => {
    const p = tmpCsv(`${PRICE_HEADER}\nsplit,,,,120,,,,\n`);
    expect(() => loadCsv(p, PriceSchema)).toThrow();
  });

  it('allows annual_running_cost_eur with populated sources', () => {
    const p = tmpCsv(`${PRICE_HEADER}\nsplit,,,,120,,MySource,https://example.com,2025-01-01\n`);
    const rows = loadCsv(p, PriceSchema);
    expect(rows).toHaveLength(1);
    expect(rows[0].annual_running_cost_eur).toBe(120);
  });
});
