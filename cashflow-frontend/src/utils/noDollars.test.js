// Cashflow is for Nepal: every amount is NPR. This scans the source so a "$" can never sneak back in.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { formatCurrency } from './formatUtils';

const SRC = join(__dirname, '..');
const sources = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(jsx?|css)$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });

// a "$" that is money text: a "($)" label, USD, a "$" glued to a number, or a "${...}" written as JSX text (right after ">", a label colon or a sign, outside any template literal)
const looksLikeDollar = (line) =>
  /\(\$\)|'USD'/.test(line) || /(^|[^`\w{])\$\d/.test(line) || (!line.includes('`') && /(>|\w: |''\})\$\{/.test(line));

describe('NPR everywhere', () => {
  it('no source file formats money with a dollar sign', () => {
    const hits = sources(SRC).flatMap((file) =>
      readFileSync(file, 'utf8').split('\n').flatMap((line, i) => (looksLikeDollar(line) ? [`${file.replace(SRC, 'src')}:${i + 1}: ${line.trim()}`] : [])),
    );
    expect(hits).toEqual([]);
  });

  it('no money is formatted with en-US grouping (Nepal groups as 1,00,000)', () => {
    const hits = sources(SRC).flatMap((file) =>
      readFileSync(file, 'utf8').split('\n').flatMap((line, i) =>
        /(toLocaleString|NumberFormat)\(\s*'en-US'/.test(line) && /amount|balance|total|income|expense|saved|target|fmt|average/i.test(line) ? [`${file.replace(SRC, 'src')}:${i + 1}`] : []),
    );
    expect(hits).toEqual([]);
  });

  it('formatCurrency (used by the Transactions page) says NPR with lakh grouping', () => {
    expect(formatCurrency(123456.5)).toBe('NPR 1,23,456.50');
  });

  it('formatCurrency keeps negatives readable', () => {
    expect(formatCurrency(-350)).toBe('−NPR 350.00');
  });
});
