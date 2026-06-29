import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { selectedCountry, setCountry, DEFAULT_COUNTRY } from '../lib/countryStore';

interface Props { countries: { iso2: string; name: string }[] }

export default function CountrySelector({ countries }: Props) {
  const current = useStore(selectedCountry);

  useEffect(() => {
    if (!countries.some((c) => c.iso2 === current)) {
      setCountry(countries.some((c) => c.iso2 === DEFAULT_COUNTRY) ? DEFAULT_COUNTRY : (countries[0]?.iso2 ?? DEFAULT_COUNTRY));
    }
  }, [current, countries]);

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-slate-600 dark:text-slate-400">Country:</span>
      <select
        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
        value={current}
        onChange={(e) => setCountry(e.target.value)}
        aria-label="Select a country to filter the page"
      >
        {countries.map((c) => (
          <option key={c.iso2} value={c.iso2}>{c.name}</option>
        ))}
      </select>
    </label>
  );
}
