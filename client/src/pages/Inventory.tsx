import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, Boxes, Pencil, Plus, Search, Trash2, TrendingUp } from 'lucide-react';
import { request } from '../lib/api';
import { formatMoney, marginPercent } from '../lib/utils';
import type { Product } from '../lib/types';

const initialProduct = {
  code: '',
  nameAr: '',
  nameEn: '',
  category: 'أخرى',
  unit: 'قطعة',
  purchasePrice: 0,
  salePrice: 0,
  stock: 0
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [form, setForm] = useState(initialProduct);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    request<{ products: Product[] }>('/bootstrap').then(data => setProducts(data.products ?? [])).catch(() => setProducts([]));
  }, []);

  const categories = useMemo(() => Array.from(new Set(products.map(item => item.category))), [products]);

  const filtered = products.filter(product => {
    const q = search.toLowerCase();
    const matchesText = !q || product.code.toLowerCase().includes(q) || product.nameAr.includes(q) || product.nameEn.toLowerCase().includes(q);
    const matchesCategory = category === 'all' || product.category === category;
    return matchesText && matchesCategory;
  });

  const handleSave = async () => {
    if (!form.code || !form.nameAr || !form.nameEn) return;
    const payload = { ...form, purchasePrice: Number(form.purchasePrice), salePrice: Number(form.salePrice), stock: Number(form.stock) };

    if (editingId) {
      const next = await request<Product>(`/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      setProducts(prev => prev.map(item => item.id === editingId ? next : item));
    } else {
      const next = await request<Product>('/products', { method: 'POST', body: JSON.stringify(payload) });
      setProducts(prev => [next, ...prev]);
    }

    setForm(initialProduct);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
    await request(`/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(item => item.id !== id));
  };

  const stockState = (stock: number) => {
    if (stock <= 0) return { label: 'نفد', className: 'status-out' };
    if (stock <= 10) return { label: 'منخفض', className: 'status-low' };
    return { label: 'جيد', className: 'status-good' };
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold">إدارة المخزون</h2>
          <button className="btn btn-primary" onClick={() => { setForm(initialProduct); setEditingId(null); }}>
            <Plus size={18} className="ml-2" /> إضافة صنف
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالكود أو الاسم" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3 outline-none" />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <option value="all">كل الفئات</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setCategory('all'); }}>إلغاء الفلتر</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-3 text-right">الكود</th>
                <th className="px-3 py-3 text-right">اسم الصنف</th>
                <th className="px-3 py-3 text-right">الفئة</th>
                <th className="px-3 py-3 text-right">السعر</th>
                <th className="px-3 py-3 text-right">المخزون</th>
                <th className="px-3 py-3 text-right">الهامش</th>
                <th className="px-3 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const status = stockState(item.stock);
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium">{item.code}</td>
                    <td className="px-3 py-3">{item.nameAr}<div className="text-xs text-slate-500">{item.nameEn}</div></td>
                    <td className="px-3 py-3">{item.category}</td>
                    <td className="px-3 py-3">{formatMoney(item.salePrice)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${status.className}`}>{status.label}</span>
                      <div className="text-xs text-slate-500">{item.stock} {item.unit}</div>
                    </td>
                    <td className="px-3 py-3">{marginPercent(item.salePrice, item.purchasePrice).toFixed(1)}%</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button className="text-blue-600" onClick={() => { setForm({...item}); setEditingId(item.id); }}><Pencil size={16} /></button>
                        <button className="text-red-600" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-xl font-bold">{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h3>
          <div className="space-y-3">
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="الكود" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder="الاسم العربي" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} placeholder="الاسم الإنجليزي" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="الفئة" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="الوحدة" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.purchasePrice} type="number" onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} placeholder="سعر الشراء" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
              <input value={form.salePrice} type="number" onChange={e => setForm({ ...form, salePrice: Number(e.target.value) })} placeholder="سعر البيع" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            </div>
            <input value={form.stock} type="number" onChange={e => setForm({ ...form, stock: Number(e.target.value) })} placeholder="كمية المخزون" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <button className="btn btn-primary w-full" onClick={handleSave}>{editingId ? 'تحديث الصنف' : 'حفظ الصنف'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
