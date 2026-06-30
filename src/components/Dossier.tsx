import React from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

function css(s: string | undefined): React.CSSProperties {
  const o: Record<string, string> = {};
  (s || '').split(';').forEach(d => {
    const i = d.indexOf(':');
    if (i < 0) return;
    const k = d.slice(0, i).trim();
    const val = d.slice(i + 1).trim();
    if (!k) return;
    const prop = k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    o[prop] = val;
  });
  return o as React.CSSProperties;
}

export default class Dossier extends React.Component<{ baseUrl: string; ac: Record<string, number> }, { country: string; metric: string; compact: any; topo: any }> {
  state = { country: 'ALL', metric: 'peak', compact: null as any, topo: null as any };

  componentDidMount() {
    fetch(this.props.baseUrl + 'heat-compact.json').then(r => r.json())
      .then(c => this.setState({ compact: c })).catch(() => {});
    fetch(this.props.baseUrl + 'europe.topojson').then(r => r.json())
      .then(t => this.setState({ topo: t })).catch(() => {});
  }

  // ---- data ----
  COUNTRIES: [string, string][] = [
    ['AT', 'Austria'], ['BE', 'Belgium'], ['BG', 'Bulgaria'], ['HR', 'Croatia'], ['CY', 'Cyprus'],
    ['CZ', 'Czech Republic'], ['DK', 'Denmark'], ['EE', 'Estonia'], ['FI', 'Finland'], ['FR', 'France'],
    ['DE', 'Germany'], ['GR', 'Greece'], ['HU', 'Hungary'], ['IE', 'Ireland'], ['IT', 'Italy'],
    ['LV', 'Latvia'], ['LT', 'Lithuania'], ['LU', 'Luxembourg'], ['MT', 'Malta'], ['NL', 'Netherlands'],
    ['PL', 'Poland'], ['PT', 'Portugal'], ['RO', 'Romania'], ['SK', 'Slovakia'], ['SI', 'Slovenia'],
    ['ES', 'Spain'], ['SE', 'Sweden'], ['GB', 'United Kingdom'], ['CH', 'Switzerland'], ['NO', 'Norway']
  ];
  CHIP_ISOS = ['ALL', 'IT', 'ES', 'FR', 'DE', 'GR', 'NL', 'PT', 'GB', 'MT'];
  // Household AC penetration (% of homes) comes from the curated, citation-validated
  // ac_penetration.csv via the `ac` prop — single source of truth.
  get AC(): Record<string, number> { return this.props.ac; }
  TILES: Record<string, [number, number]> = {
    NO: [5, 1], SE: [6, 1], FI: [7, 1], EE: [7, 2], LV: [7, 3], LT: [7, 4],
    IE: [1, 3], GB: [2, 3], DK: [5, 2], NL: [4, 3], DE: [5, 3], PL: [6, 3],
    BE: [3, 4], LU: [4, 4], CZ: [5, 4], SK: [6, 4],
    FR: [2, 5], CH: [4, 5], AT: [5, 5], HU: [6, 5], RO: [7, 5],
    PT: [1, 6], ES: [2, 6], IT: [4, 6], SI: [5, 6], HR: [6, 6], BG: [7, 6],
    GR: [6, 7], CY: [8, 7], MT: [5, 7]
  };
  MORTALITY = [
    { v: '61,672', period: 'Summer (May–Sep) 2022', sub: 'Modelled excess deaths across 35 European countries', src: ['Ballester et al. — Nature Medicine (2023)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10353926/'] },
    { v: '47,690', period: 'Full year 2023', sub: 'Second-deadliest heat year on record, despite adaptation', src: ['EEA Climate-ADAPT Observatory', 'https://climate-adapt.eea.europa.eu/en/observatory/news-archive-observatory/heat-caused-over-47-000-deaths-in-europe-in-2023'] }
  ];
  REGS = [
    { iso: 'ES', effect: 'restricts', title: 'Real Decreto-ley 14/2022', setpoint: '27', scope: 'Public', year: '2022', summary: 'Public and commercial buildings may not be cooled below 27°C in summer.', src: ['BOE — RDL 14/2022', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2022-12925'] },
    { iso: 'IT', effect: 'restricts', title: 'DL 17/2022 (Decreto Bollette)', setpoint: '25', scope: 'Public', year: '2022', summary: 'Public buildings must not cool below 25°C; hospitals and care facilities excluded.', src: ['Normattiva — DL 17/2022', 'https://www.normattiva.it/'] },
    { iso: 'EU', effect: 'restricts', title: 'Regulation (EU) 2024/573 — F-gas', setpoint: '—', scope: 'All', year: '2024', summary: 'Phases down HFCs; bans new residential AC with high-GWP refrigerant from 2027.', src: ['EUR-Lex — F-gas Regulation', 'https://eur-lex.europa.eu/eli/reg/2024/573/oj/eng'] },
    { iso: 'EU', effect: 'neutral', title: 'Directive (EU) 2024/1275 — EPBD recast', setpoint: '—', scope: 'All', year: '2024', summary: 'Sets minimum performance standards for cooling; prioritises passive cooling strategies.', src: ['EUR-Lex — EPBD recast', 'https://eur-lex.europa.eu/eli/dir/2024/1275/oj/eng'] }
  ];
  PRICES = [
    { type: 'Portable unit', cap: '2.0–3.5', min: '300', max: '650', run: '—', region: 'NL' },
    { type: 'Split system', cap: '2.5–5.0', min: '1,000', max: '2,200', run: '—', region: 'NL' },
    { type: 'Multi-split', cap: '5.0–8.0', min: '1,800', max: '3,900', run: '—', region: 'NL' },
    { type: 'Air-source heat pump', cap: '8.0–16', min: '9,000', max: '20,000', run: '—', region: 'EU (excl. DE)' }
  ];
  PRICE_SRC = ['Zoofy (NL) & HeatPumpsWatch market guides', 'https://zoofy.nl/en/price-guides/costs-of-installing-an-ac/'];
  SURVEYS = [
    { iso: 'EU', pct: 38, q: 'cannot afford adequate cooling in summer', year: 2025, src: ['EEA–Eurofound', 'https://www.eea.europa.eu/en/newsroom/news/climate-change-overheated-and-underprepared'] },
    { iso: 'FR', pct: 84, q: 'consider AC the most effective remedy for heat discomfort', year: 2026, src: ['Ipsos bva for Bouygues', 'https://www.ipsos.com/fr-fr/fortes-chaleurs-36-pourcent-des-francais-jugent-leur-logement-inadapte'] },
    { iso: 'FR', pct: 78, q: 'consider air conditioning not environmentally friendly', year: 2026, src: ['Ipsos bva for Bouygues', 'https://www.ipsos.com/fr-fr/fortes-chaleurs-36-pourcent-des-francais-jugent-leur-logement-inadapte'] },
    { iso: 'DE', pct: 23, q: 'cite environmental impact as a reason not to buy AC', year: 2024, src: ['Clean Energy Wire / Verivox', 'https://www.cleanenergywire.org/news/use-air-conditioning-rise-germany-summers-become-hotter'] },
    { iso: 'DE', pct: 19, q: 'are planning to buy an air conditioner', year: 2024, src: ['Clean Energy Wire / Verivox', 'https://www.cleanenergywire.org/news/use-air-conditioning-rise-germany-summers-become-hotter'] }
  ];
  AC_SETTING = [
    { iso: 'IT', setting: 'Homes', pct: '56', note: 'At least one space-cooling system, 2024' },
    { iso: 'FR', setting: 'Homes', pct: '24', note: 'At least one AC system, 2025' },
    { iso: 'DE', setting: 'Homes', pct: '19', note: 'Households owning an AC, 2024' },
    { iso: 'GB', setting: 'Homes', pct: '4.3', note: 'English homes using AC, 2023–24' }
  ];

  nameOf(iso: string) { const f = this.COUNTRIES.find(c => c[0] === iso); return f ? f[1] : iso; }

  // ---- heat ramp ----
  ramp(t: number) {
    t = Math.max(0, Math.min(1, t));
    const s = [[245, 232, 150], [238, 177, 71], [223, 109, 52], [176, 33, 52], [110, 16, 32]];
    const x = t * (s.length - 1), i = Math.floor(x), f = x - i, a = s[i], b = s[Math.min(i + 1, s.length - 1)];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')';
  }
  acColor(v: number | null) { return v == null ? null : this.ramp(v / 90); }

  setCountry(iso: string) { this.setState({ country: iso }); }

  series(iso: string): (number | null)[] | null {
    const c = this.state.compact; if (!c) return null;
    const m = this.state.metric;
    if (iso === 'ALL') {
      const isos = Object.keys(c.hist), n = c.years.length, out: (number | null)[] = [];
      for (let i = 0; i < n; i++) { let s = 0, k = 0; for (const is of isos) { const v = c.hist[is][m][i]; if (v != null) { s += v; k++; } } out.push(k ? Math.round(s / k * 10) / 10 : null); }
      return out;
    }
    return c.hist[iso] ? c.hist[iso][m] : null;
  }

  hottestNow(): { iso: string; v: number } | null {
    const c = this.state.compact; if (!c) return null;
    let best: { iso: string; v: number } | null = null;
    for (const k in c.cur) { const v = c.cur[k].current; if (v != null && (!best || v > best.v)) best = { iso: k, v }; }
    return best;
  }

  buildChart() {
    const c = this.state.compact;
    if (!c) return React.createElement('div', { style: { height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b8884', font: '500 12px var(--mono,monospace)' } }, 'Loading temperature record…');
    const iso = this.state.country, metric = this.state.metric;
    const data = this.series(iso) || [], years = c.years, n = years.length;
    const W = 980, H = 340, pl = 46, pr = 18, pt = 20, pb = 40;
    const iw = W - pl - pr, ih = H - pt - pb;
    const ymin = metric === 'peak' ? 22 : 14, ymax = metric === 'peak' ? 44 : 40;
    const xs = (i: number) => pl + (n <= 1 ? 0 : i * iw / (n - 1));
    const ys = (v: number) => pt + (ymax - v) / (ymax - ymin) * ih;
    const pts: number[][] = []; data.forEach((v, i) => { if (v != null) pts.push([xs(i), ys(v), v, i]); });
    // line + area paths
    let line = '', area = '';
    pts.forEach((p, k) => { line += (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' '; });
    if (pts.length) { area = 'M' + pts[0][0].toFixed(1) + ' ' + (pt + ih) + ' '; pts.forEach(p => { area += 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' '; }); area += 'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (pt + ih) + ' Z'; }
    // trend (least squares on index vs value)
    let trend: { a: number; b: number; slope: number } | null = null;
    if (pts.length > 1) { let sx = 0, sy = 0, sxx = 0, sxy = 0, m = pts.length; pts.forEach(p => { sx += p[3]; sy += p[2]; sxx += p[3] * p[3]; sxy += p[3] * p[2]; }); const b = (m * sxy - sx * sy) / (m * sxx - sx * sx); const a = (sy - b * sx) / m; trend = { a, b, slope: b }; }
    const ce = React.createElement;
    const ticks: number[] = []; for (let t = Math.ceil(ymin / 5) * 5; t <= ymax; t += 5) ticks.push(t);
    const xticks: number[] = []; for (let i = 0; i < n; i += 5) xticks.push(i); if (xticks[xticks.length - 1] !== n - 1) xticks.push(n - 1);
    const children: React.ReactNode[] = [];
    // gridlines
    ticks.forEach(t => { children.push(ce('line', { key: 'g' + t, x1: pl, x2: W - pr, y1: ys(t), y2: ys(t), stroke: t === 40 ? '#ef5350' : 'rgba(255,255,255,.09)', 'stroke-width': t === 40 ? 1.4 : 1, 'stroke-dasharray': t === 40 ? '5 4' : 'none' })); children.push(ce('text', { key: 'gt' + t, x: pl - 8, y: ys(t) + 3, 'text-anchor': 'end', fill: t === 40 ? '#ef9a92' : '#76736f', style: { font: '500 10px var(--mono,monospace)' } }, t)); });
    // area gradient
    children.push(ce('defs', { key: 'def' }, ce('linearGradient', { id: 'hg', x1: 0, y1: 0, x2: 0, y2: 1 },
      ce('stop', { offset: '0%', 'stop-color': '#e0563a', 'stop-opacity': .42 }),
      ce('stop', { offset: '100%', 'stop-color': '#e0563a', 'stop-opacity': .02 }))));
    if (area) children.push(ce('path', { key: 'area', d: area, fill: 'url(#hg)' }));
    // trend line
    if (trend) { const x0 = 0, x1 = n - 1; const v0 = trend.a + trend.b * x0, v1 = trend.a + trend.b * x1; children.push(ce('line', { key: 'tr', x1: xs(x0), y1: ys(v0), x2: xs(x1), y2: ys(v1), stroke: '#b6b2ad', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' })); }
    if (line) children.push(ce('path', { key: 'line', d: line, fill: 'none', stroke: '#e0563a', 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    // points (first+last+max)
    let maxp = pts[0]; pts.forEach(p => { if (p[2] > maxp[2]) maxp = p; });
    [pts[0], pts[pts.length - 1], maxp].filter(Boolean).forEach((p, i) => { children.push(ce('circle', { key: 'pt' + i, cx: p[0], cy: p[1], r: 3.4, fill: '#14171a', stroke: '#e0563a', 'stroke-width': 2 })); });
    if (maxp) children.push(ce('text', { key: 'maxl', x: maxp[0], y: ys(maxp[2]) - 10, 'text-anchor': 'middle', fill: '#f3f1ee', style: { font: '600 12px var(--serif,serif)' } }, maxp[2].toFixed(1) + '°'));
    // x labels
    xticks.forEach(i => { children.push(ce('text', { key: 'xl' + i, x: xs(i), y: H - 14, 'text-anchor': 'middle', fill: '#76736f', style: { font: '500 10px var(--mono,monospace)' } }, years[i])); });
    return ce('svg', { viewBox: '0 0 ' + W + ' ' + H, style: { width: '100%', height: 'auto', display: 'block' }, preserveAspectRatio: 'xMidYMid meet' }, children);
  }

  buildSpark() {
    const c = this.state.compact; if (!c) return null;
    const iso = this.state.country !== 'ALL' ? this.state.country : (this.hottestNow() || ({} as any)).iso;
    const e = c.cur[iso]; if (!e || !e.daily) return null;
    const ce = React.createElement, vals = e.daily, max = 44, bw = 20, gap = 5, H = 78;
    const children = vals.map((v: number, i: number) => { const h = Math.max(3, (v / max) * H); return ce('g', { key: i },
      ce('rect', { x: i * (bw + gap), y: H - h, width: bw, height: h, rx: 1.5, fill: this.ramp(v / 44) }),
      ce('text', { x: i * (bw + gap) + bw / 2, y: H + 13, 'text-anchor': 'middle', fill: '#8b8884', style: { font: '500 8.5px var(--mono,monospace)' } }, Math.round(v)))
    ; });
    const w = vals.length * (bw + gap);
    return ce('svg', { viewBox: '0 0 ' + w + ' ' + (H + 18), style: { width: Math.min(w, 520) + 'px', maxWidth: '100%', height: 'auto', display: 'block' } }, children);
  }

  buildBars() {
    const ce = React.createElement;
    const rows = Object.keys(this.AC).map(k => ({ iso: k, name: this.nameOf(k), v: this.AC[k] })).sort((a, b) => b.v - a.v);
    const sel = this.state.country;
    return ce('div', { style: { display: 'flex', flexDirection: 'column', gap: '9px' } }, rows.map(r => {
      const active = sel === r.iso, dim = sel !== 'ALL' && !active;
      return ce('div', { key: r.iso, style: { display: 'grid', gridTemplateColumns: '128px 1fr 52px', alignItems: 'center', gap: '12px', opacity: dim ? 0.32 : 1, transition: 'opacity .2s' } },
        ce('div', { style: { font: active ? '700 13px var(--sans)' : '500 13px var(--sans)', color: 'var(--ink)', textAlign: 'right' } }, r.name),
        ce('div', { style: { height: '22px', background: 'var(--surf2)', borderRadius: '2px', overflow: 'hidden', position: 'relative' } },
          ce('div', { style: { height: '100%', width: r.v + '%', background: this.acColor(r.v) as string, borderRight: active ? '2px solid var(--ink)' : 'none' } })),
        ce('div', { style: { font: '600 13px var(--mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' } }, r.v + '%')
      );
    }));
  }

  buildMap() {
    const ce = React.createElement, sel = this.state.country, topo = this.state.topo;
    const W = 720, H = 680;
    if (!topo) return ce('div', { style: { height: H + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '500 12px var(--mono)', color: 'var(--mut2)' } }, 'Loading map…');
    const obj = topo.objects[Object.keys(topo.objects)[0]];
    const fc: any = feature(topo, obj);
    const projection = geoMercator().fitSize([W, H], fc);
    const path = geoPath(projection);
    const norm = (id: string) => { const u = (id || '').toUpperCase(); return u === 'UK' ? 'GB' : u === 'EL' ? 'GR' : u; };
    const kids: any[] = [];
    // hatch fill for countries with no comparable figure on record
    kids.push(ce('defs', { key: 'defs' },
      ce('pattern', { id: 'ac-nodata', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
        ce('rect', { width: 5, height: 5, fill: 'var(--surf2)' }),
        ce('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: 'var(--rule)', 'stroke-width': 1 }))));
    // draw the active country last so its highlight is never clipped by neighbours
    const ordered = (fc.features as any[]).slice().sort((a, b) => (norm(String(a.id ?? '')) === sel ? 1 : 0) - (norm(String(b.id ?? '')) === sel ? 1 : 0));
    ordered.forEach((f: any, i: number) => {
      const iso = norm(f.id != null ? String(f.id) : '');
      const v = this.AC[iso] ?? null, has = v != null, active = sel === iso;
      const d = path(f); if (!d) return;
      kids.push(ce('path', {
        key: 'p' + i, d,
        fill: has ? (this.acColor(v) as string) : 'url(#ac-nodata)',
        stroke: active ? 'var(--ember)' : 'rgba(20,23,26,.32)',
        'stroke-width': active ? 2 : 0.5,
        'stroke-linejoin': 'round',
        style: { cursor: 'pointer', transition: 'fill .15s, stroke .15s' },
        onClick: () => this.setCountry(iso),
      }, ce('title', null, this.nameOf(iso) + (has ? ' — ' + v + '%' : ' — no data'))));
    });
    return ce('svg', { viewBox: '0 0 ' + W + ' ' + H, style: { width: '100%', height: 'auto', display: 'block' }, role: 'img', 'aria-label': 'Map of Europe shaded by share of homes with air conditioning' }, kids);
  }

  peakSlope(iso: string): number | null {
    const c = this.state.compact; if (!c) return null;
    const d = iso === 'ALL' ? (() => { const isos = Object.keys(c.hist), n = c.years.length, out: (number | null)[] = []; for (let i = 0; i < n; i++) { let s = 0, k = 0; for (const is of isos) { const v = c.hist[is].peak[i]; if (v != null) { s += v; k++; } } out.push(k ? s / k : null); } return out; })() : (c.hist[iso] ? c.hist[iso].peak : null);
    if (!d) return null;
    let pts: number[][] = []; d.forEach((v: number | null, i: number) => { if (v != null) pts.push([i, v]); }); if (pts.length < 2) return null;
    let sx = 0, sy = 0, sxx = 0, sxy = 0, m = pts.length; pts.forEach(p => { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; });
    return (m * sxy - sx * sy) / (m * sxx - sx * sx);
  }

  buildScatter() {
    const c = this.state.compact;
    if (!c) return React.createElement('div', { style: { height: '380px' } });
    const ce = React.createElement, sel = this.state.country;
    const acFull: Record<string, number> = { ...this.AC, GB: 4.3 };
    const pts = Object.keys(acFull).map(iso => ({ iso, name: this.nameOf(iso), ac: acFull[iso], heat: (c.cur[iso] && c.cur[iso].mean) || null })).filter(p => p.heat != null) as { iso: string; name: string; ac: number; heat: number }[];
    const W = 560, H = 440, pl = 52, pr = 24, pt = 44, pb = 52, iw = W - pl - pr, ih = H - pt - pb;
    const xmin = 0, xmax = 90, ymin = 24, ymax = 41;
    const xs = (v: number) => pl + v / (xmax - xmin) * iw, ys = (v: number) => pt + (ymax - v) / (ymax - ymin) * ih;
    const xThr = 30, yThr = 33; // exposed = heat>yThr & ac<xThr
    const kids: React.ReactNode[] = [];
    // exposed quadrant tint (top-left)
    kids.push(ce('rect', { key: 'q', x: pl, y: pt, width: xs(xThr) - pl, height: ys(yThr) - pt, fill: 'rgba(176,33,52,.07)' }));
    kids.push(ce('line', { key: 'vx', x1: xs(xThr), y1: pt, x2: xs(xThr), y2: pt + ih, stroke: 'var(--rule)', 'stroke-dasharray': '4 4' }));
    kids.push(ce('line', { key: 'hy', x1: pl, y1: ys(yThr), x2: pl + iw, y2: ys(yThr), stroke: 'var(--rule)', 'stroke-dasharray': '4 4' }));
    kids.push(ce('text', { key: 'ql', x: pl + 8, y: pt + 16, fill: '#a02617', style: { font: '600 10px var(--mono,monospace)', letterSpacing: '.08em' } }, 'EXPOSED'));
    kids.push(ce('text', { key: 'ql2', x: pl + 8, y: pt + 30, fill: '#a02617', style: { font: '400 9.5px var(--sans,sans-serif)' } }, 'hot · little cooling'));
    kids.push(ce('text', { key: 'qr', x: pl + iw - 8, y: pt + 16, 'text-anchor': 'end', fill: 'var(--mut2)', style: { font: '600 10px var(--mono,monospace)', letterSpacing: '.08em' } }, 'ADAPTED'));
    // axes ticks
    [25, 30, 35, 40].forEach(t => { kids.push(ce('text', { key: 'yt' + t, x: pl - 9, y: ys(t) + 3, 'text-anchor': 'end', fill: 'var(--mut2)', style: { font: '500 9.5px var(--mono,monospace)' } }, t + '°')); kids.push(ce('line', { key: 'ygl' + t, x1: pl, y1: ys(t), x2: pl + iw, y2: ys(t), stroke: 'var(--rule2)' })); });
    [0, 30, 60, 90].forEach(t => { kids.push(ce('text', { key: 'xt' + t, x: xs(t), y: H - 30, 'text-anchor': 'middle', fill: 'var(--mut2)', style: { font: '500 9.5px var(--mono,monospace)' } }, t + '%')); });
    // axis labels
    kids.push(ce('text', { key: 'xlab', x: pl + iw / 2, y: H - 8, 'text-anchor': 'middle', fill: 'var(--mut)', style: { font: '600 10px var(--mono,monospace)', letterSpacing: '.06em' } }, 'HOMES WITH AC →'));
    kids.push(ce('text', { key: 'ylab', x: 16, y: pt + ih / 2, 'text-anchor': 'middle', fill: 'var(--mut)', transform: 'rotate(-90 16 ' + (pt + ih / 2) + ')', style: { font: '600 10px var(--mono,monospace)', letterSpacing: '.06em' } }, 'SUMMER MEAN MAX °C →'));
    // dots
    pts.forEach(p => { const active = sel === p.iso, dim = sel !== 'ALL' && !active;
      kids.push(ce('circle', { key: 'c' + p.iso, cx: xs(p.ac), cy: ys(p.heat), r: active ? 9 : 7, fill: this.acColor(p.ac) as string, stroke: active ? 'var(--ink)' : 'rgba(0,0,0,.25)', 'stroke-width': active ? 2.5 : 1, opacity: dim ? 0.3 : 1, style: { cursor: 'pointer', transition: '.2s' }, onClick: () => this.setCountry(p.iso) }));
      kids.push(ce('text', { key: 'l' + p.iso, x: xs(p.ac), y: ys(p.heat) - 13, 'text-anchor': 'middle', fill: 'var(--ink)', opacity: dim ? 0.35 : 1, style: { font: (active ? '700' : '600') + ' 11px var(--sans,sans-serif)', cursor: 'pointer' }, onClick: () => this.setCountry(p.iso) }, p.name));
    });
    return ce('svg', { viewBox: '0 0 ' + W + ' ' + H, style: { width: '100%', height: 'auto', display: 'block' }, preserveAspectRatio: 'xMidYMid meet' }, kids);
  }

  renderVals() {
    const iso = this.state.country, metric = this.state.metric;
    const cName = iso === 'ALL' ? 'All Europe' : this.nameOf(iso);
    const c = this.state.compact;
    const hot = this.hottestNow();
    // hero hottest stat
    let hottestTemp = '—', hottestLabel = 'Hottest in Europe right now';
    if (hot) { hottestTemp = hot.v + '°C'; hottestLabel = 'Hottest in Europe right now: ' + this.nameOf(hot.iso); }

    // country select options
    const countryOpts = [{ iso2: 'ALL', name: 'All Europe' }].concat([...this.COUNTRIES].sort((a, b) => a[1].localeCompare(b[1])).map(c => ({ iso2: c[0], name: c[1] })));

    // chips
    const chipBase = 'border:none;background:transparent;cursor:pointer;padding:11px 14px;font:600 11.5px/1 var(--sans);letter-spacing:.01em;border-bottom:2px solid transparent;white-space:nowrap;transition:.15s;';
    const chips = this.CHIP_ISOS.map(k => {
      const active = iso === k;
      return { label: k === 'ALL' ? 'All Europe' : this.nameOf(k), select: () => this.setCountry(k),
        style: chipBase + (active ? 'color:var(--ember);border-bottom-color:var(--ember);' : 'color:var(--mut);') };
    });

    // heat dek
    const slope = (() => { const d = this.series(iso); if (!d) return null; let pts: number[][] = []; d.forEach((v, i) => { if (v != null) pts.push([i, v]); }); if (pts.length < 2) return null; let sx = 0, sy = 0, sxx = 0, sxy = 0, m = pts.length; pts.forEach(p => { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; }); return (m * sxy - sx * sy) / (m * sxx - sx * sx); })();
    const heatDek = iso === 'ALL'
      ? 'Across 30 European countries, the ' + (metric === 'peak' ? 'hottest day of each year' : 'June–August average') + ' has climbed steadily since 2000. Select a country to see its own record.'
      : 'The ' + (metric === 'peak' ? 'hottest day' : 'summer average') + ' recorded each year in ' + cName + ', 2000–2025, against the 40°C line at which fans stop helping and heat stress accelerates.';
    const trendLabel = slope != null ? 'Trend: ' + (slope >= 0 ? '+' : '') + (slope * 25).toFixed(1) + '°C over 25 years (' + (slope >= 0 ? '+' : '') + (slope * 10).toFixed(2) + '°C / decade)' : '';

    const segOn = 'padding:8px 13px;font:600 11px/1 var(--sans);border:none;cursor:pointer;background:#e0563a;color:#fff;';
    const segOff = 'padding:8px 13px;font:600 11px/1 var(--sans);border:none;cursor:pointer;background:transparent;color:#b9b6b1;';

    // filtered lists
    const regsView = iso === 'ALL' ? this.REGS : this.REGS.filter(r => r.iso === iso || r.iso === 'EU');
    const surveysView = iso === 'ALL' ? this.SURVEYS : this.SURVEYS.filter(s => s.iso === iso || s.iso === 'EU');
    const settingView = iso === 'ALL' ? this.AC_SETTING : this.AC_SETTING.filter(s => s.iso === iso);
    const acVal = (iso !== 'ALL' && this.AC[iso] != null) ? this.AC[iso] : null;

    // ---- per-country verdict synthesis ----
    const acFull: Record<string, number> = { ...this.AC, GB: 4.3 };
    const pslope = this.peakSlope(iso);
    const mean = c && c.cur[iso] ? c.cur[iso].mean : null;
    const reg = this.REGS.find(r => r.iso === iso && r.setpoint !== '—');
    let verdict: any = null;
    if (iso === 'ALL') {
      verdict = { isAll: true, name: 'All Europe',
        metrics: [
          { k: 'Hotter summers', v: pslope != null ? ('+' + (pslope * 25).toFixed(1) + '°C') : '—', sub: 'peak day vs 2000' },
          { k: 'Homes cooled', v: '4–84%', sub: 'range where measured' },
          { k: 'Can’t afford cooling', v: '38%', sub: 'of EU households' },
          { k: 'Heat deaths, 2022', v: '61,672', sub: 'May–Sep, modelled' }
        ],
        line: 'Europe is warming fast, but cooling is unevenly distributed and often unaffordable — and in places, capped by law.' };
    } else {
      const ac = acFull[iso] ?? null;
      const exposed = mean != null && mean > 33 && (ac == null || ac < 30);
      const ruleTxt = reg ? ('Public-building cooling capped at ' + reg.setpoint + '°C') : 'No national cooling setpoint cap';
      let line;
      if (ac == null) line = 'No comparable figure exists for how many homes here are cooled — a gap in the evidence itself.';
      else if (exposed) line = 'Among Europe’s most exposed: hot summers, yet only ' + ac + '% of homes are cooled.';
      else if (ac > 50) line = 'Relatively well-adapted — cooling is already widespread here.';
      else line = 'Cooler than the south for now, but home cooling remains scarce as summers intensify.';
      verdict = { isAll: false, name: cName, exposed,
        metrics: [
          { k: 'Hotter summers', v: pslope != null ? ((pslope >= 0 ? '+' : '') + (pslope * 25).toFixed(1) + '°C') : '—', sub: 'peak day vs 2000' },
          { k: 'Homes with AC', v: ac != null ? ac + '%' : 'no data', sub: ac != null ? 'where measured' : 'not recorded' },
          { k: 'Summer mean max', v: mean != null ? mean + '°C' : '—', sub: 'recent daily highs' },
          { k: 'Cooling rule', v: reg ? reg.setpoint + '°C cap' : 'none', sub: reg ? 'public buildings' : 'no setpoint cap' }
        ],
        line };
    }

    // ---- general Europe-wide summary (always, for the opening) ----
    const euSlope = this.peakSlope('ALL');
    const euMetrics = [
      { k: 'Hotter summers', v: euSlope != null ? ('+' + (euSlope * 25).toFixed(1) + '°C') : '—', sub: 'peak day, since 2000' },
      { k: 'Homes cooled', v: '4–84%', sub: 'range, where measured' },
      { k: 'Can’t afford cooling', v: '38%', sub: 'of EU households' },
      { k: 'Heat deaths, 2022', v: '61,672', sub: 'May–Sep, modelled' }
    ];
    const euLine = 'Europe is warming fast, but cooling is unevenly spread and often unaffordable — and in places, capped by law.';

    return {
      country: iso,
      onCountryChange: (e: any) => this.setCountry(e.target.value),
      euMetrics, euLine,
      countryOpts, chips,
      fetchedDate: c && c.fetched ? c.fetched.slice(0, 10) : '—',
      hottestTemp, hottestLabel,
      chartCountryName: cName,
      heatDek, trendLabel,
      setPeak: () => this.setState({ metric: 'peak' }), setSummer: () => this.setState({ metric: 'summer' }),
      peakBtnStyle: metric === 'peak' ? segOn : segOff, summerBtnStyle: metric === 'summer' ? segOn : segOff,
      chartEl: this.buildChart(), sparkEl: this.buildSpark(),
      barsEl: this.buildBars(), mapEl: this.buildMap(), scatterEl: this.buildScatter(),
      verdict, verdictMetrics: verdict.metrics, verdictLine: verdict.line, verdictName: verdict.name,
      verdictBadge: verdict.isAll ? 'EUROPE-WIDE' : (verdict.exposed ? 'EXPOSED' : 'PROFILE'),
      verdictBadgeStyle: 'display:inline-block;padding:3px 9px;border-radius:2px;font:600 9.5px/1 var(--mono);letter-spacing:.1em;' + (verdict.exposed ? 'background:#a02617;color:#fff;' : 'background:var(--ink);color:#f3f1ee;'),
      // section views
      mortality: this.MORTALITY,
      regsView: regsView.map(r => ({ ...r, country: this.nameOf(r.iso),
        tagStyle: 'display:inline-block;padding:2px 8px;border-radius:2px;font:600 9.5px/1.4 var(--mono);letter-spacing:.04em;text-transform:uppercase;' + (r.effect === 'restricts' ? 'background:#fbe3df;color:#a02617;' : r.effect === 'enables' ? 'background:#dff0e2;color:#1f6b34;' : 'background:#e7eaec;color:#52575e;') })),
      surveysView: surveysView.map(s => ({ ...s, pctStr: s.pct + '%', country: this.nameOf(s.iso),
        barW: s.pct + '%', region: s.iso === 'EU' ? 'EU' : this.nameOf(s.iso) })),
      settingView, prices: this.PRICES, priceSrc: this.PRICE_SRC,
      acVal, acValStr: acVal != null ? acVal + '%' : '—',
      acHeadline: iso === 'ALL' ? 'Share of households with air conditioning, by country' : this.nameOf(iso) + (acVal != null ? ' — ' + acVal + '% of homes have AC' : ' — no household AC figure on record'),
      regsEmpty: regsView.length === 0, surveysEmpty: surveysView.length === 0, settingEmpty: settingView.length === 0,
      emptyName: cName
    };
  }

  render() {
    const v = this.renderVals();
    return (
      <div style={css('max-width:1280px;margin:0 auto;min-height:100vh;background:var(--paper);overflow:hidden')}>

        <header style={css('display:flex;align-items:center;justify-content:space-between;gap:24px;padding:13px 36px;border-bottom:1px solid var(--rule)')}>
          <a href="#top" style={css('display:flex;align-items:baseline;gap:10px;text-decoration:none')}>
            <span style={css("font:600 15px/1 var(--serif);letter-spacing:-.01em")}>Europe&apos;s Heat &amp; the Cooling Gap</span>
            <span style={css('font:600 9.5px/1 var(--mono);letter-spacing:.14em;color:var(--mut2);text-transform:uppercase')}>Dossier</span>
          </a>
          <span style={css('font:500 10px/1 var(--mono);letter-spacing:.12em;color:var(--mut);text-transform:uppercase')}>Temps updated {v.fetchedDate}</span>
        </header>

        <main id="top">

          {/* HERO */}
          <section style={css('padding:72px 36px 56px;position:relative')}>
            <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:26px')}>
              <span style={css('font:600 10px/1 var(--mono);letter-spacing:.2em;color:var(--ember);text-transform:uppercase')}>Evidence Dossier</span>
              <span style={css('height:1px;flex:1;background:var(--rule)')}></span>
              <span style={css('font:500 10px/1 var(--mono);letter-spacing:.12em;color:var(--mut);text-transform:uppercase')}>30 countries · every figure sourced</span>
            </div>
            <h1 style={css('margin:0;max-width:15ch;font:600 clamp(46px,7vw,88px)/0.98 var(--serif);letter-spacing:-.02em')}>Europe is overheating. Its cooling hasn&apos;t caught up.</h1>
            <p style={css('margin:28px 0 0;max-width:54ch;font:400 19px/1.55 var(--sans);color:var(--ink2)')}>The continent that long dismissed air conditioning as an American excess is now living through deadly summers. This is the evidence — the heat, the human cost, the gap in cooling, the rules, the price, and what people actually want. Every figure is sourced.</p>

            <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:52px;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)')}>
              <div style={css('padding:24px 22px 22px;border-right:1px solid var(--rule)')}>
                <div style={css('font:600 clamp(34px,4vw,52px)/0.9 var(--serif);font-variant-numeric:tabular-nums;letter-spacing:-.02em')}>61,672</div>
                <div style={css('margin-top:11px;font:500 12px/1.4 var(--sans);color:var(--mut)')}>Heat-related excess deaths, Europe, summer 2022<a className="src" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10353926/" target="_blank" rel="noopener" title="Ballester et al., Nature Medicine (2023)">i</a></div>
              </div>
              <div style={css('padding:24px 22px 22px;border-right:1px solid var(--rule)')}>
                <div style={css('font:600 clamp(34px,4vw,52px)/0.9 var(--serif);font-variant-numeric:tabular-nums;letter-spacing:-.02em;color:var(--ember)')}>{v.hottestTemp}</div>
                <div style={css('margin-top:11px;font:500 12px/1.4 var(--sans);color:var(--mut)')}>{v.hottestLabel}<a className="src" href="https://open-meteo.com/" target="_blank" rel="noopener" title="Open-Meteo forecast API">i</a></div>
              </div>
              <div style={css('padding:24px 22px 22px;border-right:1px solid var(--rule)')}>
                <div style={css('font:600 clamp(34px,4vw,52px)/0.9 var(--serif);font-variant-numeric:tabular-nums;letter-spacing:-.02em')}>38%</div>
                <div style={css('margin-top:11px;font:500 12px/1.4 var(--sans);color:var(--mut)')}>of EU households cannot afford to keep adequately cool in summer<a className="src" href="https://www.eea.europa.eu/en/newsroom/news/climate-change-overheated-and-underprepared" target="_blank" rel="noopener" title="EEA–Eurofound, 2025">i</a></div>
              </div>
              <div style={css('padding:24px 22px 22px')}>
                <div style={css('font:600 clamp(34px,4vw,52px)/0.9 var(--serif);font-variant-numeric:tabular-nums;letter-spacing:-.02em')}>4–84%</div>
                <div style={css('margin-top:11px;font:500 12px/1.4 var(--sans);color:var(--mut)')}>range of homes with AC across countries where it is measured — England to Malta</div>
              </div>
            </div>
          </section>

          {/* THESIS: THE GAP IN ONE CHART */}
          <section style={css('padding:58px 36px 56px;border-top:1px solid var(--ink)')}>
            <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:30px')}>
              <span style={css('font:600 10px/1 var(--mono);letter-spacing:.2em;color:var(--ember);text-transform:uppercase')}>The argument in one chart</span>
              <span style={css('height:1px;flex:1;background:var(--rule)')}></span>
            </div>
            <div style={css('display:grid;grid-template-columns:0.92fr 1.08fr;gap:52px;align-items:start')}>
              <div>
                <h2 style={css('margin:0;font:600 clamp(30px,3.6vw,46px)/1.02 var(--serif);letter-spacing:-.015em')}>The gap, in one chart</h2>
                <p style={css('margin:18px 0 0;max-width:46ch;font:400 16px/1.55 var(--sans);color:var(--ink2)')}>Each country&apos;s typical summer heat plotted against the share of homes that can cool. The top-left is the danger zone: <span style={css('color:var(--ember-deep);font-weight:600')}>hot summers, little relief</span>. Click a point — or use the country filter below — to dig into any one of them.</p>

                <div style={css('margin-top:28px;border:1px solid var(--ink);background:var(--surf)')}>
                  <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid var(--rule)')}>
                    <span style={css('font:600 17px/1 var(--serif)')}>Europe at a glance</span>
                    <span style={css('font:500 9.5px/1 var(--mono);letter-spacing:.1em;color:var(--mut2);text-transform:uppercase')}>30 countries</span>
                  </div>
                  <div style={css('display:grid;grid-template-columns:1fr 1fr')}>
                    {v.euMetrics.map((m: any, i: number) => (
                      <div key={i} style={css('padding:16px 18px;border-right:1px solid var(--rule2);border-bottom:1px solid var(--rule2)')}>
                        <div style={css('font:500 9.5px/1.3 var(--mono);letter-spacing:.08em;color:var(--mut);text-transform:uppercase')}>{m.k}</div>
                        <div style={css('margin-top:7px;font:600 24px/1 var(--serif);font-variant-numeric:tabular-nums;letter-spacing:-.01em')}>{m.v}</div>
                        <div style={css('margin-top:5px;font:400 11px/1.3 var(--sans);color:var(--mut2)')}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={css('padding:16px 18px;background:var(--surf2)')}>
                    <p style={css('margin:0;font:500 italic 15px/1.45 var(--serif);color:var(--ink)')}>{v.euLine}</p>
                  </div>
                </div>
              </div>
              <div style={css('border:1px solid var(--rule);background:var(--surf);padding:8px 14px 6px;border-radius:3px')}>
                {v.scatterEl}
              </div>
            </div>
          </section>

          {/* COUNTRY FILTER (sticky) — controls everything below */}
          <div id="explore" style={css('position:sticky;top:0;z-index:40;background:rgba(230,233,235,.93);backdrop-filter:blur(10px);border-top:1px solid var(--ink);border-bottom:1px solid var(--rule);padding-left:36px')}>
            <div style={css('display:flex;align-items:center;gap:16px')}>
              <span style={css('font:600 9.5px/1 var(--mono);letter-spacing:.14em;color:var(--mut);text-transform:uppercase;flex:none')}>Explore by country</span>
              <div style={css('overflow-x:auto;flex:1')}>
                <div style={css('display:flex;gap:0')}>
                  {v.chips.map((c: any, i: number) => (
                    <button key={i} onClick={c.select} style={css(c.style)}>{c.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PER-COUNTRY VERDICT */}
          <section style={css('padding:40px 36px 4px')}>
            <div style={css('border:1px solid var(--ink);background:var(--surf);max-width:1000px')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 22px;border-bottom:1px solid var(--rule)')}>
                <span style={css('font:600 22px/1 var(--serif);letter-spacing:-.01em')}>{v.verdictName}</span>
                <span style={css(v.verdictBadgeStyle)}>{v.verdictBadge}</span>
              </div>
              <div style={css('display:grid;grid-template-columns:repeat(4,1fr)')}>
                {v.verdictMetrics.map((m: any, i: number) => (
                  <div key={i} style={css('padding:18px 22px;border-right:1px solid var(--rule2)')}>
                    <div style={css('font:500 9.5px/1.3 var(--mono);letter-spacing:.08em;color:var(--mut);text-transform:uppercase')}>{m.k}</div>
                    <div style={css('margin-top:8px;font:600 27px/1 var(--serif);font-variant-numeric:tabular-nums;letter-spacing:-.01em')}>{m.v}</div>
                    <div style={css('margin-top:5px;font:400 11px/1.3 var(--sans);color:var(--mut2)')}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <div style={css('padding:15px 22px;background:var(--surf2)')}>
                <p style={css('margin:0;font:500 italic 15.5px/1.45 var(--serif);color:var(--ink)')}>{v.verdictLine}</p>
              </div>
            </div>
          </section>

          {/* bridge */}
          <div style={css('padding:42px 36px 6px;max-width:880px')}><div style={css('display:flex;align-items:baseline;gap:16px')}><span style={css('font:600 18px/1 var(--serif);color:var(--ember);flex:none')}>↓</span><p style={css('margin:0;font:500 italic clamp(20px,2.4vw,28px)/1.35 var(--serif);color:var(--ink);max-width:34ch')}>Start with the cause. Europe&apos;s summers are not what they were.</p></div></div>

          {/* 01 THE HEAT */}
          <section id="heat" style={css('background:var(--ink);color:#f3f1ee;padding:54px 36px 64px;margin-top:18px')}>
            <div style={css('display:flex;align-items:baseline;gap:14px;margin-bottom:8px')}>
              <span style={css('font:600 11px/1 var(--mono);letter-spacing:.16em;color:var(--ember)')}>01</span>
              <h2 style={css('margin:0;font:600 clamp(30px,3.6vw,46px)/1 var(--serif);letter-spacing:-.015em')}>The Heat</h2>
            </div>
            <p style={css('margin:0;max-width:60ch;font:400 16px/1.55 var(--sans);color:#b9b6b1')}>{v.heatDek}</p>

            <div style={css('display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:30px 0 6px')}>
              <span style={css('font:600 10px/1 var(--mono);letter-spacing:.13em;color:#8b8884;text-transform:uppercase')}>Showing</span>
              <span style={css('font:600 15px/1 var(--serif)')}>{v.chartCountryName}</span>
              <span style={css('flex:1')}></span>
              <div style={css('display:inline-flex;border:1px solid rgba(255,255,255,.22);border-radius:2px;overflow:hidden')}>
                <button onClick={v.setPeak} style={css(v.peakBtnStyle)}>Annual peak</button>
                <button onClick={v.setSummer} style={css(v.summerBtnStyle)}>Summer mean</button>
              </div>
            </div>

            <div style={css('margin-top:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.02);border-radius:3px;padding:18px 18px 10px')}>
              {v.chartEl}
            </div>
            <div style={css('display:flex;flex-wrap:wrap;gap:18px;margin-top:14px;align-items:center')}>
              <span style={css('font:500 11px/1.4 var(--mono);color:#8b8884')}>{v.trendLabel}</span>
              <span style={css('flex:1')}></span>
              <span style={css('display:inline-flex;align-items:center;gap:7px;font:500 11px/1 var(--sans);color:#b9b6b1')}><span style={css('width:18px;height:2px;background:#e0563a;display:inline-block')}></span>Observed maximum</span>
              <span style={css('display:inline-flex;align-items:center;gap:7px;font:500 11px/1 var(--sans);color:#b9b6b1')}><span style={css('width:18px;height:0;border-top:2px dashed #8b8884;display:inline-block')}></span>Trend</span>
              <span style={css('display:inline-flex;align-items:center;gap:7px;font:500 11px/1 var(--sans);color:#b9b6b1')}><span style={css('width:18px;height:2px;background:#ef5350;display:inline-block')}></span>40°C danger line<a className="src" href="https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health" target="_blank" rel="noopener" title="WHO — fans become counterproductive above 40°C">i</a></span>
            </div>
            <div style={css('margin-top:24px;display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap')}>
              <div>
                <div style={css('font:600 10px/1 var(--mono);letter-spacing:.13em;color:#8b8884;text-transform:uppercase;margin-bottom:10px')}>Next 13 days · daily max °C</div>
                {v.sparkEl}
              </div>
            </div>
          </section>

          {/* bridge */}
          <div style={css('padding:50px 36px 6px;max-width:880px')}><div style={css('display:flex;align-items:baseline;gap:16px')}><span style={css('font:600 18px/1 var(--serif);color:var(--ember);flex:none')}>↓</span><p style={css('margin:0;font:500 italic clamp(20px,2.4vw,28px)/1.35 var(--serif);color:var(--ink);max-width:36ch')}>This is not discomfort. Heat is the continent&apos;s deadliest weather.</p></div></div>

          {/* 02 THE HUMAN COST */}
          <section style={css('padding:60px 36px 56px')}>
            <div style={css('display:flex;align-items:baseline;gap:14px;margin-bottom:8px')}>
              <span style={css('font:600 11px/1 var(--mono);letter-spacing:.16em;color:var(--ember)')}>02</span>
              <h2 style={css('margin:0;font:600 clamp(30px,3.6vw,46px)/1 var(--serif);letter-spacing:-.015em')}>The Human Cost</h2>
              <span style={css('font:500 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut2);text-transform:uppercase;align-self:center')}>Europe-wide</span>
            </div>
            <p style={css('margin:0 0 30px;max-width:60ch;font:400 16px/1.55 var(--sans);color:var(--ink2)')}>Heat is the deadliest extreme-weather hazard in Europe. These are not projections — they are counted, peer-reviewed excess deaths.</p>
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--ink)')}>
              {v.mortality.map((m: any, i: number) => (
                <div key={i} style={css('padding:34px 30px;border-right:1px solid var(--rule)')}>
                  <div style={css('font:500 10px/1 var(--mono);letter-spacing:.13em;color:var(--mut);text-transform:uppercase;margin-bottom:16px')}>{m.period}</div>
                  <div style={css('font:600 clamp(54px,7vw,84px)/0.86 var(--serif);font-variant-numeric:tabular-nums;letter-spacing:-.025em;color:var(--ember-deep)')}>{m.v}</div>
                  <div style={css('margin-top:18px;font:400 14px/1.5 var(--sans);color:var(--ink2);max-width:34ch')}>{m.sub}<a className="src" href={m.src[1]} target="_blank" rel="noopener" title={m.src[0]}>i</a></div>
                </div>
              ))}
            </div>
          </section>

          {/* bridge */}
          <div style={css('padding:50px 36px 14px;max-width:880px')}><div style={css('display:flex;align-items:baseline;gap:16px')}><span style={css('font:600 18px/1 var(--serif);color:var(--ember);flex:none')}>↓</span><p style={css('margin:0;font:500 italic clamp(20px,2.4vw,28px)/1.35 var(--serif);color:var(--ink);max-width:34ch')}>Cooling saves lives in a heatwave. So who actually has it?</p></div></div>

          {/* 03 THE AC GAP */}
          <section style={css('background:var(--surf2);padding:60px 36px 64px;border-top:1px solid var(--rule)')}>
            <div style={css('display:flex;align-items:baseline;gap:14px;margin-bottom:8px')}>
              <span style={css('font:600 11px/1 var(--mono);letter-spacing:.16em;color:var(--ember)')}>03</span>
              <h2 style={css('margin:0;font:600 clamp(30px,3.6vw,46px)/1 var(--serif);letter-spacing:-.015em')}>The Air-Conditioning Gap</h2>
            </div>
            <p style={css('margin:0 0 8px;max-width:64ch;font:400 16px/1.55 var(--sans);color:var(--ink2)')}>{v.acHeadline}. Hatched areas mark countries with no comparable figure on record — the gap in the data is itself part of the story. Click a country to filter the dossier.</p>
            <div style={css('display:flex;flex-direction:column;gap:44px;margin-top:34px')}>
              <div style={css('max-width:780px;width:100%;margin:0 auto')}>
                <div style={css('font:600 10px/1 var(--mono);letter-spacing:.13em;color:var(--mut);text-transform:uppercase;margin-bottom:16px')}>% of homes with AC</div>
                {v.mapEl}
                <div style={css('display:flex;align-items:center;gap:10px;margin-top:20px')}>
                  <span style={css('font:500 10px/1 var(--mono);color:var(--mut)')}>0%</span>
                  <span style={css('flex:1;height:9px;border-radius:2px;background:linear-gradient(90deg,#f5e896,#eeb147,#df6d34,#b02134,#6e1020)')}></span>
                  <span style={css('font:500 10px/1 var(--mono);color:var(--mut)')}>90%</span>
                  <span style={css('width:15px;height:11px;background-image:repeating-linear-gradient(45deg,transparent,transparent 3px,var(--rule) 3px,var(--rule) 4px);border:1px dashed var(--rule);margin-left:8px')}></span>
                  <span style={css('font:500 10px/1 var(--mono);color:var(--mut)')}>no data</span>
                </div>
              </div>
              <div>
                <div style={css('font:600 10px/1 var(--mono);letter-spacing:.13em;color:var(--mut);text-transform:uppercase;margin-bottom:18px')}>Ranked, where measured</div>
                {v.barsEl}
                <div style={css('margin-top:18px;font:400 11.5px/1.5 var(--sans);color:var(--mut)')}>Sources vary by country (ISTAT, ELSTAT, NSO Malta, ADEME, CBS, INE, Verivox); definitions and survey years differ. See each country&apos;s source link in the table below.</div>
              </div>
            </div>

            <h3 style={css('margin:48px 0 4px;font:600 20px/1.2 var(--serif)')}>By setting</h3>
            <p style={css('margin:0 0 18px;font:400 14px/1.5 var(--sans);color:var(--mut)')}>Where cooling is — and isn&apos;t — installed.</p>
            <table style={css('width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums')}>
              <thead><tr style={css('border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)')}>
                <th style={css('text-align:left;padding:10px 12px;font:600 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut);text-transform:uppercase')}>Country</th>
                <th style={css('text-align:left;padding:10px 12px;font:600 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut);text-transform:uppercase')}>Setting</th>
                <th style={css('text-align:right;padding:10px 12px;font:600 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut);text-transform:uppercase')}>% with AC</th>
                <th style={css('text-align:left;padding:10px 12px;font:600 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut);text-transform:uppercase')}>Note</th>
              </tr></thead>
              <tbody>
                {v.settingView.map((s: any, i: number) => (
                  <tr key={i} style={css('border-bottom:1px solid var(--rule)')}>
                    <td style={css('padding:13px 12px;font:600 14px/1.3 var(--sans)')}>{s.iso}</td>
                    <td style={css('padding:13px 12px;font:400 14px/1.3 var(--sans);color:var(--ink2)')}>{s.setting}</td>
                    <td style={css('padding:13px 12px;text-align:right;font:600 14px/1.3 var(--mono)')}>{s.pct}%</td>
                    <td style={css('padding:13px 12px;font:400 12.5px/1.4 var(--sans);color:var(--mut)')}>{s.note}</td>
                  </tr>
                ))}
                {v.settingEmpty && (
                  <tr><td colSpan={4} style={css('padding:18px 12px;font:400 13px var(--sans);color:var(--mut2)')}>No by-setting data on record for {v.emptyName}.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          {/* bridge */}
          <div style={css('padding:50px 36px 6px;max-width:880px')}><div style={css('display:flex;align-items:baseline;gap:16px')}><span style={css('font:600 18px/1 var(--serif);color:var(--ember);flex:none')}>↓</span><p style={css('margin:0;font:500 italic clamp(20px,2.4vw,28px)/1.35 var(--serif);color:var(--ink);max-width:38ch')}>Where cooling is scarce, you&apos;d expect every effort to expand it. Often the rules pull the other way.</p></div></div>

          {/* 04 THE RULES */}
          <section style={css('padding:60px 36px 56px')}>
            <div style={css('display:flex;align-items:baseline;gap:14px;margin-bottom:8px')}>
              <span style={css('font:600 11px/1 var(--mono);letter-spacing:.16em;color:var(--ember)')}>04</span>
              <h2 style={css('margin:0;font:600 clamp(30px,3.6vw,46px)/1 var(--serif);letter-spacing:-.015em')}>The Rules</h2>
            </div>
            <p style={css('margin:0 0 26px;max-width:66ch;font:400 16px/1.55 var(--sans);color:var(--ink2)')}>Some rules protect access to cooling; others cap or constrain it. Tags mark whether each rule
              <span style={css('display:inline-block;padding:2px 7px;border-radius:2px;font:600 9.5px/1.4 var(--mono);text-transform:uppercase;background:#fbe3df;color:#a02617')}>restricts</span>,
              <span style={css('display:inline-block;padding:2px 7px;border-radius:2px;font:600 9.5px/1.4 var(--mono);text-transform:uppercase;background:#dff0e2;color:#1f6b34')}>enables</span>, or is
              <span style={css('display:inline-block;padding:2px 7px;border-radius:2px;font:600 9.5px/1.4 var(--mono);text-transform:uppercase;background:#e7eaec;color:#52575e')}>neutral</span>.</p>
            <div style={css('border-top:1px solid var(--ink)')}>
              {v.regsView.map((r: any, i: number) => (
                <div key={i} style={css('display:grid;grid-template-columns:80px 1fr 88px;gap:20px;align-items:start;padding:20px 4px;border-bottom:1px solid var(--rule)')}>
                  <div>
                    <div style={css('font:600 13px/1.2 var(--sans);margin-bottom:8px')}>{r.iso}</div>
                    <span style={css(r.tagStyle)}>{r.effect}</span>
                  </div>
                  <div>
                    <div style={css('font:600 16px/1.3 var(--serif)')}>{r.title}</div>
                    <div style={css('margin-top:5px;font:400 14px/1.5 var(--sans);color:var(--ink2);max-width:62ch')}>{r.summary}<a className="src" href={r.src[1]} target="_blank" rel="noopener" title={r.src[0]}>i</a></div>
                  </div>
                  <div style={css('text-align:right')}>
                    <div style={css('font:600 22px/1 var(--mono);font-variant-numeric:tabular-nums')}>{r.setpoint}</div>
                    <div style={css('font:500 9px/1.4 var(--mono);letter-spacing:.08em;color:var(--mut2);text-transform:uppercase;margin-top:4px')}>setpoint °C</div>
                    <div style={css('font:500 11px/1.4 var(--mono);color:var(--mut);margin-top:8px')}>{r.year} · {r.scope}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* bridge */}
          <div style={css('padding:50px 36px 14px;max-width:880px')}><div style={css('display:flex;align-items:baseline;gap:16px')}><span style={css('font:600 18px/1 var(--serif);color:var(--ember);flex:none')}>↓</span><p style={css('margin:0;font:500 italic clamp(20px,2.4vw,28px)/1.35 var(--serif);color:var(--ink);max-width:34ch')}>Even where cooling is permitted, someone has to pay for it.</p></div></div>

          {/* 05 THE COST */}
          <section style={css('background:var(--surf2);padding:60px 36px 64px;border-top:1px solid var(--rule)')}>
            <div style={css('display:flex;align-items:baseline;gap:14px;margin-bottom:8px')}>
              <span style={css('font:600 11px/1 var(--mono);letter-spacing:.16em;color:var(--ember)')}>05</span>
              <h2 style={css('margin:0;font:600 clamp(30px,3.6vw,46px)/1 var(--serif);letter-spacing:-.015em')}>The Cost</h2>
            </div>
            <p style={css('margin:0 0 28px;max-width:60ch;font:400 16px/1.55 var(--sans);color:var(--ink2)')}>Typical purchase ranges by air-conditioning type, European market.</p>
            <div style={css('display:grid;grid-template-columns:1.6fr 1fr;gap:48px;align-items:start')}>
              <table style={css('width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums')}>
                <thead><tr style={css('border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)')}>
                  <th style={css('text-align:left;padding:10px 12px;font:600 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut);text-transform:uppercase')}>Type</th>
                  <th style={css('text-align:right;padding:10px 12px;font:600 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut);text-transform:uppercase')}>kW</th>
                  <th style={css('text-align:right;padding:10px 12px;font:600 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut);text-transform:uppercase')}>Price range €</th>
                  <th style={css('text-align:left;padding:10px 12px;font:600 10px/1 var(--mono);letter-spacing:.1em;color:var(--mut);text-transform:uppercase')}>Region</th>
                </tr></thead>
                <tbody>
                  {v.prices.map((p: any, i: number) => (
                    <tr key={i} style={css('border-bottom:1px solid var(--rule)')}>
                      <td style={css('padding:14px 12px;font:600 14.5px/1.3 var(--sans)')}>{p.type}</td>
                      <td style={css('padding:14px 12px;text-align:right;font:500 13px/1.3 var(--mono);color:var(--ink2)')}>{p.cap}</td>
                      <td style={css('padding:14px 12px;text-align:right;font:600 14px/1.3 var(--mono)')}>€{p.min}–{p.max}</td>
                      <td style={css('padding:14px 12px;font:400 12.5px/1.3 var(--sans);color:var(--mut)')}>{p.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={css('border:1px solid var(--ember);background:#fff;padding:28px 26px')}>
                <div style={css('font:600 clamp(40px,5vw,60px)/0.9 var(--serif);font-variant-numeric:tabular-nums;color:var(--ember-deep)')}>38%</div>
                <div style={css('margin-top:14px;font:600 15px/1.4 var(--sans)')}>of EU households cannot afford to keep their home adequately cool in summer.<a className="src" href="https://www.eea.europa.eu/en/newsroom/news/climate-change-overheated-and-underprepared" target="_blank" rel="noopener" title="EEA–Eurofound, 2025">i</a></div>
                <p style={css('margin:14px 0 0;font:400 13px/1.6 var(--sans);color:var(--mut)')}>Against these prices, affordability — not just availability — decides who stays cool. A heat pump can cost more than half a year&apos;s median income.</p>
                <div style={css('margin-top:18px;font:500 10px/1.5 var(--mono);color:var(--mut2)')}>Purchase ranges: {v.priceSrc[0]}</div>
              </div>
            </div>
          </section>

          {/* bridge */}
          <div style={css('padding:50px 36px 6px;max-width:880px')}><div style={css('display:flex;align-items:baseline;gap:16px')}><span style={css('font:600 18px/1 var(--serif);color:var(--ember);flex:none')}>↓</span><p style={css('margin:0;font:500 italic clamp(20px,2.4vw,28px)/1.35 var(--serif);color:var(--ink);max-width:34ch')}>So what do Europeans themselves make of all this?</p></div></div>

          {/* 06 WHAT PEOPLE WANT */}
          <section style={css('padding:60px 36px 64px')}>
            <div style={css('display:flex;align-items:baseline;gap:14px;margin-bottom:8px')}>
              <span style={css('font:600 11px/1 var(--mono);letter-spacing:.16em;color:var(--ember)')}>06</span>
              <h2 style={css('margin:0;font:600 clamp(30px,3.6vw,46px)/1 var(--serif);letter-spacing:-.015em')}>What People Want</h2>
            </div>
            <p style={css('margin:0 0 30px;max-width:60ch;font:400 16px/1.55 var(--sans);color:var(--ink2)')}>Public attitudes are conflicted: Europeans increasingly see cooling as essential, yet hesitate over cost and climate impact.</p>
            <div style={css('border-top:1px solid var(--ink)')}>
              {v.surveysView.map((s: any, i: number) => (
                <div key={i} style={css('display:grid;grid-template-columns:120px 1fr;gap:24px;align-items:center;padding:20px 4px;border-bottom:1px solid var(--rule)')}>
                  <div style={css('font:600 clamp(34px,4vw,46px)/0.9 var(--serif);font-variant-numeric:tabular-nums;letter-spacing:-.02em;color:var(--ember)')}>{s.pctStr}</div>
                  <div>
                    <div style={css('height:5px;background:var(--surf2);border-radius:3px;overflow:hidden;margin-bottom:10px;max-width:420px')}><div style={css('height:100%;width:' + s.barW + ';background:var(--ember)')}></div></div>
                    <div style={css('font:400 15px/1.45 var(--sans);color:var(--ink2)')}>of <span style={css('font-weight:600')}>{s.region}</span> respondents {s.q}
                      <span style={css('font:500 11px var(--mono);color:var(--mut2)')}>({s.year})</span><a className="src" href={s.src[1]} target="_blank" rel="noopener" title={s.src[0]}>i</a></div>
                  </div>
                </div>
              ))}
              {v.surveysEmpty && (
                <div style={css('padding:20px 4px;font:400 14px var(--sans);color:var(--mut2)')}>No survey data on record for {v.emptyName}.</div>
              )}
            </div>
          </section>

        </main>

        <footer style={css('padding:56px 36px 64px;border-top:1px solid var(--ink)')}>
          <div style={css('display:flex;flex-wrap:wrap;justify-content:space-between;gap:30px')}>
            <div style={css('max-width:46ch')}>
              <div style={css('font:600 18px/1.2 var(--serif)')}>A note on the evidence</div>
              <p style={css('margin:12px 0 0;font:400 13px/1.6 var(--sans);color:var(--mut)')}>Figures combine official statistics, peer-reviewed studies, and national surveys; definitions, years, and methods vary by source. Every figure carries an <span style={css('color:var(--ember)')}>ⓘ</span> link to its origin. Temperature data is from the Open-Meteo Archive (ERA5) and forecast API.</p>
            </div>
            <div style={css('font:500 11px/1.8 var(--mono);color:var(--mut);text-transform:uppercase;letter-spacing:.08em')}>
              <div>Sources</div>
              <div style={css('color:var(--ink2);text-transform:none;letter-spacing:0;margin-top:8px;font-family:var(--sans);font-size:12px;line-height:1.7')}>
                ISTAT · ELSTAT · NSO Malta · ADEME · CBS · INE · Eurostat<br/>
                EEA · Eurofound · Ballester et al. (Nature Medicine) · WHO<br/>
                EUR-Lex · BOE · Normattiva · Ipsos · Clean Energy Wire
              </div>
            </div>
          </div>
        </footer>

      </div>
    );
  }
}
