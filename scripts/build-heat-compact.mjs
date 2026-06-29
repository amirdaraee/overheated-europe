// Builds public/heat-compact.json from the generated heat-history + temperatures
// datasets, in the compact shape the Dossier UI consumes:
//   { years:[...], hist:{ISO:{peak:[],summer:[]}}, cur:{ISO:{current,mean,daily:[]}}, fetched }
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const HIST = resolve('src/data/generated/heat-history.json');
const TEMPS = resolve('src/data/generated/temperatures.json');
const OUT = resolve('public/heat-compact.json');

const hist = existsSync(HIST) ? JSON.parse(readFileSync(HIST, 'utf8')) : { countries: {}, start_year: 2000, end_year: new Date().getUTCFullYear() };
const temps = existsSync(TEMPS) ? JSON.parse(readFileSync(TEMPS, 'utf8')) : { countries: [], fetched_at: '' };

const years = [];
for (let y = hist.start_year; y <= hist.end_year; y++) years.push(String(y));

const annualMax = (months) => {
  const v = months.filter((m) => m != null);
  return v.length ? Math.max(...v) : null;
};
const summerMean = (months) => {
  // months index: 0=Jan ... 5=Jun,6=Jul,7=Aug
  const jja = [months[5], months[6], months[7]].filter((m) => m != null);
  return jja.length ? Math.round((jja.reduce((a, b) => a + b, 0) / jja.length) * 10) / 10 : null;
};

const histOut = {};
for (const [iso, obj] of Object.entries(hist.countries)) {
  const peak = [], summer = [];
  for (const y of years) {
    const months = obj.years?.[y] ?? null;
    peak.push(months ? annualMax(months) : null);
    summer.push(months ? summerMean(months) : null);
  }
  histOut[iso] = { peak, summer };
}

const curOut = {};
for (const c of temps.countries) {
  curOut[c.iso2] = {
    current: c.current_temp_c ?? null,
    mean: c.summer_mean_c ?? null,
    daily: Array.isArray(c.daily_max_c) ? c.daily_max_c.slice(-13) : [],
  };
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ years, hist: histOut, cur: curOut, fetched: temps.fetched_at || '' }));
console.log(`Wrote ${OUT}: ${years.length} years, ${Object.keys(histOut).length} hist countries, ${Object.keys(curOut).length} cur countries`);
