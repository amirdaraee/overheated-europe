import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

interface Props { data: { name: string; value: number | null }[]; xLabel: string }

export default function BarChart({ data, xLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const rows = data.filter((d): d is { name: string; value: number } => d.value !== null);
    const chart = Plot.plot({
      marginLeft: 120,
      x: { label: xLabel, grid: true },
      y: { label: null },
      marks: [
        Plot.barX(rows, { x: 'value', y: 'name', fill: '#ea580c', sort: { y: 'x', reverse: true } }),
        Plot.ruleX([0]),
      ],
    });
    ref.current.innerHTML = '';
    ref.current.append(chart);
    return () => chart.remove();
  }, [data, xLabel]);
  return <div ref={ref} role="img" aria-label={xLabel} />;
}
