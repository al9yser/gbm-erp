import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../drizzle/schema';

const dbFile = process.env.DB_PATH || './gbm-erp.sqlite';
const sqlite = new Database(dbFile);

export const db = drizzle(sqlite, { schema });

export async function ensureDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      companyName TEXT,
      currencyCode TEXT,
      currencySymbol TEXT,
      exchangeRate REAL,
      vatPercentage REAL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      nameAr TEXT,
      nameEn TEXT,
      category TEXT,
      unit TEXT,
      purchasePrice REAL,
      salePrice REAL,
      stock INTEGER
    );

    CREATE TABLE IF NOT EXISTS counterparties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      taxNumber TEXT,
      balance REAL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      documentNumber TEXT,
      counterpartyId INTEGER,
      transactionDate TEXT,
      notes TEXT,
      paymentTerms TEXT,
      vatPercentage REAL,
      manualDiscount REAL,
      subtotal REAL,
      discount REAL,
      gross REAL,
      vat REAL,
      total REAL
    );

    CREATE TABLE IF NOT EXISTS document_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      documentId INTEGER,
      productId INTEGER,
      productName TEXT,
      qty REAL,
      unitPrice REAL,
      discount REAL,
      description TEXT
    );
  `);

  const settingsCount = sqlite.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (!settingsCount.count) {
    sqlite.prepare('INSERT INTO settings (id, companyName, currencyCode, currencySymbol, exchangeRate, vatPercentage) VALUES (?, ?, ?, ?, ?, ?)')
      .run('default', 'GBM INSULATION CONTRACTING LLC', 'AED1', 'د.إ', 3.65, 5.0);
  }
}
