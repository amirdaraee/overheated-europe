# Europe Heatwave & Air-Conditioning Evidence

A static, fully-cited advocacy site on Europe's rising heat and the air-conditioning gap.
Every figure on the site links to its source; where a number can't be sourced, it is shown
as "no data" rather than guessed.

## What it shows

1. **Europe is heating up** — an interactive, full-width chart of maximum temperatures by
   country: monthly maxima for any chosen year, plus an annual-maximum warming trend across
   2000–present, with cited human heat-risk reference lines.
2. **The air-conditioning gap** — a choropleth map + bar chart of household AC penetration by
   country, and a by-setting breakdown.
3. **The human cost** — peer-reviewed heat-mortality / excess-deaths estimates.
4. **The rules** — national and EU regulations affecting cooling, tagged as *restricting*,
   *enabling*, or *neutral* toward AC access.
5. **The cost & affordability** — purchase and running-cost ranges, paired with how many
   Europeans can't afford to keep their homes cool.
6. **What people want** — survey data on AC preferences and intentions.

A **country filter** (top of the page) focuses every section on a single country and is
synced to the URL (e.g. `?country=FR`) so a filtered view is shareable.

## Stack

Astro 6 · React 19 islands · Tailwind 4 · Observable Plot · d3-geo + topojson · nanostores ·
Zod-validated CSVs · Vitest · Open-Meteo (build-time)

## Develop

```bash
npm install
npm run fetch:temps   # current temperatures  -> src/data/generated/temperatures.json
npm run fetch:heat    # historical monthly max -> src/data/generated/heat-history.json (slow; ERA5 archive)
npm run dev
```

## Test & build

```bash
npm test          # vitest unit tests (data validation, aggregation, store, filter)
npm run build     # astro check && astro build
```

## Data

- **Temperatures** come from the keyless [Open-Meteo](https://open-meteo.com/) API
  (current + ERA5 archive), fetched at build time. CI refreshes current temps daily and the
  historical dataset weekly.
- **Everything else** lives in hand-curated CSVs in `src/data/curated/`. A Zod schema fails
  the build if any populated row is missing its `source_name` / `source_url` / `source_date`,
  so unsourced numbers cannot ship. Full source list is on the in-site **Methodology** page.

## Deploy

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on push to `main`.
The data-refresh workflows commit updated datasets and trigger a redeploy.

> GitHub Pages for a **private** repository requires a paid GitHub plan. If this repo stays
> private on a free plan, run it locally (`npm run dev`) or make the repo public to publish.
> The build is configured for a project page at `/overheated-europe/` via the
> `ASTRO_BASE` env var in `deploy.yml` — update both if the repo is renamed.
