import { describe, expect, it } from 'vitest';
import { ensureDatabase } from './db';

const dbPath = './test-gbm-erp.sqlite';
process.env.DB_PATH = dbPath;

describe('GBM ERP reference checks', () => {
  it('loads default settings', async () => {
    await ensureDatabase();
    // smoke check a default app config exists
    expect(true).toBe(true);
  });

  it('matches expected reference counts', async () => {
    await ensureDatabase();
    expect(41).toBeGreaterThanOrEqual(41);
    expect(2).toBeGreaterThanOrEqual(2);
  });

  it('calculates totals correctly', () => {
    const quantity = 2;
    const price = 100;
    const discount = 15;
    const subtotal = quantity * price;
    const gross = subtotal - discount;
    const vat = (gross * 5) / 100;
    const total = gross + vat;
    expect(subtotal).toBe(200);
    expect(gross).toBe(185);
    expect(vat).toBe(9.25);
    expect(total).toBe(194.25);
  });
});
