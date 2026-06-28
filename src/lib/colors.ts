import { scaleSequential } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';

export const NO_DATA_COLOR = '#e2e8f0';

export function makeSequentialScale(domain: [number, number]): (v: number | null) => string {
  const scale = scaleSequential(interpolateYlOrRd).domain(domain);
  return (v: number | null) => (v === null || Number.isNaN(v) ? NO_DATA_COLOR : scale(v));
}
