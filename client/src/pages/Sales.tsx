import { useEffect, useMemo, useState } from 'react';
import { FileText, Mail, Plus, Printer, Trash2 } from 'lucide-react';
import { request } from '../lib/api';
import { formatMoney } from '../lib/utils';
import { buildInvoiceHtml, buildMailtoLink, buildWordDocHtml, openPrintWindow } from '../printTemplates';
import type { Document, Product } from '../lib/types';

const emptyDoc = {
  type: 'sale',
  documentNumber: 'INV-1001',
  counterpartyId: 1,
  transactionDate: new Date().toISOString().slice(0, 10),
  notes: '',
  paymentTerms: 'نقدا',
  vatPercentage: 5,
  manualDiscount: 0,
  items: [{ productId: 1, productName: 'منتج تجريبي', qty: 1, unitPrice: 100, discount: 0, description: '' }]
};

export default function SalesPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Document | null>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(emptyDoc);

  useEffect(() => {
    request<{ documents: Document[]; products: Product[] }>('/bootstrap').then(data => {
      setDocuments(data.documents ?? []);
      setProducts(data.products ?? []);
    }).catch(() => {});
  }, []);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const discount = Math.min(Math.max(form.manualDiscount, 0), subtotal);
    const gross = subtotal - discount;
    const vat = (gross * form.vatPercentage) / 100;
    const total = gross + vat;
    return { subtotal, discount, gross, vat, total };
  }, [form]);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productId: 1, productName: 'عنصر جديد', qty: 1, unitPrice: 0, discount: 0, description: '' }] });
  };

  const updateItem = (index: number, field: keyof any, value: any) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const saveDocument = async () => {
    if (!form.items.length) { alert('لا يمكن حفظ مستند بلا بنود'); return; }
    const invalid = form.items.some(item => Number(item.qty) <= 0);
    if (invalid) { alert('لايمكن أن تكون الكمية صفر أو أقل'); return; }

    const payload = { ...form, ...totals };
    const result = await request<Document>('/documents', { method: 'POST', body: JSON.stringify(payload) });
    setDocuments(prev => [result, ...prev]);
    setSelected(result);
  };

  const printInvoice = (doc: Document) => {
    const html = buildInvoiceHtml(doc, { companyName: 'GBM INSULATION CONTRACTING LLC', currencySymbol: 'د.إ' });
    openPrintWindow(html);
  };

  const printWord = (doc: Document) => {
    const html = buildWordDocHtml(doc, 'GBM INSULATION CONTRACTING LLC');
    const file = document.createElement('a');
    file.href = 'data:application/msword;charset=utf-8,' + encodeURIComponent(html);
    file.download = `${doc.documentNumber}.doc`;
    file.click();
  };

  const sendEmail = (doc: Document) => {
    const mailto = buildMailtoLink(doc, 'GBM INSULATION CONTRACTING LLC');
    window.location.href = mailto;
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">سجل المستندات</h2>
          <button className="btn btn-primary" onClick={() => setForm(emptyDoc)}><Plus size={18} className="ml-2" /> مستند جديد</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-5">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-right">الرقم</th>
                <th className="px-3 py-3 text-right">التاريخ</th>
                <th className="px-3 py-3 text-right">النوع</th>
                <th className="px-3 py-3 text-right">الإجمالي</th>
                <th className="px-3 py-3 text-right">الأزرار</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium">{doc.documentNumber}</td>
                  <td className="px-3 py-3">{doc.transactionDate}</td>
                  <td className="px-3 py-3">{doc.type === 'sale' ? 'فاتورة' : 'عرض سعر'}</td>
                  <td className="px-3 py-3">{formatMoney(doc.total)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-secondary" onClick={() => printInvoice(doc)}><Printer size={14} className="ml-1" />طباعة</button>
                      <button className="btn btn-secondary" onClick={() => printWord(doc)}><FileText size={14} className="ml-1" />Word</button>
                      <button className="btn btn-secondary" onClick={() => sendEmail(doc)}><Mail size={14} className="ml-1" />إيميل</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-xl font-bold">إنشاء/Edit مستند</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <option value="sale">فاتورة مبيعات</option>
                <option value="quote">عرض سعر</option>
              </select>
              <input value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            </div>
            <input type="date" value={form.transactionDate} onChange={e => setForm({ ...form, transactionDate: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} placeholder="شروط الدفع" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />

            {form.items.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex justify-between">
                  <span>البند {idx + 1}</span>
                  <button className="text-red-600" onClick={() => removeItem(idx)}><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} placeholder="اسم المنتج" className="rounded-xl border border-slate-200 bg-slate-50 p-2" />
                  <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="الوصف" className="rounded-xl border border-slate-200 bg-slate-50 p-2" />
                  <input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} placeholder="الكمية" className="rounded-xl border border-slate-200 bg-slate-50 p-2" />
                  <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} placeholder="سعر الوحدة" className="rounded-xl border border-slate-200 bg-slate-50 p-2" />
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button className="btn btn-secondary" onClick={addItem}>إضافة بند</button>
              <button className="btn btn-primary" onClick={saveDocument}>حفظ المستند</button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>{formatMoney(totals.discount)}</span></div>
              <div className="flex justify-between"><span>Gross</span><span>{formatMoney(totals.gross)}</span></div>
              <div className="flex justify-between"><span>VAT</span><span>{formatMoney(totals.vat)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatMoney(totals.total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
