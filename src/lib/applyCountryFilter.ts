import { selectedCountry } from './countryStore';

export function filterRows(container: HTMLElement, country: string): number {
  const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-country]'));
  let matches = 0;
  for (const row of rows) {
    const code = row.dataset.country;
    if (code === 'EU') { row.hidden = false; continue; }
    const show = code === country;
    row.hidden = !show;
    if (show) matches++;
  }
  return matches;
}

export function applyCountryFilter(): void {
  if (typeof document === 'undefined') return;
  const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-filter-group]'));
  const update = (country: string) => {
    for (const g of groups) {
      const count = filterRows(g, country);
      const empty = g.querySelector<HTMLElement>('[data-empty]');
      if (empty) empty.hidden = count > 0;
      g.querySelectorAll<HTMLElement>('[data-country-label]').forEach((el) => {
        const names = (window as any).__countryNames ?? {};
        el.textContent = names[country] ?? country;
      });
    }
  };
  selectedCountry.subscribe(update);
}
