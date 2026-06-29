import { useEffect, useMemo, useRef, useState } from 'react';
import * as Plot from '@observablehq/plot';
import { useStore } from '@nanostores/react';
import { selectedCountry } from '../lib/countryStore';

interface Threshold { label: string; temp_c: number; severity: string }
interface Props {
  history: Record<string, { years: Record<string, (number | null)[]> }>;
  nameOf: Record<string, string>;
  thresholds: Threshold[];
  startYear: number;
  endYear: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function HeatChart({ history, nameOf, thresholds }: Props) {
  const country = useStore(selectedCountry);
  const countryName = nameOf[country] ?? country;
  const years = useMemo(() => {
    const y = history[country]?.years ?? {};
    return Object.keys(y).sort((a, b) => Number(b) - Number(a));
  }, [history, country]);

  const [year, setYear] = useState<string>(years[0] ?? '');
  useEffect(() => { setYear(years[0] ?? ''); }, [years]);

  const monthlyRef = useRef<HTMLDivElement>(null);
  const annualRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);

  // Track container width for full-width responsive charts.
  useEffect(() => {
    if (!monthlyRef.current) return;
    const el = monthlyRef.current;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(Math.max(320, Math.floor(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ruleMarks = useMemo(
    () =>
      thresholds.flatMap((t) => [
        Plot.ruleY([t.temp_c], { stroke: t.severity === 'extreme' ? '#7f1d1d' : '#b45309', strokeDasharray: '4,4' }),
        Plot.text([t.temp_c], { y: (d: number) => d, frameAnchor: 'right', dx: -4, dy: -6, text: () => `${t.label} (${t.temp_c}°C)`, fill: t.severity === 'extreme' ? '#7f1d1d' : '#b45309', fontSize: 10 }),
      ]),
    [thresholds],
  );

  // Monthly chart
  useEffect(() => {
    const el = monthlyRef.current;
    if (!el) return;
    el.innerHTML = '';
    const months = history[country]?.years?.[year];
    if (!months || months.every((m) => m === null)) return;
    const data = months.map((v, i) => ({ month: MONTHS[i], value: v })).filter((d) => d.value !== null);
    const chart = Plot.plot({
      width, marginLeft: 50, marginBottom: 40,
      x: { domain: MONTHS, label: null },
      y: { label: '°C monthly max', grid: true },
      marks: [Plot.barY(data, { x: 'month', y: 'value', fill: '#ea580c' }), ...ruleMarks, Plot.ruleY([0])],
    });
    el.append(chart);
    return () => chart.remove();
  }, [history, country, year, width, ruleMarks]);

  // Annual trend chart
  useEffect(() => {
    const el = annualRef.current;
    if (!el) return;
    el.innerHTML = '';
    const yObj = history[country]?.years ?? {};
    const data = Object.keys(yObj)
      .sort((a, b) => Number(a) - Number(b))
      .map((y) => {
        const months = yObj[y].filter((m): m is number => m !== null);
        return { year: new Date(Number(y), 0, 1), value: months.length ? Math.max(...months) : null };
      })
      .filter((d) => d.value !== null);
    if (!data.length) return;
    const chart = Plot.plot({
      width, marginLeft: 50, marginBottom: 30,
      y: { label: '°C annual max', grid: true },
      x: { label: null },
      marks: [
        Plot.line(data, { x: 'year', y: 'value', stroke: '#dc2626', strokeWidth: 2 }),
        Plot.dot(data, { x: 'year', y: 'value', fill: '#dc2626', r: 2 }),
        ...ruleMarks, Plot.ruleY([0]),
      ],
    });
    el.append(chart);
    return () => chart.remove();
  }, [history, country, width, ruleMarks]);

  const hasMonthly = !!history[country]?.years?.[year]?.some((m) => m !== null);
  const hasAnnual = years.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">Monthly maximum temperature — {countryName}</h3>
        <label className="inline-flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Year:</span>
          <select className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5"
            value={year} onChange={(e) => setYear(e.target.value)} aria-label="Select year">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>
      {hasMonthly ? <div ref={monthlyRef} role="img" aria-label={`Monthly max temperature for ${countryName} ${year}`} />
        : <p className="text-slate-500">No data for {countryName} {year}.</p>}

      <h3 className="text-xl font-semibold">Annual maximum temperature trend — {countryName}</h3>
      {hasAnnual ? <div ref={annualRef} role="img" aria-label={`Annual max temperature trend for ${countryName}`} />
        : <p className="text-slate-500">No data for {countryName}.</p>}
    </div>
  );
}
