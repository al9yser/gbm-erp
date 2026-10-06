import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { request } from '../lib/api';
import type { Counterparty } from '../lib/types';

const emptyForm = {
  name: '',
  type: 'customer' as const,
  phone: '',
  email: '',
  address: '',
  taxNumber: '',
  balance: 0
};

export default function CounterpartiesPage() {
  const [items, setItems] = useState<Counterparty[]>([]);
  const [filter, setFilter] = useState<'all' | 'customer' | 'supplier' | 'both'>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    request<{ counterparties: Counterparty[] }>('/bootstrap').then(data => setItems(data.counterparties ?? [])).catch(() => setItems([]));
  }, []);

  const filtered = items.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = !search || item.name.includes(search) || item.phone.includes(search) || item.email.includes(search);
    return matchesFilter && matchesSearch;
  });

  const handleSave = async () => {
    if (!form.name) return;
    const payload = { ...form, balance: Number(form.balance) };
    if (editingId) {
      const next = await request<Counterparty>(`/counterparties/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      setItems(prev => prev.map(item => item.id === editingId ? next : item));
    } else {
      const next = await request<Counterparty>('/counterparties', { method: 'POST', body: JSON.stringify(payload) });
      setItems(prev => [next, ...prev]);
    }
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف جهة التعامل؟')) return;
    await request(`/counterparties/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">جهات التعامل</h2>
          <button className="btn btn-primary"><Plus size={18} className="ml-2" />إضافة</button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث مباشر" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <option value="all">الكل</option>
            <option value="customer">العملاء</option>
            <option value="supplier">الموردين</option>
            <option value="both">الكلين</option>
          </select>
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilter('all'); }}>إلغاء الفلتر</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-right">الاسم</th>
                <th className="px-3 py-3 text-right">النوع</th>
                <th className="px-3 py-3 text-right">الهاتف</th>
                <th className="px-3 py-3 text-right">البريد</th>
                <th className="px-3 py-3 text-right">الرصيد</th>
                <th className="px-3 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium">{item.name}</td>
                  <td className="px-3 py-3">{item.type}</td>
                  <td className="px-3 py-3">{item.phone}</td>
                  <td className="px-3 py-3">{item.email}</td>
                  <td className="px-3 py-3">{item.balance.toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600" onClick={() => { setForm({ name: item.name, type: item.type, phone: item.phone, email: item.email, address: item.address, taxNumber: item.taxNumber, balance: item.balance }); setEditingId(item.id); }}><Pencil size={16} /></button>
                      <button className="text-red-600" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-xl font-bold">{editingId ? 'تعديل جهة التعامل' : 'إضافة جهة جديد'}</h3>
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="الاسم" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <option value="customer">customer</option>
              <option value="supplier">supplier</option>
              <option value="both">both</option>
            </select>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="الهاتف" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="العنوان" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} placeholder="الرقم الضريبي" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <input value={form.balance} type="number" onChange={e => setForm({ ...form, balance: Number(e.target.value) })} placeholder="الرصيد" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
            <button className="btn btn-primary w-full" onClick={handleSave}>{editingId ? 'تحديث' : 'حفظ'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
