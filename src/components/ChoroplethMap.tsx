import { useEffect, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { useStore } from '@nanostores/react';
import { selectedCountry } from '../lib/countryStore';
import { makeSequentialScale } from '../lib/colors';

// OBJECT_KEY: the TopoJSON object key found by inspecting public/europe.topojson
// ISO2 codes are stored in feature.id (e.g. "FR", "DE"), not in feature.properties
const OBJECT_KEY = 'europe';

interface Props {
  topojsonUrl: string;
  values: Record<string, number | null>;
  metricLabel: string;
}

export default function ChoroplethMap({ topojsonUrl, values, metricLabel }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [fc, setFc] = useState<any>(null);
  const active = useStore(selectedCountry);
  const width = 720;
  const height = 560;

  // Fetch effect — runs once per topojsonUrl; never re-fetches due to values changing
  useEffect(() => {
    let cancelled = false;
    fetch(topojsonUrl)
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        setFc(feature(topo, topo.objects[OBJECT_KEY]));
      });
    return () => {
      cancelled = true;
    };
  }, [topojsonUrl]);

  // Paint effect — re-runs when the parsed topology or data values change
  useEffect(() => {
    if (!fc || !ref.current) return;
    const numericValues = Object.values(values).filter((v): v is number => v !== null);
    const domain: [number, number] = numericValues.length
      ? [Math.min(...numericValues), Math.max(...numericValues)]
      : [0, 1];
    const color = makeSequentialScale(domain);
    const projection = geoMercator().fitSize([width, height], fc);
    const path = geoPath(projection);
    const svg = ref.current;
    svg.innerHTML = '';
    for (const f of fc.features) {
      // ISO2 is in f.id for this TopoJSON (not in properties)
      const iso2 = (f.id ?? '').toString().toUpperCase();
      const val = iso2 in values ? values[iso2] : null;
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', path(f) ?? '');
      p.setAttribute('fill', color(val));
      const isActive = iso2 === active;
      p.setAttribute('stroke', isActive ? '#0f172a' : '#94a3b8');
      p.setAttribute('stroke-width', isActive ? '2' : '0.5');
      if (isActive) p.setAttribute('stroke-linejoin', 'round');
      const name = f.properties?.NAME ?? f.properties?.name ?? iso2;
      p.addEventListener('mousemove', (e) => {
        const rect = svg.getBoundingClientRect();
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          text: `${name}: ${val === null ? 'no data' : val} ${metricLabel}`,
        });
      });
      p.addEventListener('mouseleave', () => setTooltip(null));
      svg.appendChild(p);
    }
  }, [fc, values, metricLabel, active]);

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Choropleth map of Europe by ${metricLabel}`}
      />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            background: 'rgba(15,23,42,0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
