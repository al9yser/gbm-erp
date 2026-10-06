import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { formatMoney } from '../lib/utils';
import { buildReportHtml, openPrintWindow } from '../printTemplates';

const reportData = {
  summary: {
    totalSales: 181870.5,
    inventoryValue: 597035.04,
    taxes: 9093.53,
    lowStock: 6
  },
  daily: [
    { date: '2026-09-29', invoices: 1, sales: 50604.96, taxes: 2530.25 },
    { date: '2026-08-24', invoices: 1, sales: 61122.6, taxes: 3056.13 },
    { date: '2026-06-20', invoices: 1, sales: 55327.65, taxes: 2766.38 },
    { date: '2026-06-06', invoices: 1, sales: 14815.29, taxes: 740.76 }
  ],
  monthly: [
    { month: '2026-09', invoices: 1, quotes: 2, sales: 50604.96, taxes: 2530.25 },
    { month: '2026-08', invoices: 1, quotes: 0, sales: 61122.60, taxes: 3056.13 },
    { month: '2026-06', invoices: 2, quotes: 1, sales: 70142.94, taxes: 3507.14 }
  ],
  items: [
    { product: 'منتج 1', qty: 214, revenue: 52210.53, cost: 38010.25, profit: 14200.28 },
    { product: 'منتج 2', qty: 108, revenue: 41248.9, cost: 31012.2, profit: 10236.7 }
  ],
  inventory: [
    { name: 'منتج 1', qty: 42, cost: 18000, sale: 22890, status: 'جيد' },
    { name: 'منتج 2', qty: 9, cost: 6400, sale: 8150, status: 'منخفض' }
  ]
};

export default function ReportsPage() {
  const [tab, setTab] = useState<'summary' | 'daily' | 'monthly' | 'items' | 'inventory'>('summary');
  const rows = useMemo(() => reportData[tab] as any[], [tab]);

  const printReport = () => {
    const html = buildReportHtml(tab, reportData);
    openPrintWindow(html);
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {['summary', 'daily', 'monthly', 'items', 'inventory'].map(key => (
              <button
                key={key}
                className={`btn ${tab === key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTab(key as any)}
              >
                {key === 'summary' && 'ملخص عام'}
                {key === 'daily' && 'يومي'}
                {key === 'monthly' && 'شهري'}
                {key === 'items' && 'الأصناف'}
                {key === 'inventory' && 'المخزون'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={printReport}><Printer size={18} className="ml-2" />طباعة هذا التقرير</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {tab === 'summary' && <><th className="px-3 py-3 text-right">العنوان</th><th className="px-3 py-3 text-right">القيمة</th></>}
              {tab === 'daily' && <><th className="px-3 py-3 text-right">التاريخ</th><th className="px-3 py-3 text-right">الفواتير</th><th className="px-3 py-3 text-right">المبيعات</th><th className="px-3 py-3 text-right">الضريبة</th></>}
              {tab === 'monthly' && <><th className="px-3 py-3 text-right">الشهر</th><th className="px-3 py-3 text-right">الفواتير</th><th className="px-3 py-3 text-right">العروض</th><th className="px-3 py-3 text-right">المبيعات</th><th className="px-3 py-3 text-right">الضريبة</th></>}
              {tab === 'items' && <><th className="px-3 py-3 text-right">الصنف</th><th className="px-3 py-3 text-right">الكمية</th><th className="px-3 py-3 text-right">الإيراد</th><th className="px-3 py-3 text-right">التكلفة</th><th className="px-3 py-3 text-right">الربح</th></>}
              {tab === 'inventory' && <><th className="px-3 py-3 text-right">الصنف</th><th className="px-3 py-3 text-right">الكمية</th><th className="px-3 py-3 text-right">قيمة التكلفة</th><th className="px-3 py-3 text-right">قيمة البيع</th><th className="px-3 py-3 text-right">الحالة</th></>}
            </tr>
          </thead>
          <tbody>
            {tab === 'summary' && (
              <>
                <tr className="border-b border-slate-100"><td className="px-3 py-3">إجمالي المبيعات</td><td className="px-3 py-3">{formatMoney(reportData.summary.totalSales)}</td></tr>
                <tr className="border-b border-slate-100"><td className="px-3 py-3">قيمة المخزون</td><td className="px-3 py-3">{formatMoney(reportData.summary.inventoryValue)}</td></tr>
                <tr className="border-b border-slate-100"><td className="px-3 py-3">الضرائب</td><td className="px-3 py-3">{formatMoney(reportData.summary.taxes)}</td></tr>
                <tr className="border-b border-slate-100"><td className="px-3 py-3">حالة المخزون</td><td className="px-3 py-3">{reportData.summary.lowStock} عناصر منخفضة</td></tr>
              </>
            )}
            {tab !== 'summary' && rows.map((row: any, index: number) => (
              <tr key={index} className="border-b border-slate-100">
                {tab === 'daily' && <><td className="px-3 py-3">{row.date}</td><td className="px-3 py-3">{row.invoices}</td><td className="px-3 py-3">{formatMoney(row.sales)}</td><td className="px-3 py-3">{formatMoney(row.taxes)}</td></>}
                {tab === 'monthly' && <><td className="px-3 py-3">{row.month}</td><td className="px-3 py-3">{row.invoices}</td><td className="px-3 py-3">{row.quotes}</td><td className="px-3 py-3">{formatMoney(row.sales)}</td><td className="px-3 py-3">{formatMoney(row.taxes)}</td></>}
                {tab === 'items' && <><td className="px-3 py-3">{row.product}</td><td className="px-3 py-3">{row.qty}</td><td className="px-3 py-3">{formatMoney(row.revenue)}</td><td className="px-3 py-3">{formatMoney(row.cost)}</td><td className="px-3 py-3">{formatMoney(row.profit)}</td></>}
                {tab === 'inventory' && <><td className="px-3 py-3">{row.name}</td><td className="px-3 py-3">{row.qty}</td><td className="px-3 py-3">{formatMoney(row.cost)}</td><td className="px-3 py-3">{formatMoney(row.sale)}</td><td className="px-3 py-3">{row.status}</td></>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
