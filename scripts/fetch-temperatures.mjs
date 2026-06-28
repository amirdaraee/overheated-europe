import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { parse } from 'csv-parse/sync';

const OUT = resolve('src/data/generated/temperatures.json');
const COUNTRIES = resolve('src/data/curated/countries.csv');

export function transformForecast(iso2, name, json) {
  const daily = json?.daily ?? {};
  const dates = Array.isArray(daily.time) ? daily.time : [];
  const daily_max_c = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];
  const current = json?.current?.temperature_2m;
  const current_temp_c = typeof current === 'number' ? current : null;
  const summer_mean_c = daily_max_c.length
    ? Math.round((daily_max_c.reduce((a, b) => a + b, 0) / daily_max_c.length) * 10) / 10
    : null;
  return {
    iso2,
    name,
    current_temp_c,
    daily_max_c,
    dates,
    summer_mean_c,
    stale: current_temp_c === null && daily_max_c.length === 0,
  };
}

async function fetchCountry(c) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}`
    + `&current=temperature_2m&daily=temperature_2m_max&past_days=10&forecast_days=3&timezone=auto`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return transformForecast(c.iso2, c.name, json);
    } catch (err) {
      console.warn(`Attempt ${attempt + 1} failed for ${c.iso2}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  console.error(`All attempts failed for ${c.iso2}; marking stale.`);
  return { iso2: c.iso2, name: c.name, current_temp_c: null, daily_max_c: [], dates: [], summer_mean_c: null, stale: true };
}

async function main() {
  const rows = parse(readFileSync(COUNTRIES, 'utf8'), { columns: true, skip_empty_lines: true, trim: true });
  const countries = [];
  for (const c of rows) {
    countries.push(await fetchCountry(c));
    await new Promise((r) => setTimeout(r, 250)); // polite delay for free API
  }
  const out = {
    fetched_at: new Date().toISOString(),
    baseline: 'Open-Meteo forecast API; summer_mean_c = mean of recent daily max',
    countries,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${countries.length} countries to ${OUT}`);
}

// Run main() only when executed directly, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
