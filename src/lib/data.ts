import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadCsv } from './loadCsv';
import {
  CountrySchema, AcPenetrationSchema, AcBySettingSchema,
  RegulationSchema, PriceSchema, SurveySchema, MortalitySchema,
  HeatThresholdSchema,
  type Country, type AcPenetration, type AcBySetting,
  type Regulation, type Price, type Survey, type Mortality,
  type HeatThreshold,
} from './schemas';

const CURATED = resolve('src/data/curated');
const GENERATED = resolve('src/data/generated/temperatures.json');
const HEAT_HISTORY = resolve('src/data/generated/heat-history.json');

export interface CountryTemp {
  iso2: string;
  name: string;
  current_temp_c: number | null;
  daily_max_c: number[];
  dates: string[];
  summer_mean_c: number | null;
  stale: boolean;
}
export interface TemperatureData {
  fetched_at: string;
  baseline: string;
  countries: CountryTemp[];
}

export interface HeatHistory {
  fetched_at: string;
  source: string;
  start_year: number;
  end_year: number;
  countries: Record<string, { years: Record<string, (number | null)[]> }>;
}

export const getCountries = (): Country[] => loadCsv(resolve(CURATED, 'countries.csv'), CountrySchema);
export const getAcPenetration = (): AcPenetration[] => loadCsv(resolve(CURATED, 'ac_penetration.csv'), AcPenetrationSchema);
export const getAcBySetting = (): AcBySetting[] => loadCsv(resolve(CURATED, 'ac_by_setting.csv'), AcBySettingSchema);
export const getRegulations = (): Regulation[] => loadCsv(resolve(CURATED, 'regulations.csv'), RegulationSchema);
export const getPrices = (): Price[] => loadCsv(resolve(CURATED, 'prices.csv'), PriceSchema);
export const getSurveys = (): Survey[] => loadCsv(resolve(CURATED, 'surveys.csv'), SurveySchema);
export const getMortality = (): Mortality[] => loadCsv(resolve(CURATED, 'mortality.csv'), MortalitySchema);
export const getHeatThresholds = (): HeatThreshold[] => loadCsv(resolve(CURATED, 'heat_thresholds.csv'), HeatThresholdSchema);

export function getTemperatures(): TemperatureData {
  if (!existsSync(GENERATED)) return { fetched_at: '', baseline: '', countries: [] };
  return JSON.parse(readFileSync(GENERATED, 'utf8')) as TemperatureData;
}

export function getHeatHistory(): HeatHistory {
  if (!existsSync(HEAT_HISTORY)) return { fetched_at: '', source: '', start_year: 0, end_year: 0, countries: {} };
  return JSON.parse(readFileSync(HEAT_HISTORY, 'utf8')) as HeatHistory;
}
