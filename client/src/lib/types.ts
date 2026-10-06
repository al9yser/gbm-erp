export type Product = {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
};

export type Counterparty = {
  id: number;
  name: string;
  type: 'customer' | 'supplier' | 'both';
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  balance: number;
};

export type DocumentItem = {
  id?: number;
  productId: number;
  productName: string;
  qty: number;
  unitPrice: number;
  discount: number;
  description: string;
};

export type Document = {
  id: number;
  type: 'sale' | 'quote';
  documentNumber: string;
  counterpartyId: number;
  transactionDate: string;
  notes: string;
  paymentTerms: string;
  vatPercentage: number;
  manualDiscount: number;
  items: DocumentItem[];
  subtotal: number;
  discount: number;
  gross: number;
  vat: number;
  total: number;
};

export type Settings = {
  companyName: string;
  currencyCode: string;
  currencySymbol: string;
  exchangeRate: number;
  vatPercentage: number;
};
