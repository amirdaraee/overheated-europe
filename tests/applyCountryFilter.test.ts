// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { filterRows } from '../src/lib/applyCountryFilter';

describe('filterRows', () => {
  it('shows matching country rows and EU rows, hides others; counts country rows', () => {
    document.body.innerHTML = `
      <div id="g">
        <div data-country="IT">it</div>
        <div data-country="FR">fr</div>
        <div data-country="EU">eu</div>
      </div>`;
    const g = document.getElementById('g')!;
    const n = filterRows(g, 'IT');
    expect(n).toBe(1);
    expect((g.children[0] as HTMLElement).hidden).toBe(false); // IT
    expect((g.children[1] as HTMLElement).hidden).toBe(true);  // FR
    expect((g.children[2] as HTMLElement).hidden).toBe(false); // EU always shown
  });

  it('returns 0 when no country rows match', () => {
    document.body.innerHTML = `<div id="g"><div data-country="EU">eu</div></div>`;
    expect(filterRows(document.getElementById('g')!, 'DE')).toBe(0);
  });
});
