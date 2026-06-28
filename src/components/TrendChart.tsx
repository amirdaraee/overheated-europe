import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

interface Props { dates: string[]; values: number[]; label: string }

export default function TrendChart({ dates, values, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const data = dates.map((d, i) => ({ date: new Date(d), value: values[i] }));
    const chart = Plot.plot({
      marginLeft: 50,
      y: { label, grid: true },
      x: { label: null },
      marks: [
        Plot.lineY(data, { x: 'date', y: 'value', stroke: '#dc2626', strokeWidth: 2 }),
        Plot.dot(data, { x: 'date', y: 'value', fill: '#dc2626', r: 2 }),
      ],
    });
    ref.current.innerHTML = '';
    ref.current.append(chart);
    return () => chart.remove();
  }, [dates, values, label]);
  return <div ref={ref} role="img" aria-label={label} />;
}
