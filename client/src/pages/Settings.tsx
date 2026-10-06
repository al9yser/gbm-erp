import { useEffect, useState } from 'react';
import { request } from '../lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'GBM INSULATION CONTRACTING LLC',
    currencyCode: 'AED1',
    currencySymbol: 'د.إ',
    exchangeRate: 3.65,
    vatPercentage: 5
  });

  useEffect(() => {
    request<{ settings: typeof settings }>('/settings').then(data => {
      setSettings(data.settings ?? settings);
    }).catch(() => {});
  }, []);

  const update = (field: keyof typeof settings, value: string | number) => setSettings(prev => ({ ...prev, [field]: value }));

  const save = async () => {
    await request('/settings', { method: 'PUT', body: JSON.stringify(settings) });
  };

  return (
    <div className="card mx-auto max-w-3xl p-6">
      <h2 className="mb-5 text-2xl font-bold">الإعدادات</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <input value={settings.companyName} onChange={e => update('companyName', e.target.value)} placeholder="اسم الشركة" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
        <input value={settings.currencyCode} onChange={e => update('currencyCode', e.target.value)} placeholder="كود العملة" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
        <input value={settings.currencySymbol} onChange={e => update('currencySymbol', e.target.value)} placeholder="رمز العملة" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
        <input type="number" step="0.0001" value={settings.exchangeRate} onChange={e => update('exchangeRate', Number(e.target.value))} placeholder="سعر الصرف" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5" />
        <input type="number" step="0.01" value={settings.vatPercentage} onChange={e => update('vatPercentage', Number(e.target.value))} placeholder="نسبة VAT" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 md:col-span-2" />
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
        <div className="mb-2 font-bold">معاينة مباشرة</div>
        <div>سعر الصرف: {settings.exchangeRate}</div>
        <div>ضريبة القيمة المضافة: {settings.vatPercentage}%</div>
        <div>ملفات الطباعة ستستخدم: {settings.companyName}</div>
      </div>

      <button className="btn btn-primary mt-6" onClick={save}>حفظ الإعدادات</button>
    </div>
  );
}
