import { z } from 'zod';
import { initTRPC } from '@trpc/server';
import { ensureDatabase, db } from './db';
import { seedReferenceData } from './seed';

const t = initTRPC.create();
const publicProcedure = t.procedure;

export const appRouter = t.router({
  health: publicProcedure.query(() => ({ ok: true })),
  bootstrap: publicProcedure.query(async () => {
    await ensureDatabase();
    const settings = await db.prepare('SELECT * FROM settings WHERE id = ?').get('default');
    const products = await db.prepare('SELECT * FROM products ORDER BY id DESC').all();
    const counterparties = await db.prepare('SELECT * FROM counterparties ORDER BY id DESC').all();
    const documents = await db.prepare('SELECT * FROM documents ORDER BY id DESC LIMIT 20').all();
    const dashboard = {
      totalSales: 181870.5,
      todaySales: 0,
      clients: counterparties.length,
      items: products.length,
      lowStock: products.filter((p: any) => p.stock <= 10).length,
      recentInvoices: documents.map((doc: any) => ({ number: doc.documentNumber, date: doc.transactionDate, total: Number(doc.total) || 0 }))
    };

    return { settings, products, counterparties, documents, dashboard };
  }),
  settings: publicProcedure.query(async () => {
    const row = await db.prepare('SELECT * FROM settings WHERE id = ?').get('default');
    return row ?? { companyName: 'GBM INSULATION CONTRACTING LLC', currencyCode: 'AED1', currencySymbol: 'د.إ', exchangeRate: 3.65, vatPercentage: 5 };
  }),
  settingsUpdate: publicProcedure.input(z.object({
    companyName: z.string(),
    currencyCode: z.string(),
    currencySymbol: z.string(),
    exchangeRate: z.number(),
    vatPercentage: z.number()
  })).mutation(async ({ input }) => {
    await db.prepare('UPDATE settings SET companyName = ?, currencyCode = ?, currencySymbol = ?, exchangeRate = ?, vatPercentage = ? WHERE id = ?')
      .run(input.companyName, input.currencyCode, input.currencySymbol, input.exchangeRate, input.vatPercentage, 'default');
    return input;
  }),
  products: publicProcedure.query(async () => db.prepare('SELECT * FROM products ORDER BY id DESC').all()),
  addProduct: publicProcedure.input(z.object({
    code: z.string(),
    nameAr: z.string(),
    nameEn: z.string(),
    category: z.string(),
    unit: z.string(),
    purchasePrice: z.number(),
    salePrice: z.number(),
    stock: z.number()
  })).mutation(async ({ input }) => {
    const result = await db.prepare('INSERT INTO products (code, nameAr, nameEn, category, unit, purchasePrice, salePrice, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(input.code, input.nameAr, input.nameEn, input.category, input.unit, input.purchasePrice, input.salePrice, input.stock);
    return { id: Number(result.lastInsertRowid), ...input };
  }),
  updateProduct: publicProcedure.input(z.object({
    id: z.number(),
    code: z.string(),
    nameAr: z.string(),
    nameEn: z.string(),
    category: z.string(),
    unit: z.string(),
    purchasePrice: z.number(),
    salePrice: z.number(),
    stock: z.number()
  })).mutation(async ({ input }) => {
    await db.prepare('UPDATE products SET code = ?, nameAr = ?, nameEn = ?, category = ?, unit = ?, purchasePrice = ?, salePrice = ?, stock = ? WHERE id = ?')
      .run(input.code, input.nameAr, input.nameEn, input.category, input.unit, input.purchasePrice, input.salePrice, input.stock, input.id);
    return input;
  }),
  deleteProduct: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    await db.prepare('DELETE FROM products WHERE id = ?').run(input);
    return { ok: true };
  }),
  counterparties: publicProcedure.query(async () => db.prepare('SELECT * FROM counterparties ORDER BY id DESC').all()),
  addCounterparty: publicProcedure.input(z.object({
    name: z.string(),
    type: z.enum(['customer', 'supplier', 'both']),
    phone: z.string(),
    email: z.string(),
    address: z.string(),
    taxNumber: z.string(),
    balance: z.number().default(0)
  })).mutation(async ({ input }) => {
    const result = await db.prepare('INSERT INTO counterparties (name, type, phone, email, address, taxNumber, balance) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(input.name, input.type, input.phone, input.email, input.address, input.taxNumber, input.balance);
    return { id: Number(result.lastInsertRowid), ...input };
  }),
  updateCounterparty: publicProcedure.input(z.object({
    id: z.number(),
    name: z.string(),
    type: z.enum(['customer', 'supplier', 'both']),
    phone: z.string(),
    email: z.string(),
    address: z.string(),
    taxNumber: z.string(),
    balance: z.number().default(0)
  })).mutation(async ({ input }) => {
    await db.prepare('UPDATE counterparties SET name = ?, type = ?, phone = ?, email = ?, address = ?, taxNumber = ?, balance = ? WHERE id = ?')
      .run(input.name, input.type, input.phone, input.email, input.address, input.taxNumber, input.balance, input.id);
    return input;
  }),
  deleteCounterparty: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    await db.prepare('DELETE FROM counterparties WHERE id = ?').run(input);
    return { ok: true };
  }),
  documents: publicProcedure.query(async () => db.prepare('SELECT * FROM documents ORDER BY id DESC').all()),
  reports: publicProcedure.query(async () => ({
    summary: { totalSales: 181870.5, inventoryValue: 597035.04, taxes: 9093.53, stockStatus: 'جيد' },
    daily: [{ date: '2026-09-29', invoices: 1, sales: 50604.96, taxes: 2530.25 }],
    monthly: [{ month: '2026-09', invoices: 1, quotes: 0, sales: 50604.96, taxes: 2530.25 }],
    items: [{ product: 'منتج نموذجي', qty: 42, revenue: 20000, cost: 15000, profit: 5000 }],
    inventory: [{ name: 'منتج نموذجي', qty: 25, cost: 12000, sale: 17000, status: 'جيد' }]
  })),
  addDocument: publicProcedure.input(z.object({
    type: z.enum(['sale', 'quote']),
    documentNumber: z.string(),
    counterpartyId: z.number(),
    transactionDate: z.string(),
    notes: z.string().default(''),
    paymentTerms: z.string().default(''),
    vatPercentage: z.number().default(5),
    manualDiscount: z.number().default(0),
    items: z.array(z.object({
      productId: z.number(),
      productName: z.string(),
      qty: z.number().min(1),
      unitPrice: z.number().min(0),
      discount: z.number().default(0),
      description: z.string().default('')
    })).min(1)
  })).mutation(async ({ input }) => {
    const subtotal = input.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const discount = Math.min(Math.max(input.manualDiscount, 0), subtotal);
    const gross = subtotal - discount;
    const vat = (gross * input.vatPercentage) / 100;
    const total = gross + vat;

    const result = await db.prepare('INSERT INTO documents (type, documentNumber, counterpartyId, transactionDate, notes, paymentTerms, vatPercentage, manualDiscount, subtotal, discount, gross, vat, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(input.type, input.documentNumber, input.counterpartyId, input.transactionDate, input.notes, input.paymentTerms, input.vatPercentage, input.manualDiscount, subtotal, discount, gross, vat, total);

    const docId = Number(result.lastInsertRowid);
    for (const item of input.items) {
      await db.prepare('INSERT INTO document_items (documentId, productId, productName, qty, unitPrice, discount, description) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(docId, item.productId, item.productName, item.qty, item.unitPrice, item.discount, item.description ?? '');
    }

    return { id: docId, ...input, subtotal, discount, gross, vat, total };
  })
});

export type AppRouter = typeof appRouter;

seedReferenceData();
