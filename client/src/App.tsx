import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Boxes,
  Building2,
  FileText,
  Home,
  Settings as SettingsIcon,
  ShoppingCart,
  Wallet
} from 'lucide-react';
import HomePage from './pages/Home';
import InventoryPage from './pages/Inventory';
import CounterpartiesPage from './pages/Counterparties';
import SalesPage from './pages/Sales';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';

const nav = [
  { key: 'home', label: 'الرئيسية', icon: Home },
  { key: 'inventory', label: 'المخزون', icon: Boxes },
  { key: 'counterparties', label: 'جهات التعامل', icon: Building2 },
  { key: 'sales', label: 'المبيعات', icon: ShoppingCart },
  { key: 'reports', label: 'التقارير', icon: BarChart3 },
  { key: 'settings', label: 'الإعدادات', icon: SettingsIcon }
];

export default function App() {
  const [page, setPage] = useState('home');
  const [device, setDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const pageLabel = useMemo(() => nav.find(item => item.key === page)?.label ?? 'الرئيسية', [page]);

  const renderPage = () => {
    switch (page) {
      case 'inventory': return <InventoryPage />;
      case 'counterparties': return <CounterpartiesPage />;
      case 'sales': return <SalesPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900" dir="rtl">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-72 flex-col bg-[#0F172A] text-white">
          <div className="p-5 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F] text-sm font-bold">GBM</div>
              <div>
                <div className="text-lg font-bold">GBM ERP</div>
                <div className="text-xs text-slate-300">نظام إدارة الأعمال</div>
              </div>
            </div>
          </div>

          <div className="p-4 text-sm text-slate-300">GBM INSULATION</div>
          <nav className="flex-1 space-y-1 p-3">
            {nav.map(item => {
              const Icon = item.icon;
              const active = page === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right ${active ? 'bg-[#1E3A5F] text-white' : 'text-slate-200 hover:bg-slate-800'}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div>
              <div className="text-sm text-slate-500">{now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="text-xl font-bold">{pageLabel}</div>
            </div>

            <div className="flex items-center gap-2">
              <button className={`btn ${device === 'mobile' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDevice('mobile')}>جوال</button>
              <button className={`btn ${device === 'desktop' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDevice('desktop')}>كمبيوتر</button>
            </div>
          </header>

          <div className="p-4 md:p-6">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}
