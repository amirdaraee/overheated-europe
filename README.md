# Europe Heatwave & Air-Conditioning Evidence

A static, fully-cited advocacy site on Europe's rising heat and the air-conditioning gap.

## Stack
Astro 6 · Tailwind 4 · React islands · Observable Plot · d3-geo · Open-Meteo (build-time)

## Develop
```bash
npm install
npm run fetch:temps   # fetch temperature data into src/data/generated/
npm run dev
```

## Test & build
```bash
npm test
npm run build
```

## Data
- Temperatures: Open-Meteo, refreshed daily by CI.
- Everything else: hand-curated CSVs in `src/data/curated/`, every row sourced. See the in-site Methodology page.

## Deploy
Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
