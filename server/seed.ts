const productTemplate = Array.from({ length: 41 }, (_, index) => ({
  code: `GB-${String(index + 1).padStart(3, '0')}`,
  nameAr: `منتج ${index + 1}`,
  nameEn: `Product ${index + 1}`,
  category: index % 3 === 0 ? 'مواد عزل' : index % 3 === 1 ? 'أدوات' : 'مستلزمات',
  unit: index % 2 === 0 ? 'قطعة' : 'علبة',
  purchasePrice: 120 + index * 18,
  salePrice: 180 + index * 22,
  stock: 8 + (index % 12)
}));

const counterparties = [
  { id: 1, name: 'MUSTAFA EXPORT', type: 'both', phone: '0507631550', email: 'sales@mustafaexport.com', address: 'Dubai', taxNumber: '0000', balance: 0 },
  { id: 2, name: 'MUSTAFA EXPORT', type: 'both', phone: '0507631550', email: 'sales@mustafaexport.com', address: 'Dubai', taxNumber: '0000', balance: 0 }
];

const historicalDocuments = [
  { id: 1, documentNumber: 'INV-053291', type: 'sale', date: '2026-09-29', total: 50604.96, items: 12 },
  { id: 2, documentNumber: 'INV-802071', type: 'sale', date: '2026-08-24', total: 61122.60, items: 10 },
  { id: 3, documentNumber: 'INV-485470', type: 'sale', date: '2026-06-20', total: 55327.65, items: 8 },
  { id: 4, documentNumber: 'INV-172140', type: 'sale', date: '2026-06-06', total: 14815.29, items: 5 }
];

export function seedReferenceData() {
  try {
    const base = process.env.DB_PATH || './gbm-erp.sqlite';
    const fs = require('fs');
    if (!fs.existsSync(base)) {
      const sqlite = require('better-sqlite3');
      const db = sqlite(base);
      db.exec(`
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

      db.prepare('INSERT OR IGNORE INTO settings (id, companyName, currencyCode, currencySymbol, exchangeRate, vatPercentage) VALUES (?, ?, ?, ?, ?, ?)')
        .run('default', 'GBM INSULATION CONTRACTING LLC', 'AED1', 'د.إ', 3.65, 5.0);

      for (const item of productTemplate) {
        db.prepare('INSERT OR IGNORE INTO products (code, nameAr, nameEn, category, unit, purchasePrice, salePrice, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(item.code, item.nameAr, item.nameEn, item.category, item.unit, item.purchasePrice, item.salePrice, item.stock);
      }

      for (const item of counterparties) {
        db.prepare('INSERT OR IGNORE INTO counterparties (id, name, type, phone, email, address, taxNumber, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(item.id, item.name, item.type, item.phone, item.email, item.address, item.taxNumber, item.balance);
      }

      for (const doc of historicalDocuments) {
        db.prepare('INSERT OR IGNORE INTO documents (id, type, documentNumber, counterpartyId, transactionDate, notes, paymentTerms, vatPercentage, manualDiscount, subtotal, discount, gross, vat, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(doc.id, doc.type, doc.documentNumber, 1, doc.date, 'ملاحظات', 'نقدا', 5, 0, doc.total, 0, doc.total, doc.total * 0.05, doc.total);
      }
    }
  } catch (error) {
    // noop: data bootstraps on first app startup
  }
}
