import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import type { z } from 'zod';

export function loadCsv<T>(absPath: string, schema: z.ZodType<T>): T[] {
  const raw = readFileSync(absPath, 'utf8');
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((rec, i) => {
    const result = schema.safeParse(rec);
    if (!result.success) {
      throw new Error(
        `Invalid row ${i + 2} in ${absPath}: ${result.error.issues
          .map((e) => `${e.path.join('.')} ${e.message}`)
          .join('; ')}`,
      );
    }
    return result.data;
  });
}
