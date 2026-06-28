import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';

const OUT = resolve('src/data/generated/heat-history.json');
const COUNTRIES = resolve('src/data/curated/countries.csv');
const START = '2000-01-01';

/**
 * @param {string[]} dates
 * @param {number[]} maxValues
 * @returns {Record<string, (number|null)[]>}
 */
export function monthlyMaxima(dates, maxValues) {
  const out = /** @type {Record<string, (number|null)[]>} */ ({});
  for (let i = 0; i < dates.length; i++) {
    const v = maxValues[i];
    if (v === null || v === undefined || Number.isNaN(v)) continue;
    const [y, m] = dates[i].split('-');
    const month = Number(m) - 1;
    if (!out[y]) out[y] = new Array(12).fill(null);
    out[y][month] = out[y][month] === null ? v : Math.max(out[y][month], v);
  }
  return out;
}

/**
 * @param {Record<string, (number|null)[]>} yearMonthly
 * @returns {Record<string, number|null>}
 */
export function annualMax(yearMonthly) {
  const out = /** @type {Record<string, number|null>} */ ({});
  for (const [year, months] of Object.entries(yearMonthly)) {
    const nums = months.filter((x) => x !== null);
    out[year] = nums.length ? Math.max(...nums) : null;
  }
  return out;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchCountry(c, end) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${c.lat}&longitude=${c.lon}`
    + `&start_date=${START}&end_date=${end}&daily=temperature_2m_max&timezone=auto`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const dates = json?.daily?.time ?? [];
      const vals = json?.daily?.temperature_2m_max ?? [];
      const years = monthlyMaxima(dates, vals);
      for (const arr of Object.values(years)) {
        for (let i = 0; i < 12; i++) if (arr[i] !== null) arr[i] = Math.round(arr[i] * 10) / 10;
      }
      return years;
    } catch (err) {
      console.warn(`Attempt ${attempt + 1} failed for ${c.iso2}: ${err.message}`);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  console.error(`All attempts failed for ${c.iso2}; omitting.`);
  return null;
}

async function main() {
  const end = today();
  const rows = parse(readFileSync(COUNTRIES, 'utf8'), { columns: true, skip_empty_lines: true, trim: true });
  const countries = {};
  for (const c of rows) {
    const years = await fetchCountry(c, end);
    if (years) countries[c.iso2] = { years };
    await new Promise((r) => setTimeout(r, 400));
  }
  const out = {
    fetched_at: new Date().toISOString(),
    source: 'Open-Meteo Archive API (ERA5)',
    start_year: 2000,
    end_year: Number(end.slice(0, 4)),
    countries,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`Wrote ${Object.keys(countries).length} countries to ${OUT}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
