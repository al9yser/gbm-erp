import { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { formatMoney } from '../lib/utils';

export default function HomePage() {
  const [summary, setSummary] = useState({
    totalSales: 181870.5,
    todaySales: 0,
    clients: 2,
    items: 41,
    lowStock: 6,
    recentInvoices: [] as any[]
  });

  useEffect(() => {
    request<{ dashboard: typeof summary }>('/bootstrap').then(data => setSummary(data.dashboard ?? summary)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card p-4"><div className="text-sm text-slate-500">إجمالي المبيعات</div><div className="mt-2 text-2xl font-bold">{formatMoney(summary.totalSales)}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">مبيعات اليوم</div><div className="mt-2 text-2xl font-bold">{formatMoney(summary.todaySales)}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">عدد العملاء</div><div className="mt-2 text-2xl font-bold">{summary.clients}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">عدد الأصناف</div><div className="mt-2 text-2xl font-bold">{summary.items}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">المخزون المنخفض</div><div className="mt-2 text-2xl font-bold">{summary.lowStock}</div></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-5">
          <h3 className="mb-4 text-xl font-bold">آخر الفواتير</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-right">الرقم</th>
                <th className="px-3 py-3 text-right">التاريخ</th>
                <th className="px-3 py-3 text-right">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentInvoices.map((invoice: any, index: number) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="px-3 py-3">{invoice.number}</td>
                  <td className="px-3 py-3">{invoice.date}</td>
                  <td className="px-3 py-3">{formatMoney(invoice.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-xl font-bold">مخزون منخفض</h3>
          <div className="space-y-3">
            {[{ name: 'منتج 1', qty: 3 }, { name: 'منتج 2', qty: 5 }, { name: 'منتج 3', qty: 7 }].map(item => (
              <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>{item.name}</span>
                <span className="status-low rounded-full px-2 py-1 text-xs">{item.qty} متبقي</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
