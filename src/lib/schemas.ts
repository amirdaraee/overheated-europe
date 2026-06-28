import { z } from 'zod';

// Empty string -> null; otherwise coerce to number.
export const numOrNull = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
  z.number().nullable(),
);
export const strOrEmpty = z.string().default('');

export const sourceFields = {
  source_name: strOrEmpty,
  source_url: strOrEmpty,
  source_date: strOrEmpty,
};

// Refinement: if `hasData` is true, all three source fields must be non-empty.
export function requireSourceWhenData<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  hasData: (row: T) => boolean,
) {
  return schema.refine(
    (row) =>
      !hasData(row) ||
      (!!row.source_name && !!row.source_url && !!row.source_date),
    { message: 'Populated data row is missing source_name/source_url/source_date' },
  );
}

export const CountrySchema = z.object({
  iso2: z.string().length(2),
  name: z.string().min(1),
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  capital: strOrEmpty,
  population: numOrNull,
});

export const AcPenetrationSchema = requireSourceWhenData(
  z.object({
    iso2: z.string().length(2),
    year: numOrNull,
    households_with_ac_pct: numOrNull,
    ...sourceFields,
  }),
  (r) => r.households_with_ac_pct !== null,
);

export const AcBySettingSchema = requireSourceWhenData(
  z.object({
    iso2: z.string().length(2),
    setting: z.enum(['home', 'workplace', 'hospital', 'school', 'restaurant']),
    penetration_pct: numOrNull,
    note: strOrEmpty,
    ...sourceFields,
  }),
  (r) => r.penetration_pct !== null,
);

export const RegulationSchema = requireSourceWhenData(
  z.object({
    iso2: z.string().length(2),
    title: strOrEmpty,
    summary: strOrEmpty,
    setpoint_limit_c: numOrNull,
    scope: z.enum(['public', 'private', 'all', '']).default(''),
    effective_year: numOrNull,
    ...sourceFields,
  }),
  (r) => !!r.title || r.setpoint_limit_c !== null,
);

export const PriceSchema = requireSourceWhenData(
  z.object({
    type: z.enum(['portable', 'split', 'multi_split', 'central', 'heat_pump']),
    capacity_kw: numOrNull,
    price_min_eur: numOrNull,
    price_max_eur: numOrNull,
    annual_running_cost_eur: numOrNull,
    region: strOrEmpty,
    ...sourceFields,
  }),
  (r) => r.price_min_eur !== null || r.price_max_eur !== null,
);

export const SurveySchema = requireSourceWhenData(
  z.object({
    iso2_or_eu: z.string().min(2),
    question: strOrEmpty,
    result_pct: numOrNull,
    sample_size: numOrNull,
    year: numOrNull,
    ...sourceFields,
  }),
  (r) => r.result_pct !== null,
);

export type Country = z.infer<typeof CountrySchema>;
export type AcPenetration = z.infer<typeof AcPenetrationSchema>;
export type AcBySetting = z.infer<typeof AcBySettingSchema>;
export type Regulation = z.infer<typeof RegulationSchema>;
export type Price = z.infer<typeof PriceSchema>;
export type Survey = z.infer<typeof SurveySchema>;
